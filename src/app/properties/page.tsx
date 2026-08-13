import type { Metadata } from 'next';
import Link from 'next/link';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'All Properties for Rent & Sale in Ghana | Property Hub GH',
  description:
    'Browse every verified property on Property Hub GH — apartments, houses, single rooms, land and commercial spaces for rent or sale across all regions of Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/properties',
  },
  openGraph: {
    title: 'All Properties for Rent & Sale in Ghana | Property Hub GH',
    description: 'Browse every verified property in Ghana — rentals and sales on Property Hub GH.',
    url: 'https://www.propertyhubgh.com/properties',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

type SearchParams = { [key: string]: string | string[] | undefined };
type ToggleType = 'all' | 'rent' | 'sale';

function toggleHref(searchParams: SearchParams, type: ToggleType): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'type' || key === 'page' || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (type !== 'all') params.set('type', type);
  return params.toString() ? `/properties?${params.toString()}` : '/properties';
}

export default async function PropertiesPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const currentType: ToggleType =
    searchParams.type === 'rent' || searchParams.type === 'sale' ? searchParams.type : 'all';

  const tabs: { id: ToggleType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'rent', label: 'Rent' },
    { id: 'sale', label: 'Buy' },
  ];

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Properties', url: '/properties' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Properties in Ghana
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Browse every verified property on Property Hub GH — apartments, houses,
            single rooms, land and commercial spaces for rent or sale across Ghana.
          </p>
          <div className="inline-flex rounded-xl bg-white/10 p-1 gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={toggleHref(searchParams, tab.id)}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  currentType === tab.id
                    ? 'bg-white text-navy-base shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} />
      <Footer />
    </div>
  );
}