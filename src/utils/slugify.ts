export function generateListingSlug(title: string | undefined, location: string | undefined, id: string | number): string {
  const safeTitle = (title || 'property').toString().toLowerCase();
  const safeLocation = (location || '').toString().toLowerCase();

  const combined = `${safeTitle} ${safeLocation}`.trim();
  
  // Replace non-alphanumeric characters with spaces, then collapse multiple spaces into single hyphens
  const slugified = combined
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slugified}-${id}`;
}
