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