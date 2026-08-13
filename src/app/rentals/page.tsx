import type { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import PropertyFilters from '@/components/PropertyFilters';
import VerifiedBadge from '@/components/VerifiedBadge';
import PriceDisplay from '@/components/PriceDisplay';
import { generateListingSlug } from '@/utils/slugify';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES } from '@/data/propertyCategories';
import { normalizeRegionForDb, formatRegionForUi } from '@/utils/regionMapper';
import { convertFilterPriceToDb } from '@/utils/currency';
import { buildSearchFilter } from '@/utils/searchQuery';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
  description: 'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent across Accra, Kumasi, East Legon, Cantonments & all regions of Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/rentals',
  },
  openGraph: {
    title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
    description: 'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent in Ghana.',
    url: 'https://www.propertyhubgh.com/rentals',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

// Fetch live rental listings from Supabase
interface Listing {
  id: string;
  image_src?: string;
  media_urls?: string[];
  title: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  rawPrice: number;
  currency: string;
  rentAdvanceMonths: number;
  priceSuffix?: string;
  serviceChargeNum: number;
  computedUpfront: number;
  badge?: string;
  category?: string;
  isVerified?: boolean;
  advance_period?: string;
}

interface RentalListingRow {
  id: string;
  title: string | null;
  category: string;
  neighborhood: string | null;
  region: string;
  bedrooms: number | null;
  bathrooms: number | null;
  land_size: string | null;
  square_meters: number | null;
  base_rent: number | null;
  currency: string | null;
  rent_advance_months: number | null;
  service_charge: number | null;
  media_urls: string[] | null;
  safemove_active: boolean | null;
  is_verified: boolean | null;
  advance_period: string | null;
}

function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatAdvanceDuration(duration?: string | number | null): string {
  if (!duration) return '';
  const normalized = duration.toString().toLowerCase().trim();
  const numericMatch = normalized.match(/\d+/);
  const totalMonths = numericMatch ? parseInt(numericMatch[0], 10) : null;

  if (normalized.includes('24') || normalized.includes('2 year') || normalized.includes('2 yr') || normalized === '2' || totalMonths === 24) return '/2 yrs';
  if (normalized.includes('12') || normalized.includes('1 year') || normalized.includes('1 yr') || normalized === '1' || normalized === 'one' || totalMonths === 12) return '/1 yr';
  if (normalized.includes('6') || normalized.includes('six') || totalMonths === 6) return '/6 mo';
  if (normalized.includes('3') || normalized.includes('three') || totalMonths === 3) return '/3 mo';
  if (totalMonths !== null) return `/${totalMonths} mo`;

  const cleaned = normalized.replace(/\s*months?|\s*years?|\s*advance|\s*upfront/g, '').trim();
  return cleaned ? `/${cleaned}` : '';
}

async function fetchRentalListings(searchParams: { [key: string]: string | string[] | undefined }, displayCurrency: string): Promise<Listing[]> {
  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select('*')
    .eq('transaction_type', 'rent')
    .eq('status', 'active')
    .eq('moderation_status', 'approved');

  const posterRole = searchParams.posterRole as string;
  const beds = searchParams.beds as string;
  const baths = searchParams.baths as string;
  const furnishing = searchParams.furnishing as string;
  const region = searchParams.region as string;
  const neighborhood = searchParams.neighborhood as string;
  const propertyUse = searchParams.propertyUse as string;
  const propertyType = searchParams.propertyType as string;
  const condition = searchParams.condition as string;
  const parkingSpace = searchParams.parking_space as string;
  const ac = searchParams.ac as string;
  const generator = searchParams.generator as string;
  const solar = searchParams.solar as string;
  const water = searchParams.water as string;
  const security = searchParams.security as string;
  const kitchen = searchParams.kitchen as string;
  const meter = searchParams.meter as string;
  const gated = searchParams.gated as string;

  const minPriceGhs = convertFilterPriceToDb(searchParams.minPrice, displayCurrency);
  const maxPriceGhs = convertFilterPriceToDb(searchParams.maxPrice, displayCurrency);
  if (minPriceGhs !== null) query = query.gte('base_rent', minPriceGhs);
  if (maxPriceGhs !== null) query = query.lte('base_rent', maxPriceGhs);
  if (posterRole && posterRole !== 'all') query = query.eq('poster_role', posterRole);
  if (beds) query = query.gte('bedrooms', beds);
  if (baths) query = query.gte('bathrooms', baths);
  if (furnishing) query = query.eq('furnishing_status', furnishing);
  if (region && region !== 'All') {
    const dbSnakeRegion = normalizeRegionForDb(region);
    const uiTitleRegion = formatRegionForUi(dbSnakeRegion);
    if (dbSnakeRegion) {
      query = query.in('region', [region, dbSnakeRegion, uiTitleRegion]);
    } else {
      query = query.ilike('region', `%${region}%`);
    }
  }
  if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);

  // Category filter routing: maps UI propertyUse/propertyType → DB category column
  if (propertyType && propertyType !== 'All') {
    query = query.eq('category', propertyType);
  } else if (propertyUse === 'Residential') {
    query = query.in('category', RESIDENTIAL_CATEGORIES);
  } else if (propertyUse === 'Commercial') {
    query = query.in('category', COMMERCIAL_CATEGORIES);
  }
  if (condition && condition !== 'any') query = query.eq('condition', condition);
  if (parkingSpace && parkingSpace !== 'any') query = query.eq('parking_space', parkingSpace);
  const targetAmenities: string[] = [];
  if (ac === 'true') targetAmenities.push('Air Conditioning');
  if (generator === 'true') targetAmenities.push('Standby Generator / Plant');
  if (solar === 'true') targetAmenities.push('Solar Power System');
  if (water === 'true') targetAmenities.push('Water Reservoir (Polytank)');
  if (security === 'true') targetAmenities.push('24/7 Security');
  if (kitchen === 'true') targetAmenities.push('Fitted Kitchen Cabinets');
  if (meter === 'true') targetAmenities.push('Prepaid Meter');
  if (gated === 'true') targetAmenities.push('Walled & Gated');
  if (targetAmenities.length > 0) {
    query = query.contains('amenities', targetAmenities);
  }

  const search = buildSearchFilter(searchParams.search as string);
  if (search) query = query.or(search);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching rentals:', error);
    return [];
  }
  
  return (data || []).map((row: RentalListingRow) => {
    const title = row.title || `${formatCategory(row.category)} in ${row.neighborhood || row.region || 'Ghana'}`;
    const location = [row.neighborhood, row.region ? formatCategory(row.region) : null]
      .filter(Boolean)
      .join(', ') || 'Ghana';
    const area = row.category === 'land' 
      ? (row.land_size || 'Plot of land') 
      : (row.square_meters ? `${row.square_meters} m²` : '—');
    
    return {
      id: row.id,
      image_src: row.media_urls?.[0] || '/property-1.png',
      title,
      location,
      beds: row.bedrooms || 0,
      baths: row.bathrooms || 0,
      area,
      rawPrice: Number(row.base_rent || 0),
      currency: row.currency || 'GHS',
      rentAdvanceMonths: row.rent_advance_months || 1,
      priceSuffix: '/mo',
      serviceChargeNum: Number(row.service_charge || 0),
      computedUpfront: (row.rent_advance_months || 0) > 0 ? Number(row.base_rent || 0) * (row.rent_advance_months || 1) : Number(row.base_rent || 0),
      badge: row.safemove_active ? 'safemove' : undefined,
      category: row.category,
      isVerified: row.is_verified || false,
      advance_period: row.advance_period ?? undefined,
    };
  });
}

