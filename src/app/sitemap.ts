import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  ACTIVE_LISTING_QUERY,
  STATIC_SITEMAP_ENTRIES,
  toListingEntry,
} from '@/utils/sitemapEntries';

const ORIGIN = 'https://www.propertyhubgh.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_SITEMAP_ENTRIES.map(
    (entry) => ({
      url: `${ORIGIN}${entry.url}`,
      lastModified: entry.lastModified,
    })
  );

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) return staticRoutes;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: listings } = await supabase
      .from('listings')
      .select('id, category, neighborhood, region, updated_at')
      .eq('status', ACTIVE_LISTING_QUERY.status)
      .eq('moderation_status', ACTIVE_LISTING_QUERY.moderation_status)
      .order('updated_at', { ascending: false })
      // Single sitemap files cap at ~50k URLs; paginate (e.g. updated_at cursor) and split before exceeding that.
      .limit(1000);

    if (listings && listings.length > 0) {
      const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) =>
        toListingEntry(
          {
            id: listing.id,
            category: listing.category,
            neighborhood: listing.neighborhood,
            region: listing.region,
            updated_at: listing.updated_at,
          },
          ORIGIN
        )
      );

      return [...staticRoutes, ...listingRoutes];
    }
  } catch (err) {
    console.error('Error fetching listings for sitemap:', err);
  }

  return staticRoutes;
}
