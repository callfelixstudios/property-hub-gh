import { describe, expect, it } from 'vitest';
import { buildListingDescription, buildListingTitle } from './listingMeta';

const TITLE_SUFFIX = ' | Property Hub GH';

describe('buildListingTitle', () => {
  it('drops the region when the full title would exceed 60 characters', () => {
    expect(
      buildListingTitle({
        category: 'Apartment',
        transactionType: 'rent',
        neighborhood: 'East Legon',
        region: 'Greater Accra',
      })
    ).toBe('Apartment for Rent in East Legon | Property Hub GH');
  });

  it('fits the Kasoa example exactly without truncation', () => {
    expect(
      buildListingTitle({
        category: 'Plot of Land',
        transactionType: 'sale',
        neighborhood: 'Kasoa',
        region: 'Central',
      })
    ).toBe('Plot of Land for Sale in Kasoa, Central | Property Hub GH');
  });

  it('falls back to Ghana when no location is provided', () => {
    expect(
      buildListingTitle({ category: 'House', transactionType: 'rent', neighborhood: null, region: null })
    ).toBe('House for Rent in Ghana | Property Hub GH');
  });

  it('normalizes snake_case region keys to display form', () => {
    expect(
      buildListingTitle({
        category: 'House',
        transactionType: 'sale',
        neighborhood: 'Osu',
        region: 'greater_accra',
      })
    ).toBe('House for Sale in Osu, Greater Accra | Property Hub GH');
  });

  it('uses the region alone when the neighborhood is missing', () => {
    expect(
      buildListingTitle({
        category: 'Apartment',
        transactionType: 'rent',
        neighborhood: null,
        region: 'greater_accra',
      })
    ).toBe('Apartment for Rent in Greater Accra | Property Hub GH');
  });

  it('truncates the location at a word boundary when dropping the region is not enough', () => {
    const title = buildListingTitle({
      category: 'Apartment',
      transactionType: 'rent',
      neighborhood: 'A Very Long Neighborhood Name',
      region: 'Greater Accra',
    });
    expect(title).toBe('Apartment for Rent in A Very Long | Property Hub GH');
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith(TITLE_SUFFIX)).toBe(true);
  });

  it('cuts mid-word when no word boundary exists in the location', () => {
    const title = buildListingTitle({
      category: 'Apartment',
      transactionType: 'rent',
      neighborhood: 'x'.repeat(40),
      region: null,
    });
    expect(title).toBe(`Apartment for Rent in ${'x'.repeat(20)}${TITLE_SUFFIX}`);
    expect(title.length).toBe(60);
    expect(title.endsWith(TITLE_SUFFIX)).toBe(true);
  });
});

describe('buildListingDescription', () => {
  it('composes a sentence with bedroom count, price and verification badge', () => {
    const description = buildListingDescription({
      category: 'Apartment',
      transactionType: 'rent',
      price: 4500,
      currency: 'GHS',
      bedrooms: 2,
      bathrooms: 1,
      isVerified: true,
      safemoveActive: false,
      neighborhood: 'East Legon',
      region: 'Greater Accra',
    });
    expect(description).toContain(
      '2-Bedroom Apartment for Rent in East Legon, Greater Accra. GHS 4,500/mo'
    );
    expect(description).toContain('Verified.');
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('skips the bedroom count for land categories', () => {
    const description = buildListingDescription({
      category: 'Plot of Land',
      transactionType: 'sale',
      price: 200000,
      currency: 'GHS',
      bedrooms: 2,
      neighborhood: 'Kasoa',
      region: 'Central',
    });
    expect(description).toContain('Plot of Land for Sale in Kasoa, Central');
    expect(description).toContain('GHS 200,000');
    expect(description).toContain('Price: GHS 200,000.');
    expect(description).not.toContain('Bedroom');
  });

  it('falls back to Ghana and omits the price clause when price is missing', () => {
    const description = buildListingDescription({
      category: 'House',
      transactionType: 'rent',
      price: null,
      neighborhood: null,
      region: null,
    });
    expect(description).toBe('House for Rent in Ghana.');
    expect(description).not.toContain('Price');
    expect(description).not.toContain('/mo');
  });

  it('handles very large prices without throwing', () => {
    const description = buildListingDescription({
      category: 'House',
      transactionType: 'sale',
      price: 999999999,
      currency: 'GHS',
      neighborhood: 'East Legon',
      region: 'Greater Accra',
    });
    expect(description).toContain('GHS 999,999,999');
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('includes the SafeMove badge when safemoveActive is true', () => {
    const description = buildListingDescription({
      category: 'Apartment',
      transactionType: 'rent',
      price: 4500,
      currency: 'GHS',
      isVerified: true,
      safemoveActive: true,
      neighborhood: 'East Legon',
      region: null,
    });
    expect(description).toContain('SafeMove protected.');
    expect(description).toContain('Verified.');
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('formats USD prices and normalizes snake_case regions', () => {
    const description = buildListingDescription({
      category: 'House',
      transactionType: 'rent',
      price: 4500,
      currency: 'USD',
      neighborhood: 'Osu',
      region: 'greater_accra',
    });
    expect(description).toContain('$4,500/mo');
    expect(description).toContain('Osu, Greater Accra');
    expect(description).not.toContain('GHS');
  });

  it('never throws on null or undefined inputs', () => {
    const description = buildListingDescription({
      category: null as unknown as string,
      transactionType: 'rent',
      price: null,
      bedrooms: null,
      bathrooms: null,
      isVerified: null,
      safemoveActive: null,
      neighborhood: null,
      region: null,
    });
    expect(typeof description).toBe('string');
    expect(description).toContain('Ghana');
  });

  it('progressively drops badges, then bedroom count, then location when over 155 chars', () => {
    const description = buildListingDescription({
      category: 'B'.repeat(120),
      transactionType: 'rent',
      price: 4500,
      currency: 'GHS',
      bedrooms: 2,
      isVerified: true,
      safemoveActive: true,
      neighborhood: 'East Legon',
      region: 'Greater Accra',
    });
    expect(description).toBe(`${'B'.repeat(120)} for Rent in Ghana. GHS 4,500/mo.`);
    expect(description.length).toBe(153);
    expect(description).not.toContain('Verified');
    expect(description).not.toContain('SafeMove');
    expect(description).not.toContain('Bedroom');
  });

  it('trims to 155 characters without ellipsis when minimal clauses still overflow', () => {
    const description = buildListingDescription({
      category: 'A'.repeat(200),
      transactionType: 'sale',
      price: 4500,
      currency: 'GHS',
      neighborhood: null,
      region: null,
    });
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).not.toContain('...');
  });

  it('never exceeds 155 characters across representative inputs', () => {
    const cases = [
      {
        category: 'Apartment',
        transactionType: 'rent' as const,
        price: 4500,
        currency: 'GHS',
        bedrooms: 2,
        isVerified: true,
        safemoveActive: true,
        neighborhood: 'East Legon',
        region: 'Greater Accra',
      },
      {
        category: 'Plot of Land',
        transactionType: 'sale' as const,
        price: 123456789,
        currency: 'USD',
        neighborhood: 'Kasoa',
        region: 'Central',
      },
    ];
    for (const props of cases) {
      expect(buildListingDescription(props).length).toBeLessThanOrEqual(155);
    }
  });
});
