import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';

// Fetch live sales listings from Supabase
function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function fetchSalesListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('transaction_type', 'sale')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching sales listings:', error);
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
      price: row.outright_price ? `₵${Number(row.outright_price).toLocaleString()}` : '₵0',
      price_suffix: '',
      dimensions: row.land_size || (row.square_meters ? `${row.square_meters} sqm` : '—'),
      badge: row.legal_status === 'titled' ? 'verified' : (row.safemove_active ? 'safemove' : undefined),
    };
  });
}

export default async function SalesPage() {
  const salesListings = (await fetchSalesListings()) as any[];
  return (
    <div className="w-full min-h-screen bg-surface-primary pb-20">
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
        <aside className="w-full md:w-72 flex-shrink-0 bg-white rounded-md shadow-ambient border border-gray-100 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy-base">Filters</h2>
            <button className="text-sm text-gray-500 hover:text-navy-base transition-colors">Reset</button>
          </div>
          {/* Price Range */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-navy-base mb-4">Total Price (GHS)</h3>
            <input type="range" min="100000" max="10000000" className="w-full accent-navy-base cursor-pointer mb-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₵100K</span>
              <span>₵10M+</span>
            </div>
          </div>
          {/* Premium Filter */}
          <div className="mb-6 p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-sm">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 border border-accent-gold rounded-[4px] bg-white">
                <input type="checkbox" defaultChecked className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                <svg className="w-3.5 h-3.5 text-navy-base opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-navy-base block mb-0.5">Titled / Litigation-Free Only</span>
                <span className="text-xs text-gray-600">Only show properties with verified land registry documents.</span>
              </div>
            </label>
          </div>
        </aside>

        {/* Right Property Feed Grid */}
        <main className="flex-1 w-full">
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
              <div key={prop.id} className="bg-white rounded-md overflow-hidden border border-gray-100 shadow-ambient hover:shadow-lg transition-shadow duration-300 flex flex-col">
                {/* 3:2 Image */}
                <div className="relative w-full pt-[66.66%]">
                  <Image src={prop.image_src ?? '/placeholder.png'} alt={prop.title} fill className="object-cover" />
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

                  <div className="my-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><span className="font-semibold">{prop.beds}</span> Beds</span>
                    <span className="flex items-center gap-1"><span className="font-semibold">{prop.baths}</span> Baths</span>
                    <span>{prop.area}</span>
                  </div>

                  {/* Pricing and Dimensions Box */}
                  <div className="mt-auto bg-navy-base p-4 rounded-sm border border-navy-light flex flex-col gap-2 mb-4 text-white">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Outright Price</span>
                      <div className="text-xl font-extrabold text-white">{prop.price}<span className="text-xs font-normal text-gray-500">{prop.price_suffix}</span></div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2">
                      <span className="text-white/70">Dimensions:</span>
                      <span className="font-semibold">{prop.dimensions}</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link href={`/listings/${prop.id}`} className="w-full text-center py-2.5 bg-accent-gold hover:bg-accent-gold/90 text-navy-base font-bold text-sm rounded-sm transition-colors shadow-sm">
                    Inquire Now
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
