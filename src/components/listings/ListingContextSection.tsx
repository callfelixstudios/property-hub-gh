import { getNeighborhoodInfo, getNeighborhoodFallback, getRegionDisplay } from '@/data/neighborhoodInfo';

interface ListingContextSectionProps {
  region?: string | null;
  neighborhood?: string | null;
  category?: string | null;
}

export default function ListingContextSection({ region, neighborhood }: ListingContextSectionProps) {
  const matched = getNeighborhoodInfo(region ?? undefined, neighborhood ?? undefined);
  const info = matched ?? getNeighborhoodFallback(region ?? undefined, neighborhood ?? undefined);
  const areaLabel = neighborhood || getRegionDisplay(region ?? undefined) || 'the Area';

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
        About {areaLabel}
      </h2>
      <p className="text-slate-600 leading-relaxed text-[15px]">{info.blurb}</p>

      {matched && info.facts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {info.facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      )}

      {info.faqs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {info.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="font-bold text-slate-900 text-[15px] mb-1">{faq.q}</h3>
                <p className="text-slate-600 leading-relaxed text-[15px]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}