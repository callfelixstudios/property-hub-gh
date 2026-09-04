export interface FxRate {
  rate: number;
  date: string;
  source: string;
}

function getYesterdayDateString(now: Date = new Date()): string {
  const yesterdayTime = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1,
  );
  return new Date(yesterdayTime).toISOString().slice(0, 10);
}

function extractRateAndDate(payload: unknown): { rate: number; date: string } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const usd = record['usd'];
  if (typeof usd !== 'object' || usd === null) {
    return null;
  }
  const ghs = (usd as Record<string, unknown>)['ghs'];
  if (typeof ghs !== 'number' || !Number.isFinite(ghs) || ghs <= 0 || ghs >= 1000) {
    return null;
  }
  const rawDate = record['date'];
  const date = typeof rawDate === 'string' ? rawDate : '';
  return { rate: ghs, date };
}

export async function getUsdToGhsRate(fetchFn: typeof fetch = fetch): Promise<FxRate> {
  const yesterday = getYesterdayDateString();
  const urls: string[] = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
    'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json',
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${yesterday}/v1/currencies/usd.min.json`,
    `https://${yesterday}.currency-api.pages.dev/v1/currencies/usd.min.json`,
  ];
  const requestInit = { next: { revalidate: 86400 } } as unknown as RequestInit;

  for (const url of urls) {
    try {
      const res = await fetchFn(url, requestInit);
      if (!res.ok) {
        continue;
      }
      const json: unknown = await res.json();
      const parsed = extractRateAndDate(json);
      if (parsed === null) {
        continue;
      }
      // Normalize to 2 decimals at the single source of truth so the header
      // hint ("1 USD = 11.29 GHS") and every conversion (display + filters)
      // use the exact same rate — no full-precision vs rounded mismatch.
      const rate = Math.round(parsed.rate * 100) / 100;
      return { rate, date: parsed.date, source: url };
    } catch {
      continue;
    }
  }

  throw new Error('FX_RATE_UNAVAILABLE');
}
