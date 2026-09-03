import { createClient } from '@/utils/supabase/server';
import { lookupLocation, type LocationRef } from '@/utils/locationSlugs';
import { formatRegionForUi, normalizeRegionForDb } from '@/utils/regionMapper';

interface LocationListingRow {
  id: string;
  title: string | null;
  transaction_type: 'rent' | 'sale';
  category: string;
  neighborhood: string | null;
  region: string;
  base_rent: number | null;
  outright_price: number | null;
  currency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  image_url: string | null;
  media_urls: string[] | null;
  is_verified: boolean | null;
  safemove_active: boolean | null;
  boosted_until: string | null;
}

export interface LocationListing {
  id: string;
  imageSrc: string;
  title: string;
  rawPrice?: number;
  currency: string;
  priceSuffix?: string;
  location: string;
  beds?: number;
  baths?: number;
  area?: string;
  badge?: 'verified' | 'new' | 'safemove' | 'boosted';
  category?: string;
  isVerified?: boolean;
  isBoosted?: boolean;
  is_rental: boolean;
}

export interface LocationPageStats {
  min: number;
  max: number;
  count: number;
}

export interface LocationPageData {
  ref: LocationRef;
  listings: LocationListing[];
  stats: LocationPageStats;
  dominantCategory: string;
}

function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRegion(str?: string) {
  return str
    ? str
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';
}

function dominantCategoryOf(rows: LocationListingRow[]): string {
  const counts = new Map<string, number>();
  let dominant = rows[0]?.category || 'Property';
  let maxCount = 0;
  for (const row of rows) {
    const key = row.category || 'Property';
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    if (count > maxCount) {
      maxCount = count;
      dominant = key;
    }
  }
  return dominant;
}

export async function getLocationData(
  locationSlug: string,
  transactionType: 'rent' | 'sale'
): Promise<LocationPageData | null> {
  const ref = lookupLocation(locationSlug);
  if (!ref) return null;

  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select(
      'id, title, transaction_type, category, neighborhood, region, base_rent, outright_price, currency, bedrooms, bathrooms, square_meters, image_url, media_urls, is_verified, safemove_active, boosted_until'
    )
    .eq('transaction_type', transactionType)
    .eq('status', 'active')
    .eq('moderation_status', 'approved');

  if (ref.kind === 'region') {
    const dbSnake = normalizeRegionForDb(ref.region) ?? ref.region;
    const uiTitle = formatRegionForUi(dbSnake);
    query = query.in('region', [ref.region, dbSnake, uiTitle]);
  } else {
    query = query.ilike('neighborhood', `%${ref.neighborhood}%`);
  }

  const { data, error } = await query
    .order('boosted_until', { ascending: false, nullsFirst: false })
    .order('tier_rank', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching location listings:', error);
    return null;
  }

  const rows = (data || []) as LocationListingRow[];
  if (rows.length === 0) return null;

  const isRent = transactionType === 'rent';
  const now = Date.now();
  const listings: LocationListing[] = rows.map((row) => {
    const isBoosted = !!row.boosted_until && new Date(row.boosted_until).getTime() > now;
    return {
      id: row.id,
      imageSrc: row.image_url || row.media_urls?.[0] || '/property-1.webp',
      title:
        row.title ||
        `${formatCategory(row.category)} in ${row.neighborhood || formatRegion(row.region) || 'Ghana'}`,
      rawPrice: (isRent ? row.base_rent : row.outright_price) ?? undefined,
      currency: row.currency || 'GHS',
      priceSuffix: isRent ? '/mo' : undefined,
      location: [row.neighborhood, formatRegion(row.region)].filter(Boolean).join(', '),
      beds: row.bedrooms ?? undefined,
      baths: row.bathrooms ?? undefined,
      area: row.square_meters != null ? String(row.square_meters) : undefined,
      badge: isBoosted ? 'boosted' : row.is_verified ? 'verified' : row.safemove_active ? 'safemove' : undefined,
      category: row.category || 'Apartment',
      isVerified: !!row.is_verified,
      isBoosted,
      is_rental: isRent,
    };
  });

  const prices = rows
    .map((row) => Number(isRent ? row.base_rent : row.outright_price))
    .filter((n) => Number.isFinite(n));

  return {
    ref,
    listings,
    stats: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      count: rows.length,
    },
    dominantCategory: dominantCategoryOf(rows),
  };
}
