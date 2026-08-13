import type { Metadata } from 'next';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
  description:
    'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in East Legon, Cantonments, Kumasi, and across Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/sales',
  },
  openGraph: {
    title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
    description: 'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in Ghana.',
    url: 'https://www.propertyhubgh.com/sales',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

export default async function SalesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Sales', url: '/sales' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Properties for Sale
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Acquire premium real estate in Ghana. We verify title documents and land
            registry registrations so you can invest with absolute confidence.
          </p>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} fixedType="sale" />
      <Footer />
    </div>
  );
}
