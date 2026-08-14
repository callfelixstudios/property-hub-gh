import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocationData } from '@/utils/locationPage';
import { categoryPhrase } from '@/data/categoryMeta';
import { formatRegionForUi } from '@/utils/regionMapper';
import { generateListingSlug } from '@/utils/slugify';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import PropertyCard from '@/components/PropertyCard';
import LocationContent from '@/components/locations/LocationContent';
import Footer from '@/components/Footer';

export const revalidate = 300;
export const dynamicParams = true;

const SITE_URL = 'https://www.propertyhubgh.com';

const formatPrice = (value: number): string =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(value);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const data = await getLocationData(location, 'rent');
  if (!data) {
    return { title: 'Rentals Not Found | Property Hub GH' };
  }

  const locationName = data.ref.neighborhood || formatRegionForUi(data.ref.region);
  const phrase = categoryPhrase(data.dominantCategory, 'rent');
  const title = `${phrase} in ${locationName} | Property Hub GH`;
  const listingWord = data.stats.count === 1 ? 'listing' : 'listings';
  const description = `${phrase} in ${locationName} — ${data.stats.count} active ${listingWord} priced from ${formatPrice(
    data.stats.min
  )} to ${formatPrice(data.stats.max)}.`;
  const pageUrl = `${SITE_URL}/rentals/${data.ref.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: `${SITE_URL}/opengraph-image`, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function RentalsLocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const data = await getLocationData(location, 'rent');
  if (!data) notFound();

  const { ref, listings, stats, dominantCategory } = data;
  const locationName = ref.neighborhood || formatRegionForUi(ref.region);
  const displayRegion = formatRegionForUi(ref.region);
  const phrase = categoryPhrase(dominantCategory, 'rent');
  const listingWord = stats.count === 1 ? 'listing' : 'listings';

  const filterUrl =
    ref.kind === 'neighborhood'
      ? `/rentals?region=${encodeURIComponent(displayRegion)}&neighborhood=${encodeURIComponent(
          ref.neighborhood ?? ''
        )}`
      : `/rentals?region=${encodeURIComponent(displayRegion)}`;

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Rentals', url: '/rentals' },
          { name: locationName, url: `/rentals/${ref.slug}` },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: listings.map((listing, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/listings/${generateListingSlug(
              listing.title,
              listing.location,
              listing.id
            )}`,
          })),
        }}
      />

      <div className="bg-navy-base pt-28 pb-10 px-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/rentals" className="hover:text-white transition-colors">
              Rentals
            </Link>
            <span>/</span>
            <span className="text-white/90 truncate max-w-xs">{locationName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            {phrase} in {locationName}
          </h1>
          <p className="text-white/80 max-w-2xl">
            {stats.count} active rental {listingWord} in {locationName} — verified on Property Hub
            GH.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} {...listing} />
          ))}
        </div>

        <LocationContent
          region={ref.region}
          neighborhood={ref.neighborhood}
          categoryDir="rent"
          stats={stats}
        />

        <div className="flex justify-center">
          <Link
            href={filterUrl}
            className="inline-flex items-center px-8 py-3.5 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors"
          >
            Refine with full filters
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
