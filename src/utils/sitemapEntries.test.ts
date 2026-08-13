import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LISTING_QUERY,
  LOCATION_ENTRIES_LAST_MODIFIED,
  STATIC_SITEMAP_ENTRIES,
  toListingEntry,
  toLocationEntries,
} from './sitemapEntries';

const ORIGIN = 'https://www.propertyhubgh.com';
const UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('toListingEntry', () => {
  it('produces a slugged URL ending in the UUID', () => {
    const entry = toListingEntry(
      {
        id: UUID,
        category: 'Apartment',
        neighborhood: 'East Legon',
        region: 'Greater Accra',
        updated_at: '2026-07-15T10:30:00.000Z',
      },
      ORIGIN
    );

    expect(entry.url).toBe(
      `${ORIGIN}/listings/apartment-east-legon-greater-accra-${UUID}`
    );
    expect(entry.url).toMatch(
      new RegExp(`/listings/[a-z0-9-]+-${UUID}$`)
    );
  });

  it('uses updated_at as lastModified', () => {
    const entry = toListingEntry(
      {
        id: UUID,
        category: 'House',
        neighborhood: 'Osu',
        region: null,
        updated_at: '2026-08-01T00:00:00.000Z',
      },
      ORIGIN
    );

    expect(entry.lastModified).toBe('2026-08-01T00:00:00.000Z');
  });

  it('falls back to empty string lastModified when updated_at is null', () => {
    const entry = toListingEntry(
      {
        id: UUID,
        category: 'Plot of Land',
        neighborhood: null,
        region: 'Tema',
        updated_at: null,
      },
      ORIGIN
    );

    expect(entry.lastModified).toBe('');
  });

  it('tolerates null neighborhood and region', () => {
    const entry = toListingEntry(
      {
        id: UUID,
        category: 'Storey Building',
        neighborhood: null,
        region: null,
        updated_at: '2026-07-20T00:00:00.000Z',
      },
      ORIGIN
    );

    expect(entry.url).toBe(`${ORIGIN}/listings/storey-building-${UUID}`);
  });
});

describe('STATIC_SITEMAP_ENTRIES', () => {
  it('includes all 11 expected paths', () => {
    const paths = STATIC_SITEMAP_ENTRIES.map((entry) => entry.url);

    expect(paths).toEqual([
      '/',
      '/rentals',
      '/sales',
      '/safemove',
      '/requests',
      '/insights',
      '/terms',
      '/privacy',
      '/cookie-policy',
      '/copyright',
      '/llms.txt',
    ]);
    expect(STATIC_SITEMAP_ENTRIES).toHaveLength(11);
  });

  it('includes a url ending in /insights', () => {
    const paths = STATIC_SITEMAP_ENTRIES.map((entry) => entry.url);

    expect(paths).toContain('/insights');
  });

  it('has unique static urls', () => {
    const paths = STATIC_SITEMAP_ENTRIES.map((entry) => entry.url);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('uses stable fixed ISO dates, not new Date() semantics', () => {
    for (const entry of STATIC_SITEMAP_ENTRIES) {
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe('ACTIVE_LISTING_QUERY', () => {
  it('contains both required status filters', () => {
    expect(ACTIVE_LISTING_QUERY).toEqual({
      status: 'active',
      moderation_status: 'approved',
    });
  });
});

describe('toLocationEntries', () => {
  it('maps a rent row to a rentals URL using the neighborhood slug', () => {
    const entries = toLocationEntries(
      [
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
      ],
      ORIGIN
    );

    expect(entries).toEqual([
      { url: `${ORIGIN}/rentals/dansoman`, lastModified: LOCATION_ENTRIES_LAST_MODIFIED },
    ]);
  });

  it('emits both rentals and sales entries when both transaction types are present', () => {
    const entries = toLocationEntries(
      [
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
        {
          transaction_type: 'sale',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
      ],
      ORIGIN
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/rentals/dansoman`,
      `${ORIGIN}/sales/dansoman`,
    ]);
  });

  it('falls back to region when neighborhood is null', () => {
    const entries = toLocationEntries(
      [{ transaction_type: 'rent', region: 'ashanti', neighborhood: null }],
      ORIGIN
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/rentals/ashanti`,
    ]);
  });

  it('turns underscores in region keys into hyphens', () => {
    const entries = toLocationEntries(
      [{ transaction_type: 'sale', region: 'greater_accra', neighborhood: null }],
      ORIGIN
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/sales/greater-accra`,
    ]);
  });

  it('slugifies neighborhood names with spaces', () => {
    const entries = toLocationEntries(
      [
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Airport Residential Area',
        },
      ],
      ORIGIN
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/rentals/airport-residential-area`,
    ]);
  });

  it('skips rows with both region and neighborhood null', () => {
    const entries = toLocationEntries(
      [
        { transaction_type: 'rent', region: null, neighborhood: null },
        { transaction_type: 'sale', region: null, neighborhood: null },
      ],
      ORIGIN
    );

    expect(entries).toEqual([]);
  });

  it('dedupes identical URLs across duplicate rows', () => {
    const entries = toLocationEntries(
      [
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
      ],
      ORIGIN
    );

    expect(entries).toHaveLength(1);
  });

  it('uses the stable fixed lastModified constant', () => {
    const entries = toLocationEntries(
      [{ transaction_type: 'rent', region: 'ashanti', neighborhood: 'Kumasi' }],
      ORIGIN
    );

    expect(entries[0].lastModified).toBe(LOCATION_ENTRIES_LAST_MODIFIED);
    expect(entries[0].lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns entries sorted by URL', () => {
    const entries = toLocationEntries(
      [
        { transaction_type: 'sale', region: 'ashanti', neighborhood: 'Kumasi' },
        {
          transaction_type: 'rent',
          region: 'greater_accra',
          neighborhood: 'Dansoman',
        },
        { transaction_type: 'rent', region: 'ashanti', neighborhood: 'Kumasi' },
      ],
      ORIGIN
    );

    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([...urls].sort());
  });
});