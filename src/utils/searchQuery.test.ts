import { describe, expect, it } from 'vitest';
import { buildSearchFilter } from './searchQuery';

describe('buildSearchFilter', () => {
  it('returns null for undefined and null', () => {
    expect(buildSearchFilter(undefined)).toBeNull();
    expect(buildSearchFilter(null)).toBeNull();
  });

  it('uses the first value when searchParams passes an array', () => {
    expect(buildSearchFilter(['East Legon', 'Osu'])).toBe(
      'title.ilike.%East Legon%,neighborhood.ilike.%East Legon%,description.ilike.%East Legon%'
    );
    expect(buildSearchFilter(['  '])).toBeNull();
    expect(buildSearchFilter([])).toBeNull();
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(buildSearchFilter('')).toBeNull();
    expect(buildSearchFilter('   ')).toBeNull();
    expect(buildSearchFilter('\t\n ')).toBeNull();
  });

  it('strips %, commas, and asterisks from the input', () => {
    expect(buildSearchFilter('east%,*legon')).toBe(
      'title.ilike.%eastlegon%,neighborhood.ilike.%eastlegon%,description.ilike.%eastlegon%'
    );
  });

  it('strips control characters from the input', () => {
    expect(buildSearchFilter('east\u0001legon')).toBe(
      'title.ilike.%eastlegon%,neighborhood.ilike.%eastlegon%,description.ilike.%eastlegon%'
    );
  });

  it('collapses whitespace runs to single spaces', () => {
    expect(buildSearchFilter('  east   legon  ')).toBe(
      'title.ilike.%east legon%,neighborhood.ilike.%east legon%,description.ilike.%east legon%'
    );
  });

  it('truncates queries longer than 100 characters to 100', () => {
    const long = 'x'.repeat(150);
    const q = 'x'.repeat(100);
    const result = buildSearchFilter(long);
    expect(result).toBe(
      `title.ilike.%${q}%,neighborhood.ilike.%${q}%,description.ilike.%${q}%`
    );
    expect(result!.split('%')[1]).toBe(q);
  });

  it('returns the expected three-condition or() string for a normal query', () => {
    expect(buildSearchFilter('East Legon')).toBe(
      'title.ilike.%East Legon%,neighborhood.ilike.%East Legon%,description.ilike.%East Legon%'
    );
  });
});