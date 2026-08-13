import { describe, expect, it } from 'vitest';
import { generateListingSlug } from './slugify';

describe('generateListingSlug', () => {
  const UUID_1 = '123e4567-e89b-12d3-a456-426614174000';
  const UUID_2 = '9f8c2d4a-1b3e-4f5a-8c6d-7e0a1b2c3d4e';

  it('slugifies a typical category + location call ending with the id', () => {
    const slug = generateListingSlug('Apartment', 'East Legon Greater Accra', UUID_1);
    expect(slug).toBe(`apartment-east-legon-greater-accra-${UUID_1}`);
  });

  it('handles the "Single Room Self-Contain" category', () => {
    expect(generateListingSlug('Single Room Self-Contain', 'Accra', 42)).toBe(
      'single-room-self-contain-accra-42'
    );
  });

  it('handles the "Plot of Land" category', () => {
    expect(generateListingSlug('Plot of Land', 'Tema', 7)).toBe('plot-of-land-tema-7');
  });

  it('handles the "Townhouse / Terrace" category (slash and spacing collapse)', () => {
    expect(generateListingSlug('Townhouse / Terrace', 'Cantonments', 11)).toBe(
      'townhouse-terrace-cantonments-11'
    );
  });

  it('strips non-alphanumeric characters and collapses multi-hyphen runs', () => {
    expect(generateListingSlug('2-Bedroom House!', 'Osu', 3)).toBe('2-bedroom-house-osu-3');
  });

  it('trims leading and trailing hyphens', () => {
    const slug = generateListingSlug('-Apartment-', 'Dzorwulu', 9);
    expect(slug).toBe('apartment-dzorwulu-9');
    expect(slug.startsWith('-')).toBe(false);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('defaults a missing title to "property" and tolerates a missing location', () => {
    expect(generateListingSlug(undefined, 'Kumasi', 5)).toBe('property-kumasi-5');
    expect(generateListingSlug('Storey Building', undefined, 6)).toBe('storey-building-6');
    expect(generateListingSlug(undefined, undefined, 8)).toBe('property-8');
    expect(generateListingSlug('', '', 8)).toBe('property-8');
  });

  it('ends with the full hyphenated UUID so the [id] route regex can extract it', () => {
    for (const uuid of [UUID_1, UUID_2]) {
      const slug = generateListingSlug('Apartment', 'East Legon Greater Accra', uuid);
      const uuidMatch = slug.match(
        /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
      );
      expect(uuidMatch).not.toBeNull();
      expect(uuidMatch![1]).toBe(uuid);
    }
  });
});