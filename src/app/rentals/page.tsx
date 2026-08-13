import type { Metadata } from 'next';
import Link from 'next/link';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
  description:
    'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent across Accra, Kumasi, East Legon, Cantonments & all regions of Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/rentals',
  },
  openGraph: {
    title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
    description: 'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent in Ghana.',
    url: 'https://www.propertyhubgh.com/rentals',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

export default async function RentalsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const requestSpaceBanner = (
    <div className="mb-8 bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-emerald-900 mb-1">
          Can&apos;t find what you&apos;re looking for?
        </h3>
        <p className="text-emerald-700 text-sm">
          Post a request on our Seeker Notice Board and let property owners come to you!
        </p>
      </div>
      <Link
        href="/request-space"
        className="shrink-0 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
      >
        Request a Space
      </Link>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Rentals', url: '/rentals' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Rentals in Ghana
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Find verified apartments, single rooms, and houses for rent with fully
            transparent terms and SafeMove escrow protection.
          </p>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} fixedType="rent" topBanner={requestSpaceBanner} />
      <Footer />
    </div>
  );
}