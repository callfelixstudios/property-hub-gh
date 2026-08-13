'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, Suspense, useMemo } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES, GHANA_REGIONS } from '@/data/propertyCategories';
import { ghanaLocations } from '@/data/ghanaLocations';
import { getConfigData } from '@/app/actions/configActions';

const PROPERTY_TYPES_BY_USE: Record<string, string[]> = {
  Residential: [...RESIDENTIAL_CATEGORIES],
  Commercial: [...COMMERCIAL_CATEGORIES],
};

function PropertyFiltersContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { displayCurrency } = useCurrency();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  interface NeighborhoodItem { name: string; region: string; }
  interface AmenityItem { id?: string; name: string; slug: string; category: string; is_active?: boolean; sort_order?: number | null; }

  // Dynamic Config State
  const [dynamicRegions, setDynamicRegions] = useState<string[]>([...GHANA_REGIONS]);
  const [dynamicLocations, setDynamicLocations] = useState<Record<string, string[]>>({...ghanaLocations});
  const [dynamicAmenities, setDynamicAmenities] = useState<AmenityItem[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getConfigData();
        if (config.neighborhoods.length > 0) {
          setDynamicRegions([...GHANA_REGIONS]);
          
          const locs: Record<string, string[]> = {};
          GHANA_REGIONS.forEach(r => {
            locs[r] = config.neighborhoods
              .filter((n: NeighborhoodItem) => n.region === r)
              .map((n: NeighborhoodItem) => n.name);
          });
          setDynamicLocations(locs);
        }
        if (config.amenities.length > 0) {
          setDynamicAmenities(config.amenities);
        }
      } catch (err) {
        console.error("Failed to load config", err);
      }
    }
    loadConfig();
  }, []);

  type FilterMode = 'rent' | 'sale' | 'all';

  const typeParam = searchParams.get('type');
  const isSalesContext = pathname.includes('sales');
  const filterMode: FilterMode = pathname.includes('rentals')
    ? 'rent'
    : isSalesContext
      ? 'sale'
      : typeParam === 'rent' || typeParam === 'sale'
        ? typeParam
        : 'all';

  let maxBounds = 0;
  let stepValue = 0;

  if (filterMode === 'rent') {
    if (displayCurrency === 'GHS') {
      maxBounds = 50000;
      stepValue = 500;
    } else {
      maxBounds = 5000;
      stepValue = 50;
    }
  } else if (filterMode === 'sale') {
    if (displayCurrency === 'GHS') {
      maxBounds = 10000000;
      stepValue = 50000;
    } else {
      maxBounds = 1000000;
      stepValue = 5000;
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

  const currentUse = searchParams.get('propertyUse') || 'All';
  const currentType = searchParams.get('propertyType') || 'All';
  const currentRegion = searchParams.get('region') || 'All';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const posterRole = searchParams.get('posterRole') || 'all';
  const beds = searchParams.get('beds') || '';
  const baths = searchParams.get('baths') || '';
  const furnishing = searchParams.get('furnishing') || '';
  const litigationFree = searchParams.get('litigationFree') === 'true';
  const neighborhood = searchParams.get('neighborhood') || '';
  const condition = searchParams.get('condition') || 'any';
  const parkingSpace = searchParams.get('parking_space') || 'any';

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'All' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.delete('page');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const activePropertyTypes = useMemo(() =>
    currentUse === 'All'
      ? Array.from(new Set([...PROPERTY_TYPES_BY_USE.Residential, ...PROPERTY_TYPES_BY_USE.Commercial])).sort()
      : PROPERTY_TYPES_BY_USE[currentUse] || [],
    [currentUse]
  );

  const getAvailableNeighborhoods = useCallback((regionKey: string): string[] => {
    if (regionKey === 'All') return [];

    if (regionKey in dynamicLocations) {
      return dynamicLocations[regionKey] || [];
    }

    const matchedKey = Object.keys(dynamicLocations).find(
      (key) => key.toLowerCase().trim().replace(/_/g, ' ') === regionKey.toLowerCase().trim().replace(/_/g, ' ')
    );

    return matchedKey ? dynamicLocations[matchedKey] : [];
  }, [dynamicLocations]);

  const availableNeighborhoods = useMemo(
    () => getAvailableNeighborhoods(currentRegion),
    [currentRegion, getAvailableNeighborhoods]
  );

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

      {/* Property Use — Pill Tabs */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Property Use</h3>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 w-full">
          {['All', 'Residential', 'Commercial'].map((use) => {
            const isActive = currentUse === use;
            return (
              <button
                key={use}
                type="button"
                onClick={() => {
                  updateFilters({
                    propertyUse: use,
                    propertyType: 'All'
                  });
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {use}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Property Type */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Property Type</h3>
        <select
          value={currentType}
          onChange={(e) => updateFilters({ propertyType: e.target.value })}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
        >
          <option value="All">All Types</option>
          {activePropertyTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* 16 Regions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Region</h3>
        <select
          value={currentRegion}
          onChange={(e) => updateFilters({ region: e.target.value, neighborhood: null })}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
        >
          <option value="All">All of Ghana</option>
          {dynamicRegions.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Neighborhood */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Neighborhood</h3>
        <select
          value={neighborhood}
          onChange={(e) => updateFilters({ neighborhood: e.target.value || null })}
          disabled={!currentRegion || currentRegion === 'All'}
          className="w-full bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Any Location</option>
          {availableNeighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-sm font-bold text-navy-base mb-3 hover:text-navy-light transition-colors"
        >
          <span>Advanced Filters</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Condition */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Condition</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'any', label: 'Any' },
                  { id: 'newly_built', label: 'Newly Built' },
                  { id: 'fairly_used', label: 'Fairly Used' },
                  { id: 'old', label: 'Old' },
                  { id: 'uncompleted', label: 'Uncompleted' },
                  { id: 'under_construction', label: 'Under Construction' }
                ].map(cond => (
                  <button
                    key={cond.id}
                    onClick={() => updateFilters({ condition: cond.id === 'any' ? null : cond.id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      condition === cond.id || (cond.id === 'any' && !condition)
                        ? 'bg-navy-base text-white border-navy-base shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parking Space */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parking Space</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'any', label: 'Any' },
                  { id: 'in_house', label: 'In House' },
                  { id: 'street_side', label: 'Street Side' },
                  { id: 'no_parking', label: 'No Parking' }
                ].map(park => (
                  <button
                    key={park.id}
                    onClick={() => updateFilters({ parking_space: park.id === 'any' ? null : park.id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      parkingSpace === park.id || (park.id === 'any' && !parkingSpace)
                        ? 'bg-navy-base text-white border-navy-base shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                    }`}
                  >
                    {park.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">
          {filterMode === 'rent'
            ? `Monthly Rent (${displayCurrency})`
            : filterMode === 'sale'
              ? `Total Price (${displayCurrency})`
              : `Price (Rent: /mo · Sale: total)`}
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

      {/* Essential Amenities */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-navy-base mb-3">Essential Amenities</h3>
        <div className="grid grid-cols-1 gap-3">
          {Array.from(
            new Map(
              dynamicAmenities
                .filter((a) => currentUse === 'All' || a.category === currentUse.toLowerCase())
                .map((a) => [a.name.trim().toLowerCase(), a])
            ).values()
          ).map((amenity) => {
              const isChecked = searchParams.get(amenity.slug) === 'true';
              return (
                <label key={amenity.slug} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilters({ [amenity.slug]: e.target.checked ? 'true' : null })}
                    className="w-4 h-4 rounded border-gray-300 text-navy-base focus:ring-navy-light cursor-pointer"
                  />
                  <span className="text-xs font-medium text-navy-base group-hover:text-navy-light">{amenity.name}</span>
                </label>
              );
            })}
        </div>
      </div>

      {/* Titled / Litigation-Free Only (Sales Only) */}
      {filterMode !== 'rent' && (
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
    <Suspense fallback={
      <aside className="w-full md:w-72 flex-shrink-0 bg-white rounded-md border border-gray-100 p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      </aside>
    }>
      <PropertyFiltersContent />
    </Suspense>
  );
}
