import { getRegionDisplay } from '@/data/neighborhoodInfo';

interface ListingAboutBoilerplateProps {
  category?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  neighborhood?: string | null;
  region?: string | null;
}

function formatCategory(cat: string | null | undefined) {
  if (!cat) return 'Property';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ListingAboutBoilerplate({
  category,
  bedrooms,
  bathrooms,
  neighborhood,
  region,
}: ListingAboutBoilerplateProps) {
  const cat = formatCategory(category);
  const location = [neighborhood, getRegionDisplay(region ?? undefined)].filter(Boolean).join(', ');
  const isLand = cat.toLowerCase().includes('land');

  const specParts = [
    typeof bedrooms === 'number' && bedrooms > 0 && !isLand ? `${bedrooms}-Bedroom` : null,
    typeof bathrooms === 'number' && bathrooms > 0 && !isLand ? `${bathrooms}-Bathroom` : null,
  ].filter(Boolean) as string[];
  const spec = specParts.join(', ');

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
        About this {cat}
      </h2>
      <div className="space-y-4 text-slate-600 leading-relaxed text-[15px]">
        <p>
          This {spec ? `${spec} ` : ''}{cat}{location ? ` in ${location}` : ''} is listed on
          Property Hub GH, where properties are posted directly by owners and registered agents.
          The photos and features shown here are provided by the lister, so we recommend a
          physical viewing before making any commitment.
        </p>
        {spec && (
          <p>
            The property is offered as a {spec} unit{location ? ` in ${location}` : ''}, with
            details of utilities, amenities and payment terms available from the lister. For
            current availability and viewing arrangements, message the lister directly through
            the contact options on this page.
          </p>
        )}
        <p>
          For extra confidence, choose Property Hub SafeMove when you transact on this listing —
          your deposit is held securely until the property is verified, GPS-confirmed and the
          keys are handed over.
        </p>
      </div>
    </div>
  );
}