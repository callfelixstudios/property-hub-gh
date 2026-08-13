import Link from 'next/link';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyCard from '@/components/PropertyCard';
import SortSelect, { type SortOption } from '@/components/listings/SortSelect';
import PaginationControls from '@/components/listings/PaginationControls';
import {
  fetchListingsPage,
  resolveMode,
  resolveSort,
} from '@/utils/listingsQuery';

interface ListingsBrowserProps {
  searchParams: { [key: string]: string | string[] | undefined };
  fixedType?: 'rent' | 'sale';
  topBanner?: React.ReactNode;
}

export default async function ListingsBrowser({
  searchParams,
  fixedType,
  topBanner,
}: ListingsBrowserProps) {
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('property_hub_currency')?.value || 'GHS';
  const mode = resolveMode(fixedType, searchParams.type as string | undefined);
  const sort = resolveSort(searchParams.sort as string | undefined, mode);
  const { listings, total, page, pageCount } = await fetchListingsPage(searchParams, {
    fixedType,
    displayCurrency,
  });

  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Sort by: Newest' },
    { value: 'views', label: 'Sort by: Most Viewed' },
    ...(mode === 'all'
      ? []
      : [
          { value: 'price_asc', label: 'Sort by: Lowest Price' },
          { value: 'price_desc', label: 'Sort by: Highest Price' },
        ]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 items-start">
      <PropertyFilters />

      <main className="flex-1 w-full pb-20">
        {topBanner}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            Showing {total} {total === 1 ? 'property' : 'properties'}
          </p>
          <Suspense fallback={null}>
            <SortSelect options={sortOptions} current={sort} />
          </Suspense>
        </div>

        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} {...listing} />
              ))}
            </div>
            {pageCount > 1 && (
              <PaginationControls page={page} pageCount={pageCount} searchParams={searchParams} />
            )}
          </>
        ) : (
          <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100 flex flex-col items-center text-center py-14">
            <h3 className="font-bold text-navy-base mb-2">No properties match your filters</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Try adjusting or clearing your filters to see more listings.
            </p>
            <Link
              href={fixedType === 'rent' ? '/rentals' : fixedType === 'sale' ? '/sales' : '/properties'}
              className="inline-flex items-center px-6 py-3 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors"
            >
              Reset Filters
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
