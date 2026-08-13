import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LISTING_QUERY,
  STATIC_SITEMAP_ENTRIES,
  toListingEntry,
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
  it('includes all 10 expected paths', () => {
    const paths = STATIC_SITEMAP_ENTRIES.map((entry) => entry.url);

    expect(paths).toEqual([
      '/',
      '/rentals',
      '/sales',
      '/safemove',
      '/requests',
      '/terms',
      '/privacy',
      '/cookie-policy',
      '/copyright',
      '/llms.txt',
    ]);
    expect(STATIC_SITEMAP_ENTRIES).toHaveLength(10);
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