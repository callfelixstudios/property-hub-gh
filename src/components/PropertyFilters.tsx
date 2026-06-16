'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

const GHANA_LOCATIONS: Record<string, string[]> = {
  "Greater Accra": ["All", "East Legon", "Spintex", "Dzorwulu", "Airport Residential", "Osu", "Cantonments", "Labone", "Madina", "Tema", "Kasoa", "Adenta", "Dansoman"],
  "Ashanti": ["All", "Ahodwo", "Nhyiaeso", "Asokwa", "Bantama", "Adum", "Kwadaso", "Suame", "Tafo", "Knust / Oduom"],
  "Western": ["All", "Takoradi Central", "Anaji", "Effiakuma", "Kwame Nkrumah Circle", "Tarkwa"],
  "Central": ["All", "Cape Coast Castle Area", "Elmina", "Winneba", "Swedru"],
  "Eastern": ["All", "Koforidua", "Nkawkaw", "Aburi", "Nsawam"]
};
const PROPERTY_TYPES = [
  'Apartment/Flat', 'Standalone House', 'Townhouse', 'Chamber & Hall',
  'Single Room', 'Commercial / Office Space', 'Land / Plot'
];

function PropertyFiltersContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { displayCurrency } = useCurrency();

  const isRentalContext = pathname.includes('rentals');

  let maxBounds = 0;
  let stepValue = 0;

  if (isRentalContext) {
    if (displayCurrency === 'GHS') {
      maxBounds = 50000;
      stepValue = 500;
    } else {
      maxBounds = 5000;
      stepValue = 50;
    }
  } else {
    if (displayCurrency === 'GHS') {
      maxBounds = 10000000;
      stepValue = 50000;
    } else {
      maxBounds = 1000000;
      stepValue = 5000;
    }
  }

  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const posterRole = searchParams.get('posterRole') || 'all';
  const beds = searchParams.get('beds') || '';
  const baths = searchParams.get('baths') || '';
  const furnishing = searchParams.get('furnishing') || '';
  const litigationFree = searchParams.get('litigationFree') === 'true';
  
  const region = searchParams.get('region') || '';
  const neighborhood = searchParams.get('neighborhood') || '';
  const propertyType = searchParams.get('propertyType') || 'all';
  const condition = searchParams.get('condition') || 'any';
  const generator = searchParams.get('generator') === 'true';
  const water = searchParams.get('water') === 'true';
  const meter = searchParams.get('meter') === 'true';
  const gated = searchParams.get('gated') === 'true';

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

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateFilters({ region: val || null, neighborhood: null });
  };

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

      {/* 🌍 Select Region */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">🌍 Select Region</h3>
        <select
          value={region}
          onChange={handleRegionChange}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
        >
          <option value="">Any Region</option>
          {Object.keys(GHANA_LOCATIONS).map((reg) => (
            <option key={reg} value={reg}>{reg}</option>
          ))}
        </select>
      </div>

      {/* 📍 Select Neighborhood */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">📍 Select Neighborhood</h3>
        <select
          value={neighborhood}
          onChange={(e) => updateFilters({ neighborhood: e.target.value === 'All' ? null : e.target.value })}
          disabled={!region}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Any Location</option>
          {region && GHANA_LOCATIONS[region]?.map((loc) => (
            <option key={loc} value={loc === 'All' ? '' : loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Property Type */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Property Type</h3>
        <select
          value={propertyType}
          onChange={(e) => updateFilters({ propertyType: e.target.value === 'all' ? null : e.target.value })}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
        >
          <option value="all">All Types</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Condition Switch */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Condition</h3>
        <div className="flex bg-gray-100 p-1 rounded-sm">
          {['any', 'newly_built', 'refurbished', 'fairly_used'].map((cond) => {
            const label = cond === 'any' ? 'Any' : cond === 'newly_built' ? 'Newly Built' : cond === 'refurbished' ? 'Refurbished' : 'Fairly Used';
            return (
              <button
                key={cond}
                onClick={() => updateFilters({ condition: cond === 'any' ? null : cond })}
                className={`flex-1 text-xs py-1.5 rounded-sm capitalize font-medium transition-colors ${
                  condition === cond || (cond === 'any' && !condition)
                    ? 'bg-white shadow-sm text-navy-base'
                    : 'text-gray-500 hover:text-navy-base'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">
          {isRentalContext ? `Monthly Rent (${displayCurrency})` : `Total Price (${displayCurrency})`}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={maxBounds}
            step={stepValue}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
            className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none hover:border-navy-light focus:border-navy-base transition-colors"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            max={maxBounds}
            step={stepValue}
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

      {/* 🛡️ Essential Amenities */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">🛡️ Essential Amenities</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={generator}
              onChange={(e) => updateFilters({ generator: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-navy-base focus:ring-navy-light cursor-pointer"
            />
            <span className="text-xs font-medium text-navy-base group-hover:text-navy-light">Standby Generator</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={water}
              onChange={(e) => updateFilters({ water: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-navy-base focus:ring-navy-light cursor-pointer"
            />
            <span className="text-xs font-medium text-navy-base group-hover:text-navy-light">Borehole / Polyank</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={meter}
              onChange={(e) => updateFilters({ meter: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-navy-base focus:ring-navy-light cursor-pointer"
            />
            <span className="text-xs font-medium text-navy-base group-hover:text-navy-light">Prepaid Meter</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={gated}
              onChange={(e) => updateFilters({ gated: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-navy-base focus:ring-navy-light cursor-pointer"
            />
            <span className="text-xs font-medium text-navy-base group-hover:text-navy-light">Walled & Gated</span>
          </label>
        </div>
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
