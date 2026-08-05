import type { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import PropertyFilters from '@/components/PropertyFilters';
import PriceDisplay from '@/components/PriceDisplay';
import VerifiedBadge from '@/components/VerifiedBadge';
import { generateListingSlug } from '@/utils/slugify';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES } from '@/data/propertyCategories';
import { normalizeRegionForDb, formatRegionForUi } from '@/utils/regionMapper';
import { convertFilterPriceToDb } from '@/utils/currency';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
  description: 'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in East Legon, Cantonments, Kumasi, and across Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/sales',
  },
  openGraph: {
    title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
    description: 'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in Ghana.',
    url: 'https://www.propertyhubgh.com/sales',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

// Fetch live sales listings from Supabase
function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface SalesListingRow {
  id: string;
  title?: string;
  category?: string;
  neighborhood?: string;
  region?: string;
  land_size?: string;
  square_meters?: number;
  media_urls?: string[];
  bedrooms?: number;
  bathrooms?: number;
  outright_price?: number;
  currency?: string;
  safemove_active?: boolean;
  is_verified?: boolean;
}

interface SalesListing {
  id: string;
  image_src: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  rawPrice: number;
  currency: string;
  price_suffix: string;
  dimensions: string;
  badge: 'safemove' | undefined;
  category: string;
  isVerified: boolean;
}

async function fetchSalesListings(searchParams: { [key: string]: string | string[] | undefined }, displayCurrency: string): Promise<SalesListing[]> {
  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select('*')
    .eq('transaction_type', 'sale')
    .eq('status', 'active');

  const posterRole = searchParams.posterRole as string;
  const beds = searchParams.beds as string;
  const baths = searchParams.baths as string;
  const furnishing = searchParams.furnishing as string;
  const litigationFree = searchParams.litigationFree as string;
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
  if (minPriceGhs !== null) query = query.gte('outright_price', minPriceGhs);
  if (maxPriceGhs !== null) query = query.lte('outright_price', maxPriceGhs);
  if (posterRole && posterRole !== 'all') query = query.eq('poster_role', posterRole);
  if (beds) query = query.gte('bedrooms', beds);
  if (baths) query = query.gte('bathrooms', baths);
  if (furnishing) query = query.eq('furnishing_status', furnishing);
  if (litigationFree === 'true') query = query.eq('is_litigation_free', true);
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

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching sales listings:', error);
    return [];
  }
  
  return (data || []).map((row: SalesListingRow) => {
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
      rawPrice: Number(row.outright_price || 0),
      currency: row.currency || 'GHS',
      price_suffix: '',
      dimensions: row.land_size || (row.square_meters ? `${row.square_meters} m²` : '—'),
      badge: row.safemove_active ? 'safemove' : undefined,
      category: row.category || '',
      isVerified: row.is_verified || false,
    };
  });
}

import { cookies } from 'next/headers';

export default async function SalesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('property_hub_currency')?.value || 'GHS';
  const salesListings = await fetchSalesListings(searchParams, displayCurrency);
  return (
    <div className="w-full min-h-screen bg-surface-primary pb-20">
      <JsonLd data={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Sales', url: '/sales' }])} />
      {/* Search Header */}
      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Properties for Sale
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Acquire premium real estate in Ghana. We verify title documents and land registry registrations so you can invest with absolute confidence.
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
            <p className="text-sm text-gray-500 font-medium">Showing {salesListings.length} properties</p>
            <select className="bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors">
              <option>Sort by: Featured</option>
              <option>Sort by: Newest</option>
              <option>Sort by: Lowest Price</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesListings.map((prop) => (
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
                    <div className="my-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><span className="font-semibold">{prop.beds}</span> Beds</span>
                      <span className="flex items-center gap-1"><span className="font-semibold">{prop.baths}</span> Baths</span>
                      <span>{prop.area}</span>
                    </div>
                  )}

                  <div className="mt-auto bg-navy-base p-4 rounded-sm border border-navy-light flex flex-col gap-2 mb-4 text-white">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Outright Price</span>
                      <PriceDisplay 
                        rawPrice={prop.rawPrice} 
                        currency={prop.currency} 
                        priceSuffix={prop.price_suffix} 
                        isRental={false} 
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2">
                      <span className="text-white/70">Dimensions:</span>
                      <span className="font-semibold">{prop.dimensions}</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="w-full text-center py-2.5 bg-accent-gold group-hover:bg-accent-gold/90 text-navy-base font-bold text-sm rounded-sm transition-colors shadow-sm">
                    Inquire Now
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
