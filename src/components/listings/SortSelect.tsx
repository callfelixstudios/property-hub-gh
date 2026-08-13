'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface SortOption {
  value: string;
  label: string;
}

export default function SortSelect({
  options,
  current,
}: {
  options: SortOption[];
  current: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', e.target.value);
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }}
      className="bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
