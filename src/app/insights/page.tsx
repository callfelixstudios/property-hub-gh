import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { formatRegionForUi } from '@/utils/regionMapper';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const revalidate = 300;

const SITE_URL = 'https://www.propertyhubgh.com';

const formatGhs = (value: number): string =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(value);

export const metadata: Metadata = {
  title: 'Ghana Property Market Insights & Rental Trends | Property Hub GH',
  description:
    'Live rental and sales price data from verified Property Hub GH listings across Ghana — average rents and sale prices by region, updated automatically.',
  alternates: {
    canonical: `${SITE_URL}/insights`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Ghana Property Market Insights & Rental Trends | Property Hub GH',
    description:
      'Live rental and sales price data from verified Property Hub GH listings across Ghana — average rents and sale prices by region, updated automatically.',
    url: `${SITE_URL}/insights`,
  },
};

interface PriceRow {
  transaction_type: string | null;
  region: string | null;
  base_rent: number | null;
  outright_price: number | null;
}

interface RegionStats {
  region: string;
  count: number;
  avg: number;
  min: number;
  max: number;
}

interface RegionAggregate {
  region: string;
  count: number;
  sum: number;
  min: number;
  max: number;
}

function aggregateByRegion(rows: PriceRow[], type: 'rent' | 'sale'): RegionStats[] {
  const buckets = new Map<string, RegionAggregate>();
  for (const row of rows) {
    if (row.transaction_type !== type || !row.region) continue;
    const price = type === 'rent' ? row.base_rent : row.outright_price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) continue;
    const current = buckets.get(row.region);
    if (current) {
      current.count += 1;
      current.sum += price;
      current.min = Math.min(current.min, price);
      current.max = Math.max(current.max, price);
    } else {
      buckets.set(row.region, {
        region: row.region,
        count: 1,
        sum: price,
        min: price,
        max: price,
      });
    }
  }
  return Array.from(buckets.values())
    .map(({ region, count, sum, min, max }) => ({
      region,
      count,
      avg: sum / count,
      min,
      max,
    }))
    .sort((a, b) => b.count - a.count);
}

function displayRegion(region: string): string {
  const mapped = formatRegionForUi(region);
  const looksTitleCase = mapped
    .split(' ')
    .every((word) => /^[A-Z][a-z]+/.test(word));
  if (looksTitleCase) return mapped;
  return region
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function loadMarketData(): Promise<{
  rentStats: RegionStats[];
  saleStats: RegionStats[];
  error: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('transaction_type, region, base_rent, outright_price')
    .eq('status', 'active')
    .eq('moderation_status', 'approved');

  if (error) {
    console.error('Error fetching market data:', error);
    return { rentStats: [], saleStats: [], error: true };
  }

  const rows = (data || []) as PriceRow[];
  return {
    rentStats: aggregateByRegion(rows, 'rent'),
    saleStats: aggregateByRegion(rows, 'sale'),
    error: false,
  };
}

function renderRegionTable(rows: RegionStats[], averageLabel: string, emptyLabel: string) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-100">
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Region
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Listings
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {averageLabel}
            </th>
            <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Range
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.region} className="border-b border-slate-50 last:border-0">
              <td className="py-3 pr-4 font-bold text-navy-base whitespace-nowrap">
                {displayRegion(row.region)}
              </td>
              <td className="py-3 pr-4 text-slate-600">{row.count}</td>
              <td className="py-3 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                {formatGhs(row.avg)}
              </td>
              <td className="py-3 text-slate-500 whitespace-nowrap">
                {formatGhs(row.min)} – {formatGhs(row.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function InsightsPage() {
  const { rentStats, saleStats, error } = await loadMarketData();

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Market Insights', url: '/insights' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/90">Market Insights</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ghana Property Market Insights
          </h1>
          <p className="text-white/80 max-w-2xl">
            Live rental and sales price data from verified Property Hub GH listings — updated
            automatically.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6 flex-1">
        {error ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Market Data
            </h2>
            <p className="text-slate-600">
              We couldn&apos;t load market data right now. Please try again shortly.
            </p>
          </div>
        ) : rentStats.length === 0 && saleStats.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Market Data
            </h2>
            <p className="text-slate-600 mb-6">
              No market data yet — listings are verified before they appear here.
            </p>
            <Link
              href="/post-space"
              className="inline-flex items-center px-8 py-3.5 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors"
            >
              List your property
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Average Rent by Region
              </h2>
              {renderRegionTable(rentStats, 'Average Rent', 'No rent listings yet')}
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Sales Prices by Region
              </h2>
              {renderRegionTable(saleStats, 'Average Price', 'No sale listings yet')}
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                How this data is compiled
              </h2>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                Figures are computed from active, moderation-approved listings on Property Hub GH and
                grouped by region. Averages, minimums and maximums update automatically as new
                verified listings are published. This data is provided for general information and is
                not financial advice.
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
