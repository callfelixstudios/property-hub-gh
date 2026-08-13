import { generateListingSlug } from '@/utils/slugify';

export interface SitemapListingRow {
  id: string;
  category: string;
  neighborhood: string | null;
  region: string | null;
  updated_at: string | null;
}

export const STATIC_SITEMAP_ENTRIES: { url: string; lastModified: string }[] = [
  { url: '/', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/rentals', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/sales', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/safemove', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/requests', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/terms', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/privacy', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/cookie-policy', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/copyright', lastModified: '2026-08-01T00:00:00.000Z' },
  { url: '/llms.txt', lastModified: '2026-08-01T00:00:00.000Z' },
];

export const ACTIVE_LISTING_QUERY = {
  status: 'active',
  moderation_status: 'approved',
};

export function toListingEntry(
  row: SitemapListingRow,
  origin: string
): { url: string; lastModified: string } {
  const locationStr = [row.neighborhood, row.region].filter(Boolean).join(' ');
  const slug = generateListingSlug(row.category, locationStr, row.id);

  return {
    url: `${origin}/listings/${slug}`,
    lastModified: row.updated_at ?? '',
  };
}

export interface LocationRow {
  transaction_type: 'rent' | 'sale';
  region: string | null;
  neighborhood: string | null;
}

export const LOCATION_ENTRIES_LAST_MODIFIED = '2026-08-13T00:00:00.000Z';

function slugifyLocationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toLocationEntries(
  rows: LocationRow[],
  origin: string
): { url: string; lastModified: string }[] {
  const seen = new Set<string>();
  const entries: { url: string; lastModified: string }[] = [];

  for (const row of rows) {
    const locationName = row.neighborhood || row.region;
    if (!locationName) continue;

    const slug = slugifyLocationName(locationName);
    const path = row.transaction_type === 'rent' ? 'rentals' : 'sales';
    const url = `${origin}/${path}/${slug}`;

    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastModified: LOCATION_ENTRIES_LAST_MODIFIED });
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}