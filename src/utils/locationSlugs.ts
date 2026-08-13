import { ghanaLocations } from '@/data/ghanaLocations';

export function slugifyLocation(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'location';
}

export type LocationKind = 'region' | 'neighborhood';

export interface LocationRef {
  kind: LocationKind;
  region: string;
  neighborhood?: string;
  slug: string;
}

export const LOCATION_INDEX: LocationRef[] = (() => {
  const seen = new Set<string>();
  const index: LocationRef[] = [];
  for (const [region, neighborhoods] of Object.entries(ghanaLocations)) {
    const regionSlug = slugifyLocation(region);
    if (!seen.has(regionSlug)) {
      seen.add(regionSlug);
      index.push({ kind: 'region', region, slug: regionSlug });
    }
    for (const neighborhood of neighborhoods) {
      if (!neighborhood.trim()) continue;
      const slug = slugifyLocation(neighborhood);
      if (seen.has(slug)) continue;
      seen.add(slug);
      index.push({ kind: 'neighborhood', region, neighborhood, slug });
    }
  }
  return index;
})();

export function lookupLocation(slug: string): LocationRef | null {
  const normalized = slugifyLocation(slug);
  return LOCATION_INDEX.find((entry) => entry.slug === normalized) ?? null;
}

export function isSupportedLocation(slug: string): boolean {
  return lookupLocation(slug) !== null;
}
