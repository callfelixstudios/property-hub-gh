/**
 * Converts human-readable region names from the UI/URL to database-friendly snake_case keys.
 * "Greater Accra" -> "greater_accra"
 * "North East"     -> "north_east"
 */
export function normalizeRegionForDb(region: string | undefined | null): string | null {
  if (!region || region === 'All') return null;

  return region
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Converts database snake_case keys back to human-readable labels.
 * "greater_accra" -> "Greater Accra"
 */
export function formatRegionForUi(dbRegion: string | undefined | null): string {
  if (!dbRegion) return 'All';

  return dbRegion
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
