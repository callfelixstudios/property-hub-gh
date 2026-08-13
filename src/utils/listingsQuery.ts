import { createClient } from '@/utils/supabase/server';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES } from '@/data/propertyCategories';
import { normalizeRegionForDb, formatRegionForUi } from '@/utils/regionMapper';
import { convertFilterPriceToDb } from '@/utils/currency';
import { buildSearchFilter } from '@/utils/searchQuery';
import type { PropertyCardProps } from '@/components/PropertyCard';

export type ListingsMode = 'rent' | 'sale' | 'all';

export type ListingsSort = 'newest' | 'views' | 'price_asc' | 'price_desc';

export const PAGE_SIZE = 12;

export function resolveMode(
  fixedType: 'rent' | 'sale' | undefined,
  typeParam: string | undefined
): ListingsMode {
  if (fixedType === 'rent' || fixedType === 'sale') return fixedType;
  if (typeParam === 'rent' || typeParam === 'sale') return typeParam;
  return 'all';
}

export function resolveSort(raw: string | undefined, mode: ListingsMode): ListingsSort {
  if (raw === 'views') return 'views';
  if (mode !== 'all' && (raw === 'price_asc' || raw === 'price_desc')) return raw;
  return 'newest';
}

export function clampPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function buildPriceClauses(
  minGhs: number | null,
  maxGhs: number | null
): { rent: string | null; sale: string | null } {
  const forColumn = (column: string): string | null => {
    const parts: string[] = [];
    if (minGhs !== null) parts.push(`${column}.gte.${minGhs}`);
    if (maxGhs !== null) parts.push(`${column}.lte.${maxGhs}`);
    return parts.length > 0 ? `and(${parts.join(',')})` : null;
  };
  return { rent: forColumn('base_rent'), sale: forColumn('outright_price') };
}

export interface ListingsPageResult {
  listings: PropertyCardProps[];
  total: number;
  page: number;
  pageCount: number;
  mode: ListingsMode;
}

interface ListingRow {
  id: string;
  title: string | null;
  transaction_type: 'rent' | 'sale';
  category: string;
  neighborhood: string | null;
  region: string;
  base_rent: number | null;
  outright_price: number | null;
  currency: string | null;
  rent_advance_months: number | null;
  advance_period: string | null;
  service_charge: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  media_urls: string[] | null;
  safemove_active: boolean | null;
  is_verified: boolean | null;
  viewing_fee: number | null;
  has_flood_resilience: boolean | null;
  has_solar_backup: boolean | null;
  has_borehole_system: boolean | null;
}

function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function mapRowToCard(row: ListingRow): PropertyCardProps {
  const isRent = row.transaction_type === 'rent';
  return {
    id: row.id,
    imageSrc: row.media_urls?.[0] || '/property-1.png',
    title:
      row.title ||
      `${formatCategory(row.category)} in ${row.neighborhood || row.region || 'Ghana'}`,
    rawPrice: Number(isRent ? row.base_rent : row.outright_price) || 0,
    currency: row.currency || 'GHS',
    priceSuffix: isRent ? '/mo' : '',
    location:
      [row.neighborhood, formatCategory(row.region)].filter(Boolean).join(', ') || 'Ghana',
    beds: row.bedrooms || 0,
    baths: row.bathrooms || 0,
    area: row.square_meters != null ? String(row.square_meters) : undefined,
    badge: row.safemove_active ? 'safemove' : undefined,
    category: row.category || 'Apartment',
    isVerified: row.is_verified || false,
    is_rental: isRent,
    base_rent: row.base_rent ?? undefined,
    outright_price: row.outright_price ?? undefined,
    service_charge: row.service_charge ?? undefined,
    advance_period: row.advance_period ?? undefined,
    rent_advance_months: row.rent_advance_months ?? undefined,
    viewing_fee: row.viewing_fee ?? undefined,
    has_flood_resilience: row.has_flood_resilience ?? false,
    has_solar_backup: row.has_solar_backup ?? false,
    has_borehole_system: row.has_borehole_system ?? false,
  };
}

export async function fetchListingsPage(
  searchParams: { [key: string]: string | string[] | undefined },
  opts: { fixedType?: 'rent' | 'sale'; displayCurrency: string }
): Promise<ListingsPageResult> {
  const mode = resolveMode(opts.fixedType, searchParams.type as string | undefined);
  const page = clampPage(searchParams.page);
  const sort = resolveSort(searchParams.sort as string | undefined, mode);

  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('moderation_status', 'approved');

  if (mode === 'all') {
    query = query.in('transaction_type', ['rent', 'sale']);
  } else {
    query = query.eq('transaction_type', mode);
  }

  const minPriceGhs = convertFilterPriceToDb(searchParams.minPrice, opts.displayCurrency);
  const maxPriceGhs = convertFilterPriceToDb(searchParams.maxPrice, opts.displayCurrency);

  if (mode === 'all') {
    const { rent, sale } = buildPriceClauses(minPriceGhs, maxPriceGhs);
    if (rent && sale) query = query.or(`${rent},${sale}`);
    else if (rent) query = query.or(rent);
    else if (sale) query = query.or(sale);
  } else if (minPriceGhs !== null || maxPriceGhs !== null) {
    const priceColumn = mode === 'rent' ? 'base_rent' : 'outright_price';
    if (minPriceGhs !== null) query = query.gte(priceColumn, minPriceGhs);
    if (maxPriceGhs !== null) query = query.lte(priceColumn, maxPriceGhs);
  }

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

  if (sort === 'views') {
    query = query.order('views', { ascending: false });
  } else if (sort === 'price_asc') {
    query = query.order(mode === 'rent' ? 'base_rent' : 'outright_price', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order(mode === 'rent' ? 'base_rent' : 'outright_price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching listings:', error);
    return { listings: [], total: 0, page: 1, pageCount: 0, mode };
  }

  const listings = (data ?? []).map((row) => mapRowToCard(row as ListingRow));
  const total = count ?? listings.length;
  return {
    listings,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    mode,
  };
}
