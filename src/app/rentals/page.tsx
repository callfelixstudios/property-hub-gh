import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';

// Fetch live rental listings from Supabase
interface Listing {
  id: string;
  image_src?: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  price: string;
  priceSuffix?: string;
  serviceCharge?: string;
  advance?: string;
  badge?: string;
}

async function fetchRentalListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('transaction_type', 'rent')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching rentals:', error);
    return [];
  }
  return data as Listing[];
}

export default async function RentalsPage() {
  const rentalListings = await fetchRentalListings();
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
        <aside className="w-full md:w-72 flex-shrink-0 bg-white rounded-md shadow-ambient border border-gray-100 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy-base">Filters</h2>
            <button className="text-sm text-gray-500 hover:text-navy-base transition-colors">Reset</button>
          </div>
          {/* Price Range */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-navy-base mb-4">Monthly Rent (GHS)</h3>
            <input type="range" min="500" max="20000" className="w-full accent-navy-base cursor-pointer mb-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₵500</span>
              <span>₵20,000+</span>
            </div>
          </div>
          {/* Rent Advance */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-navy-base mb-4">Advance Duration</h3>
            <div className="space-y-3">
              {['6 Months', '1 Year', '2 Years', 'Flexible'].map((dur) => (
                <label key={dur} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 rounded-[4px] group-hover:border-navy-base transition-colors bg-surface-primary">
                    <input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                    <svg className="w-3.5 h-3.5 text-navy-base opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{dur}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Utilities & Features */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy-base mb-4">Utilities & Features</h3>
            <div className="space-y-3">
              {['Generator / Plant Backup', 'Solar Ready', 'Constant Water Flow', 'Furnished'].map((feat) => (
                <label key={feat} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 rounded-[4px] group-hover:border-navy-base transition-colors bg-surface-primary">
                    <input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                    <svg className="w-3.5 h-3.5 text-navy-base opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{feat}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

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
                  {prop.badge === 'verified' && (
                    <div className="absolute top-3 left-3 bg-navy-base text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Verified
                    </div>
                  )}
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

                  <div className="my-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><span className="font-semibold">{prop.beds}</span> Beds</span>
                    <span className="flex items-center gap-1"><span className="font-semibold">{prop.baths}</span> Baths</span>
                    <span>{prop.area}</span>
                  </div>

                  {/* Financial Transparency Box */}
                  <div className="mt-auto bg-surface-primary p-3 rounded-sm border border-gray-100 flex flex-wrap gap-x-4 gap-y-2 mb-4">
                    <div className="w-full flex items-end justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Rent</span>
                      <div className="text-lg font-extrabold text-navy-base">{prop.price}<span className="text-xs font-normal text-gray-500">{prop.priceSuffix}</span></div>
                    </div>
                    <div className="w-full flex justify-between items-center text-xs">
                      <span className="text-gray-500">Service Charge:</span>
                      <span className="font-semibold text-navy-base">{prop.serviceCharge}</span>
                    </div>
                    <div className="w-full flex justify-between items-center text-xs">
                      <span className="text-gray-500">Required Advance:</span>
                      <span className="font-semibold text-navy-base">{prop.advance}</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link href={`/rentals/${prop.id}`} className="w-full text-center py-2.5 bg-navy-base hover:bg-navy-light text-white font-bold text-sm rounded-sm transition-colors shadow-sm">
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
