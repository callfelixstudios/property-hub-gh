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