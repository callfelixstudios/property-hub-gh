'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';

function PropertyFiltersContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isRentalContext = pathname.includes('rentals');

  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const posterRole = searchParams.get('posterRole') || 'all';
  const beds = searchParams.get('beds') || '';
  const baths = searchParams.get('baths') || '';
  const furnishing = searchParams.get('furnishing') || '';
  const litigationFree = searchParams.get('litigationFree') === 'true';

  const updateFilters = useCallback((newFilters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <aside className="w-full md:w-72 flex-shrink-0 bg-white rounded-md shadow-ambient border border-gray-100 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-navy-base">Filters</h2>
        <button 
          onClick={() => router.push(pathname)}
          className="text-sm text-gray-500 hover:text-navy-base transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Listed By */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Listed By</h3>
        <div className="flex bg-gray-100 p-1 rounded-sm">
          {['all', 'owner', 'agent'].map((role) => (
            <button
              key={role}
              onClick={() => updateFilters({ posterRole: role === 'all' ? null : role })}
              className={`flex-1 text-xs py-1.5 rounded-sm capitalize font-medium transition-colors ${
                posterRole === role || (role === 'all' && !posterRole)
                  ? 'bg-white shadow-sm text-navy-base'
                  : 'text-gray-500 hover:text-navy-base'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">
          {isRentalContext ? 'Monthly Rent (GHS)' : 'Total Price (GHS)'}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
            className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none hover:border-navy-light focus:border-navy-base transition-colors"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none hover:border-navy-light focus:border-navy-base transition-colors"
          />
        </div>
      </div>

      {/* Bedrooms / Bathrooms */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy-base mb-3">Beds</h3>
          <select
            value={beds}
            onChange={(e) => updateFilters({ beds: e.target.value })}
            className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-base mb-3">Baths</h3>
          <select
            value={baths}
            onChange={(e) => updateFilters({ baths: e.target.value })}
            className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
      </div>

      {/* Furnishing Status */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Furnishing Status</h3>
        <select
          value={furnishing}
          onChange={(e) => updateFilters({ furnishing: e.target.value })}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
        >
          <option value="">All Types</option>
          <option value="Fully Furnished">Fully Furnished</option>
          <option value="Semi-Furnished">Semi-Furnished</option>
          <option value="Unfurnished">Unfurnished</option>
        </select>
      </div>

      {/* Titled / Litigation-Free Only (Sales Only) */}
      {!isRentalContext && (
        <div className="mb-6 p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-sm">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 border border-accent-gold rounded-[4px] bg-white">
              <input
                type="checkbox"
                checked={litigationFree}
                onChange={(e) => updateFilters({ litigationFree: e.target.checked ? 'true' : null })}
                className="absolute opacity-0 w-full h-full cursor-pointer peer"
              />
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
      )}
    </aside>
  );
}

export default function PropertyFilters() {
  return (
    <Suspense fallback={<aside className="w-full md:w-72 flex-shrink-0 bg-white rounded-md shadow-ambient border border-gray-100 p-6 sticky top-24"><div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div></aside>}>
      <PropertyFiltersContent />
    </Suspense>
  );
}
