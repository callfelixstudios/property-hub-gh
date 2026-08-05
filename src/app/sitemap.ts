import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generateListingSlug } from '@/utils/slugify';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.propertyhubgh.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/rentals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sales`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/safemove`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/requests`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) return staticRoutes;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: listings } = await supabase
      .from('listings')
      .select('id, category, neighborhood, region, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (listings && listings.length > 0) {
      const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => {
        const locationStr = [listing.neighborhood, listing.region].filter(Boolean).join(' ');
        const slug = generateListingSlug(listing.category, locationStr, listing.id);

        return {
          url: `${baseUrl}/listings/${slug}`,
          lastModified: listing.created_at ? new Date(listing.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      });

      return [...staticRoutes, ...listingRoutes];
    }
  } catch (err) {
    console.error('Error fetching listings for sitemap:', err);
  }

  return staticRoutes;
}
