import { describe, expect, it } from 'vitest';
import {
  buildPriceClauses,
  clampPage,
  PAGE_SIZE,
  resolveMode,
  resolveSort,
} from './listingsQuery';

describe('resolveMode', () => {
  it('fixedType wins over the type param', () => {
    expect(resolveMode('rent', 'sale')).toBe('rent');
    expect(resolveMode('sale', undefined)).toBe('sale');
  });

  it('uses the type param when there is no fixedType', () => {
    expect(resolveMode(undefined, 'rent')).toBe('rent');
    expect(resolveMode(undefined, 'sale')).toBe('sale');
  });

  it('defaults to all for missing or invalid values', () => {
    expect(resolveMode(undefined, undefined)).toBe('all');
    expect(resolveMode(undefined, 'all')).toBe('all');
    expect(resolveMode(undefined, 'foo')).toBe('all');
  });
});

describe('resolveSort', () => {
  it('defaults to newest for missing or unknown values', () => {
    expect(resolveSort(undefined, 'all')).toBe('newest');
    expect(resolveSort('bogus', 'rent')).toBe('newest');
  });

  it('returns views when requested in any mode', () => {
    expect(resolveSort('views', 'all')).toBe('views');
  });

  it('allows price sorts only in single-type modes', () => {
    expect(resolveSort('price_asc', 'rent')).toBe('price_asc');
    expect(resolveSort('price_desc', 'sale')).toBe('price_desc');
    expect(resolveSort('price_asc', 'all')).toBe('newest');
    expect(resolveSort('price_desc', 'all')).toBe('newest');
  });
});

describe('clampPage', () => {
  it('returns 1 for missing, invalid, and non-positive values', () => {
    expect(clampPage(undefined)).toBe(1);
    expect(clampPage('0')).toBe(1);
    expect(clampPage('-3')).toBe(1);
    expect(clampPage('abc')).toBe(1);
    expect(clampPage([])).toBe(1);
  });

  it('parses valid positive integers and arrays', () => {
    expect(clampPage('2')).toBe(2);
    expect(clampPage(['3'])).toBe(3);
  });
});

describe('buildPriceClauses', () => {
  it('builds one and() clause per price column for min+max', () => {
    expect(buildPriceClauses(100, 5000)).toEqual({
      rent: 'and(base_rent.gte.100,base_rent.lte.5000)',
      sale: 'and(outright_price.gte.100,outright_price.lte.5000)',
    });
  });

  it('handles single-sided ranges', () => {
    expect(buildPriceClauses(100, null)).toEqual({
      rent: 'and(base_rent.gte.100)',
      sale: 'and(outright_price.gte.100)',
    });
  });

  it('returns null for both columns when no price filter is set', () => {
    expect(buildPriceClauses(null, null)).toEqual({ rent: null, sale: null });
  });
});

describe('PAGE_SIZE', () => {
  it('is 12', () => {
    expect(PAGE_SIZE).toBe(12);
  });
});
