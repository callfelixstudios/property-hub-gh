import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import PropertyFilters from '@/components/PropertyFilters';
import PriceDisplay from '@/components/PriceDisplay';

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
  advance?: string;
  badge?: string;
  category?: string;
}

function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function fetchRentalListings(searchParams: { [key: string]: string | string[] | undefined }): Promise<Listing[]> {
  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select('*')
    .eq('transaction_type', 'rent')
    .eq('status', 'active');

  const minPrice = searchParams.minPrice as string;
  const maxPrice = searchParams.maxPrice as string;
  const posterRole = searchParams.posterRole as string;
  const beds = searchParams.beds as string;
  const baths = searchParams.baths as string;
  const furnishing = searchParams.furnishing as string;
  const region = searchParams.region as string;
  const neighborhood = searchParams.neighborhood as string;
  const propertyType = searchParams.propertyType as string;
  const condition = searchParams.condition as string;
  const generator = searchParams.generator as string;
  const water = searchParams.water as string;
  const meter = searchParams.meter as string;
  const gated = searchParams.gated as string;

  if (minPrice) query = query.gte('base_rent', minPrice);
  if (maxPrice) query = query.lte('base_rent', maxPrice);
  if (posterRole && posterRole !== 'all') query = query.eq('poster_role', posterRole);
  if (beds) query = query.gte('bedrooms', beds);
  if (baths) query = query.gte('bathrooms', baths);
  if (furnishing) query = query.eq('furnishing_status', furnishing);
  if (region) query = query.eq('location_region', region);
  if (neighborhood) query = query.eq('location_neighborhood', neighborhood);
  if (propertyType && propertyType !== 'all') query = query.eq('property_type', propertyType);
  if (condition && condition !== 'any') query = query.eq('condition_status', condition);
  if (generator === 'true') query = query.eq('has_generator', true);
  if (water === 'true') query = query.eq('has_water_reservoir', true);
  if (meter === 'true') query = query.eq('has_independent_meter', true);
  if (gated === 'true') query = query.eq('is_walled_gated', true);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching rentals:', error);
    return [];
  }
  
  return (data || []).map((row: any) => {
    const title = row.title || `${formatCategory(row.category)} in ${row.neighborhood || row.region || 'Ghana'}`;
    const location = [row.neighborhood, row.region ? formatCategory(row.region) : null]
      .filter(Boolean)
      .join(', ') || 'Ghana';
    const area = row.category === 'land' 
      ? (row.land_size || 'Plot of land') 
      : (row.square_meters ? `${row.square_meters} sqm` : '—');
    
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
      advance: 'Flexible',
      badge: row.safemove_active ? 'safemove' : undefined,
      category: row.category,
    };
  });
}

export default async function RentalsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const rentalListings = await fetchRentalListings(searchParams);
  return (
    <div className="w-full min-h-screen bg-surface-primary pb-20">
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
              <div key={prop.id} className="bg-white rounded-md overflow-hidden border border-gray-100 shadow-ambient hover:shadow-lg transition-shadow duration-300 flex flex-col">
                {/* 3:2 Image */}
                <div className="relative w-full pt-[66.66%]">
                  <Image src={prop.image_src ?? '/placeholder.png'} alt={prop.title} fill className="object-cover" />
                  {prop.badge === 'safemove' && (
                    <div className="absolute top-3 left-3 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd"/></svg>
                      SafeMove
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

                  {/* Financial Transparency Box */}
                  <div className="mt-auto bg-surface-primary p-3 rounded-sm border border-gray-100 flex flex-wrap gap-x-4 gap-y-2 mb-4">
                    <div className="w-full flex items-end justify-between text-navy-base">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Rent</span>
                      <PriceDisplay 
                        rawPrice={prop.rawPrice} 
                        currency={prop.currency} 
                        priceSuffix={prop.priceSuffix} 
                        rentAdvanceMonths={prop.rentAdvanceMonths} 
                        isRental={true} 
                        serviceCharge={prop.serviceChargeNum}
                      />
                    </div>
                    <div className="w-full flex justify-between items-center text-xs text-navy-base">
                      <span className="text-gray-500">Service Charge:</span>
                      {prop.serviceChargeNum > 0 ? (
                        <PriceDisplay rawPrice={prop.serviceChargeNum} currency={prop.currency} isInline={true} />
                      ) : (
                        <span className="font-semibold text-navy-base">Inclusive</span>
                      )}
                    </div>
                    <div className="w-full flex justify-between items-center text-xs">
                      <span className="text-gray-500">Required Advance:</span>
                      <span className="font-semibold text-navy-base">{prop.advance}</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link href={`/listings/${prop.id}`} className="w-full text-center py-2.5 bg-navy-base hover:bg-navy-light text-white font-bold text-sm rounded-sm transition-colors shadow-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
