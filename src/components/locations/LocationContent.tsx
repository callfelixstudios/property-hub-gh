import {
  getNeighborhoodInfo,
  getNeighborhoodFallback,
  getRegionDisplay,
  type NeighborhoodInfo,
} from '@/data/neighborhoodInfo';

export interface LocationContentStats {
  min: number;
  max: number;
  count: number;
}

interface LocationContentProps {
  region: string;
  neighborhood?: string | null;
  categoryDir: 'rent' | 'sale';
  stats: LocationContentStats;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

const CARD_CLASSES = 'bg-white rounded-xl border border-slate-100 shadow-sm p-6';
const HEADING_CLASSES = 'text-sm font-bold uppercase tracking-widest text-slate-400 mb-3';
const PROSE_CLASSES = 'text-slate-600 leading-relaxed text-[15px]';

function buildLocalFaqs(location: string, categoryDir: 'rent' | 'sale'): NeighborhoodInfo['faqs'] {
  if (categoryDir === 'rent') {
    return [
      {
        q: `What is the rental market like in ${location}?`,
        a: `The rental market in ${location} is active, with apartments, rooms and houses available across a range of price points. The live listings on Property Hub GH show exactly what is on offer in ${location} right now.`,
      },
      {
        q: `How much does it cost to rent in ${location}?`,
        a: `Rental prices in ${location} depend on the property type, size and exact area. The listings on this page show current asking prices, making it easy to compare options within your budget.`,
      },
      {
        q: `How can I find a rental property in ${location}?`,
        a: `Start with the listings on this page to see what is available in ${location}, then contact the lister directly from the listing page to arrange a viewing.`,
      },
    ];
  }
  return [
    {
      q: `Is ${location} a good place to buy property?`,
      a: `${location} is an active part of the property market, with a range of options for buyers at different budgets. The live listings on Property Hub GH show current availability so you can judge what fits your needs.`,
    },
    {
      q: `How much do properties cost in ${location}?`,
      a: `Property prices in ${location} vary with type, size and exact location. The listings on this page show current asking prices, giving you a realistic view of the market before you make an offer.`,
    },
    {
      q: `How can I find properties for sale in ${location}?`,
      a: `Use the listings on this page to explore properties for sale in ${location}, then contact the lister directly from the listing page to arrange a viewing or negotiation.`,
    },
  ];
}

export default function LocationContent({
  region,
  neighborhood,
  categoryDir,
  stats,
}: LocationContentProps) {
  const matched = getNeighborhoodInfo(region, neighborhood ?? undefined);
  const info = matched ?? getNeighborhoodFallback(region, neighborhood ?? undefined);
  const locationLabel = neighborhood || getRegionDisplay(region) || region;
  const listingWord = categoryDir === 'rent' ? 'rental' : 'sale';
  const faqs = info.faqs.length > 0 ? info.faqs : buildLocalFaqs(locationLabel, categoryDir);

  return (
    <div className="space-y-6">
      <section className={CARD_CLASSES}>
        <h2 className={HEADING_CLASSES}>About {locationLabel}</h2>
        <p className={PROSE_CLASSES}>{info.blurb}</p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className={HEADING_CLASSES}>Market Snapshot for {locationLabel}</h2>
        <p className={PROSE_CLASSES}>
          Listings range from {CURRENCY_FORMATTER.format(stats.min)} to{' '}
          {CURRENCY_FORMATTER.format(stats.max)} across {stats.count} active {listingWord}{' '}
          listings.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className={HEADING_CLASSES}>Frequently Asked Questions</h2>
        <div className="space-y-5">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="font-bold text-slate-900 text-[15px] mb-1">{faq.q}</h3>
              <p className={PROSE_CLASSES}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {info.facts.length > 0 && (
        <section className={CARD_CLASSES}>
          <h2 className={HEADING_CLASSES}>Area Highlights</h2>
          <ul className="space-y-2">
            {info.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <svg
                  className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
