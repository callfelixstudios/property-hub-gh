import { describe, expect, it } from 'vitest';
import {
  LOCATION_INDEX,
  isSupportedLocation,
  lookupLocation,
  slugifyLocation,
} from './locationSlugs';

describe('slugifyLocation', () => {
  it('converts spaces to hyphens', () => {
    expect(slugifyLocation('Greater Accra')).toBe('greater-accra');
  });

  it('converts underscores to hyphens', () => {
    expect(slugifyLocation('greater_accra')).toBe('greater-accra');
  });

  it('lowercases mixed case input', () => {
    expect(slugifyLocation('North East')).toBe('north-east');
    expect(slugifyLocation('EAST-LEGON')).toBe('east-legon');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugifyLocation('Airport Residential Area')).toBe('airport-residential-area');
    expect(slugifyLocation("St. John's Bay")).toBe('st-johns-bay');
  });

  it('collapses consecutive hyphens to one', () => {
    expect(slugifyLocation('a--b---c')).toBe('a-b-c');
    expect(slugifyLocation('a  b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugifyLocation('--a-b--')).toBe('a-b');
  });

  it('falls back to "location" for empty input', () => {
    expect(slugifyLocation('')).toBe('location');
    expect(slugifyLocation('!!!')).toBe('location');
  });
});

describe('LOCATION_INDEX', () => {
  it('contains a region entry for Greater Accra', () => {
    const entry = LOCATION_INDEX.find((loc) => loc.region === 'Greater Accra');
    expect(entry).toBeDefined();
    expect(entry?.kind).toBe('region');
    expect(entry?.slug).toBe('greater-accra');
  });

  it('contains a neighborhood entry for East Legon with its region', () => {
    const entry = LOCATION_INDEX.find((loc) => loc.slug === 'east-legon');
    expect(entry).toBeDefined();
    expect(entry?.kind).toBe('neighborhood');
    expect(entry?.region).toBe('Greater Accra');
  });

  it('has unique slugs across all entries', () => {
    const slugs = LOCATION_INDEX.map((loc) => loc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('round-trips every entry through lookupLocation', () => {
    for (const entry of LOCATION_INDEX) {
      const found = lookupLocation(entry.slug);
      expect(found?.slug).toBe(entry.slug);
      expect(found?.kind).toBe(entry.kind);
    }
  });
});

describe('lookupLocation', () => {
  it('resolves case-insensitively', () => {
    expect(lookupLocation('EAST-LEGON')?.slug).toBe('east-legon');
    expect(lookupLocation('Greater-Accra')?.slug).toBe('greater-accra');
  });

  it('returns null for unsupported locations', () => {
    expect(lookupLocation('not-a-place')).toBeNull();
    expect(lookupLocation('')).toBeNull();
  });
});

describe('isSupportedLocation', () => {
  it('returns true for supported slugs', () => {
    expect(isSupportedLocation('greater-accra')).toBe(true);
    expect(isSupportedLocation('east-legon')).toBe(true);
  });

  it('returns false for unsupported slugs', () => {
    expect(isSupportedLocation('')).toBe(false);
    expect(isSupportedLocation('not-a-place')).toBe(false);
  });
});