import { cookies } from 'next/headers';

export default async function RentalsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('property_hub_currency')?.value || 'GHS';
  const rentalListings = await fetchRentalListings(searchParams, displayCurrency);
  return (
    <div className="w-full min-h-screen bg-surface-primary pb-20">
      <JsonLd data={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Rentals', url: '/rentals' }])} />
      {/* Search Header */}
      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Rentals in Ghana
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Find verified apartments, single rooms, and houses for rent with fully transparent terms and SafeMove escrow protection.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Left Filter Sidebar */}
        <PropertyFilters />

        {/* Right Property Feed Grid */}
        <main className="flex-1 w-full">
          {/* Seeker Notice Board CTA */}
          <div className="mb-8 bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Can&apos;t find what you&apos;re looking for?</h3>
              <p className="text-emerald-700 text-sm">Post a request on our Seeker Notice Board and let property owners come to you!</p>
            </div>
            <Link href="/request-space" className="shrink-0 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
              Request a Space
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">Showing {rentalListings.length} properties</p>
            <select className="bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors">
              <option>Sort by: Newest</option>
              <option>Sort by: Lowest Price</option>
              <option>Sort by: Highest Price</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rentalListings.map((prop) => (
              <Link href={`/listings/${generateListingSlug(prop.title, prop.location, prop.id)}`} key={prop.id} className="block group cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-ambient hover:shadow-lg transition-shadow duration-300 flex flex-col relative z-0">
                {/* 3:2 Image */}
                <div className="relative">
                  <div className="relative w-full pt-[66.66%] rounded-t-2xl overflow-hidden">
                    <Image src={prop.image_src ?? '/placeholder.png'} alt={prop.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  {prop.badge === 'safemove' && (
                    <div className="absolute top-3 left-3 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm z-10">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd"/></svg>
                      SafeMove
                    </div>
                  )}
                  {prop.isVerified && (
                    <div className="absolute top-3 right-3 z-10">
                      <VerifiedBadge />
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-navy-base line-clamp-1 mb-1">{prop.title}</h3>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {prop.location}
                      </div>
                    </div>
                  </div>

                  {(prop.category || '').toLowerCase() === 'plot of land' ? (
                    <div className="my-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-accent-emerald font-bold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified Plot / Acreage
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-auto pt-3 pb-3 border-t border-gray-100 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                          <path d="M23.961 16.171C23.998 16.072 24.011 15.963 23.977 15.853L22 9.428V3.50005C22 2.12206 20.879 1.00006 19.5 1.00006H4.5C3.12098 1.00006 2.00002 2.12206 2.00002 3.50005V9.42804L0.0230156 15.853C-0.0109688 15.962 0.00201563 16.071 0.039 16.171C0.015 16.277 0 16.386 0 16.5V20.5V22.5C0 22.776 0.224016 23 0.500016 23H2.50003C2.77598 23 3 22.776 3 22.5V21H21V22.5C21 22.776 21.224 23 21.5 23H23.5C23.776 23 24 22.776 24 22.5V20.5V16.5C24 16.386 23.985 16.277 23.961 16.171ZM3 3.50005C3 2.67303 3.67298 2.00005 4.5 2.00005H19.5C20.327 2.00005 21 2.67303 21 3.50005V9.00003H19.641L19.175 7.13604C19.007 6.46704 18.408 6.00003 17.719 6.00003H14.5C13.673 6.00003 13 6.67301 13 7.50003V9.00003H11V7.50101C11 6.674 10.327 6.00101 9.49997 6.00101H6.28097C5.59195 6.00101 4.99298 6.46901 4.82498 7.13703L4.359 9.00003H3V3.50005ZM18.614 9.80801C18.518 9.93003 18.374 10 18.219 10H14.5C14.225 10 14 9.776 14 9.5V7.50003C14 7.22403 14.225 7.00001 14.5 7.00001H17.72C17.95 7.00001 18.149 7.15503 18.205 7.37801L18.705 9.37803C18.743 9.52901 18.71 9.68501 18.614 9.80801ZM10.001 7.50003V9.49503C10.001 9.49704 10 9.49803 10 9.50004C10 9.50103 10 9.50206 10 9.50206C9.99905 9.77708 9.77503 10.0001 9.50105 10.0001H5.78203C5.62603 10.0001 5.48302 9.93008 5.38702 9.80806C5.29102 9.68506 5.25802 9.52808 5.29603 9.37808L5.79605 7.37806C5.85206 7.15606 6.05105 7.00006 6.28205 7.00006H9.50105C9.77602 7.00001 10.001 7.22403 10.001 7.50003ZM2.86898 10H4.374C4.42702 10.15 4.49602 10.294 4.59698 10.424C4.88498 10.79 5.316 11 5.781 11H9.50002C10.151 11 10.701 10.58 10.908 10H13.092C13.299 10.581 13.849 11 14.5 11H18.219C18.684 11 19.114 10.79 19.402 10.424C19.503 10.295 19.572 10.15 19.625 10H21.131L22.675 15.018C22.617 15.011 22.56 15 22.5 15H1.5C1.44 15 1.383 15.011 1.326 15.018L2.86898 10ZM2.00002 22H0.999984V21H1.99997V22H2.00002ZM23 22H22V21H23V22ZM23 20H0.999984V16.5C0.999984 16.224 1.22498 16 1.5 16H22.5C22.775 16 23 16.224 23 16.5V20Z"/>
                        </svg>
                        <span>{prop.beds || 0} Rooms</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                          <path d="M22.5 11H22V3.00002C22 1.897 21.103 1 20 1C18.8969 1 18 1.89695 18 2.99903L17.999 3.50003C17.9985 3.77641 18.2217 4.00052 18.498 4.00103C18.7744 4.00103 18.9985 3.77791 18.999 3.502L19 3.00006C19 2.44881 19.4487 2.00008 20 2.00008C20.5512 2.00008 21 2.44872 21 3.00002V11H1.5C0.672844 11 0 11.6729 0 12.5C0 13.151 0.41925 13.7008 0.999984 13.9079V15.5C0.999984 17.7951 2.19877 19.8115 3.99998 20.9685V23.5C3.99998 23.7764 4.22363 24 4.5 24H5.49998C5.68945 24 5.86228 23.8931 5.94727 23.7236L6.82683 21.9649C7.04822 21.9878 7.2727 22 7.5 22H16.5C16.7273 22 16.9518 21.9878 17.1732 21.9649L18.0527 23.7236C18.1377 23.8931 18.3105 24 18.5 24H19.5C19.7764 24 20 23.7764 20 23.5V20.9684C21.8012 19.8115 23 17.795 23 15.5V13.9079C23.5807 13.7008 24 13.151 24 12.5C24 11.6729 23.3272 11 22.5 11ZM6 12H11V16.9097L6 16.0767V12ZM0.999984 12.5C0.999984 12.2241 1.22414 12 1.5 12H5.00002V13H1.5C1.22414 13 0.999984 12.7759 0.999984 12.5ZM5.19094 23H5.00002V21.4985C5.26013 21.6073 5.53097 21.6938 5.80683 21.7685L5.19094 23ZM19 23H18.8091L18.1932 21.7685C18.469 21.6939 18.7399 21.6073 19 21.4985V23ZM22 15.5C22 18.5327 19.5327 21 16.5 21H7.5C4.46728 21 2.00002 18.5327 2.00002 15.5V14H5.00002V16.5C5.00002 16.7446 5.17678 16.9531 5.418 16.9932L11.418 17.9932C11.4453 17.9976 11.4727 18 11.5 18C11.6177 18 11.7324 17.9585 11.8233 17.8814C11.9356 17.7866 12 17.647 12 17.5V14H22L22 15.5ZM22.5 13H12V12H22.5C22.7759 12 23 12.2241 23 12.5C23 12.7759 22.7759 13 22.5 13Z"/>
                        </svg>
                        <span>{prop.baths || 0} Baths</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                          <path fillRule="evenodd" clipRule="evenodd" d="M1.5 5.7V1.5H5.7V5.7H1.5ZM0 1C0 0.447715 0.447715 0 1 0H6.2C6.75228 0 7.2 0.447715 7.2 1V6.2C7.2 6.75228 6.75228 7.2 6.2 7.2H4.35V16.8H6.2C6.75228 16.8 7.2 17.2477 7.2 17.8V23C7.2 23.5523 6.75228 24 6.2 24H1C0.447715 24 0 23.5523 0 23V17.8C0 17.2477 0.447715 16.8 1 16.8H2.85V7.2H1C0.447715 7.2 0 6.75228 0 6.2V1ZM18.3 1.5H22.5V5.7H18.3V1.5ZM16.8 1C16.8 0.447715 17.2477 0 17.8 0H23C23.5523 0 24 0.447715 24 1V6.2C24 6.75228 23.5523 7.2 23 7.2H21.15V16.8H23C23.5523 16.8 24 17.2477 24 17.8V23C24 23.5523 23.5523 24 23 24H17.8C17.2477 24 16.8 23.5523 16.8 23V21.15H7.2V19.65H16.8V17.8C16.8 17.2477 17.2477 16.8 17.8 16.8H19.65V7.2H17.8C17.2477 7.2 16.8 6.75228 16.8 6.2V4.35L7.2 4.35V2.85L16.8 2.85V1ZM22.5 18.3H18.3V22.5H22.5V18.3ZM1.5 22.5V18.3H5.7V22.5H1.5Z"/>
                        </svg>
                        <span className="whitespace-nowrap">{prop.area || '—'}</span>
                      </div>
                    </div>
                  )}

                  {/* Financial Transparency Box */}
                  <div className="mt-auto bg-surface-primary p-3 rounded-sm border border-gray-100 space-y-1.5 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Rent</span>
                      <span className="text-sm font-extrabold text-navy-base flex items-center">
                        <PriceDisplay rawPrice={prop.rawPrice} currency={prop.currency} isInline />
                        {prop.priceSuffix && <span className="text-xs font-semibold text-slate-400 ml-0.5">{prop.priceSuffix}</span>}
                      </span>
                    </div>
                    {prop.serviceChargeNum > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Service Charge</span>
                        <span className="font-semibold text-slate-700 flex items-center">
                          <PriceDisplay rawPrice={prop.serviceChargeNum} currency={prop.currency} isInline />
                          <span className="text-[10px] font-semibold text-slate-400 ml-0.5">/mo</span>
                        </span>
                      </div>
                    )}
                    {prop.rentAdvanceMonths > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Required Advance</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <PriceDisplay rawPrice={prop.computedUpfront} currency={prop.currency} isInline />
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                            {formatAdvanceDuration(prop.advance_period)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Primary CTA */}
                  <div className="w-full text-center py-2.5 bg-navy-base group-hover:bg-navy-light text-white font-bold text-sm rounded-sm transition-colors shadow-sm">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
