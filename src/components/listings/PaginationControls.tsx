import Link from 'next/link';

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

function hrefFor(page: number, searchParams: PaginationControlsProps['searchParams']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  params.set('page', String(page));
  return `?${params.toString()}`;
}

export default function PaginationControls({
  page,
  pageCount,
  searchParams,
}: PaginationControlsProps) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1, searchParams)}
          className="px-4 py-2 text-sm font-semibold text-navy-base bg-white border border-gray-200 rounded-sm hover:border-navy-light transition-colors"
        >
          Previous
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p, searchParams)}
          aria-current={p === page ? 'page' : undefined}
          className={`px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
            p === page
              ? 'bg-navy-base text-white'
              : 'text-navy-base bg-white border border-gray-200 hover:border-navy-light'
          }`}
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link
          href={hrefFor(page + 1, searchParams)}
          className="px-4 py-2 text-sm font-semibold text-navy-base bg-white border border-gray-200 rounded-sm hover:border-navy-light transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
