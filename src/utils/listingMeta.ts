const TITLE_SUFFIX = ' | Property Hub GH';
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 155;

function normalizeRegion(region: string | null | undefined): string | null {
  if (!region) return null;
  if (region.includes(' ')) return region;
  return region
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildLocation(
  neighborhood: string | null | undefined,
  region: string | null | undefined
): string {
  if (neighborhood) {
    const normalizedRegion = normalizeRegion(region);
    return normalizedRegion ? `${neighborhood}, ${normalizedRegion}` : neighborhood;
  }
  return normalizeRegion(region) ?? 'Ghana';
}

function fitSegment(segment: string, maxLength: number): string {
  if (segment.length <= maxLength) return segment;
  let cut = segment.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return cut.replace(/[\s,.;:!?'"()\-/]+$/, '');
}

export function buildListingTitle(props: {
  category: string;
  transactionType: 'rent' | 'sale';
  neighborhood?: string | null;
  region?: string | null;
}): string {
  const verb = props.transactionType === 'sale' ? 'Sale' : 'Rent';
  const suffix = TITLE_SUFFIX;
  const location = buildLocation(props.neighborhood, props.region);

  const withRegion = `${props.category} for ${verb} in ${location}${suffix}`;
  if (withRegion.length <= MAX_TITLE_LENGTH) return withRegion;

  if (props.neighborhood) {
    const withoutRegion = `${props.category} for ${verb} in ${props.neighborhood}${suffix}`;
    if (withoutRegion.length <= MAX_TITLE_LENGTH) return withoutRegion;
  }

  const prefix = `${props.category} for ${verb} in `;
  const maxLocation = MAX_TITLE_LENGTH - prefix.length - suffix.length;
  const candidate = `${prefix}${fitSegment(location, maxLocation)}${suffix}`;

  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  const maxHead = MAX_TITLE_LENGTH - suffix.length;
  return `${fitSegment(candidate.slice(0, maxHead), maxHead)}${suffix}`;
}

export function buildListingDescription(props: {
  category: string;
  transactionType: 'rent' | 'sale';
  price?: number | null;
  currency?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  isVerified?: boolean | null;
  safemoveActive?: boolean | null;
  neighborhood?: string | null;
  region?: string | null;
}): string {
  const verb = props.transactionType === 'sale' ? 'Sale' : 'Rent';
  const category = props.category || 'Property';
  const location = buildLocation(props.neighborhood, props.region);
  const isLand = category.toLowerCase().includes('land');
  const bedPrefix =
    typeof props.bedrooms === 'number' && props.bedrooms > 0 && !isLand
      ? `${props.bedrooms}-Bedroom `
      : '';

  let priceClause = '';
  if (typeof props.price === 'number' && Number.isFinite(props.price)) {
    const label = new Intl.NumberFormat('en-GH', {
      maximumFractionDigits: 0,
    }).format(props.price);
    const formatted =
      props.currency === 'USD' ? `$${label}` : props.currency === 'GHS' ? `GHS ${label}` : label;
    priceClause = verb === 'Sale' ? `Price: ${formatted}` : `${formatted}/mo`;
  }

  const compose = (opts: {
    badges: boolean;
    bedPrefixIncluded: boolean;
    ghanaOnly: boolean;
  }): string => {
    let text = `${opts.bedPrefixIncluded ? bedPrefix : ''}${category} for ${verb} in ${
      opts.ghanaOnly ? 'Ghana' : location
    }.`;
    if (priceClause) text += ` ${priceClause}.`;
    if (opts.badges) {
      if (props.isVerified) text += ' Verified.';
      if (props.safemoveActive) text += ' SafeMove protected.';
    }
    return text;
  };

  let result = compose({ badges: true, bedPrefixIncluded: true, ghanaOnly: false });
  if (result.length > MAX_DESCRIPTION_LENGTH) {
    result = compose({ badges: false, bedPrefixIncluded: true, ghanaOnly: false });
  }
  if (result.length > MAX_DESCRIPTION_LENGTH) {
    result = compose({ badges: false, bedPrefixIncluded: false, ghanaOnly: false });
  }
  if (result.length > MAX_DESCRIPTION_LENGTH) {
    result = compose({ badges: false, bedPrefixIncluded: false, ghanaOnly: true });
  }
  return fitSegment(result, MAX_DESCRIPTION_LENGTH);
}
