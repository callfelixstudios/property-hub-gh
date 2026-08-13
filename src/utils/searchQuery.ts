export function buildSearchFilter(query: string | string[] | undefined | null): string | null {
  if (query === undefined || query === null) return null;
  const value = Array.isArray(query) ? (query[0] ?? '') : query;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const cleaned = trimmed
    .replace(/[%*,]/g, '')
    .replace(/\s+/g, ' ')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, 100);

  if (!cleaned) return null;

  return `title.ilike.%${cleaned}%,neighborhood.ilike.%${cleaned}%,description.ilike.%${cleaned}%`;
}