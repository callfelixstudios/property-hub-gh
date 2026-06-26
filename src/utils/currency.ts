export const USD_TO_GHS_RATE = 11.25;

export function convertFilterPriceToDb(
  priceString: string | string[] | undefined,
  displayCurrency: string
): number | null {
  if (!priceString || Array.isArray(priceString)) return null;

  const parsedPrice = Number(priceString);
  if (isNaN(parsedPrice)) return null;

  if (displayCurrency === 'USD') {
    return Math.round(parsedPrice * USD_TO_GHS_RATE);
  }

  return parsedPrice;
}
