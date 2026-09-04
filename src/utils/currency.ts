export function convertFilterPriceToDb(
  priceString: string | string[] | undefined,
  displayCurrency: string,
  rate?: number
): number | null {
  if (!priceString || Array.isArray(priceString)) return null;

  const parsedPrice = Number(priceString);
  if (!Number.isFinite(parsedPrice)) return null;

  if (displayCurrency === 'USD') {
    // No magic-number fallback: an invalid/missing server rate means
    // the USD filter cannot be converted — callers treat null as "no bound".
    if (!Number.isFinite(rate) || (rate as number) <= 0) return null;
    return Math.round(parsedPrice * (rate as number));
  }

  return parsedPrice;
}
