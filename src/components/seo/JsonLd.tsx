import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

const escapeJsonForHtml = (value: Record<string, unknown>): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForHtml(data) }}
    />
  );
}

// ── Schema Generators ──────────────────────────────────────────────────────────

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': 'https://www.propertyhubgh.com/#organization',
    name: 'Property Hub GH',
    url: 'https://www.propertyhubgh.com',
    logo: 'https://www.propertyhubgh.com/hero-bg.png',
    image: 'https://www.propertyhubgh.com/hero-bg.png',
    description: 'Unified Property Directory for Renting Rooms, Hostels, Apartments & Buying Litigation-Free Land and Houses in Ghana.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Ghana',
    },
    sameAs: [
      'https://twitter.com/propertyhubgh',
      'https://facebook.com/propertyhubgh',
      'https://instagram.com/propertyhubgh',
    ],
    priceRange: '₵₵ - ₵₵₵₵',
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.propertyhubgh.com/#website',
    url: 'https://www.propertyhubgh.com',
    name: 'Property Hub GH',
    description: 'Find your next space in Ghana. Search rentals, student hostels, apartments, houses for sale, and litigation-free plots of land.',
    publisher: {
      '@id': 'https://www.propertyhubgh.com/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.propertyhubgh.com/rentals?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://www.propertyhubgh.com${item.url}`,
    })),
  };
}

export interface ListingSchemaProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  transactionType: 'rent' | 'sale';
  price: number;
  currency?: string;
  neighborhood?: string;
  region?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  url: string;
  datePosted?: string;
}

export function getRealEstateListingSchema({
  id,
  title,
  description,
  category,
  transactionType,
  price,
  currency = 'GHS',
  neighborhood,
  region,
  images = [],
  bedrooms,
  bathrooms,
  squareMeters,
  url,
  datePosted,
}: ListingSchemaProps) {
  const isRent = transactionType === 'rent';

  const itemOfferedType = category.toLowerCase().includes('land')
    ? 'Place'
    : bedrooms || bathrooms
    ? 'SingleFamilyResidence'
    : 'Accommodation';

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${url}#listing-${id}`,
    url,
    name: title,
    description: description || title,
    datePosted: datePosted || new Date().toISOString(),
    image: images.length > 0 ? images : ['https://www.propertyhubgh.com/hero-bg.png'],
    mainEntity: {
      '@type': itemOfferedType,
      name: title,
      description: description || title,
      address: {
        '@type': 'PostalAddress',
        addressLocality: neighborhood || 'Accra',
        addressRegion: region || 'Greater Accra',
        addressCountry: 'GH',
      },
      numberOfBedrooms: bedrooms || undefined,
      numberOfBathroomsTotal: bathrooms || undefined,
      floorSize: squareMeters ? {
        '@type': 'QuantitativeValue',
        value: squareMeters,
        unitCode: 'MTK',
      } : undefined,
    },
    offers: {
      '@type': isRent ? 'AggregateOffer' : 'Offer',
      price: price || 0,
      priceCurrency: currency === 'USD' ? 'USD' : 'GHS',
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      url,
      seller: {
        '@id': 'https://www.propertyhubgh.com/#organization',
      },
    },
  };
}

export function getServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'SafeMove Escrow & Property Verification',
    serviceType: 'Real Estate Escrow and Verification',
    provider: {
      '@id': 'https://www.propertyhubgh.com/#organization',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Ghana',
    },
    description: 'Fraud-free property rental advance escrow, physical inspection verification, and secure landlord payment hold in Ghana.',
  };
}
