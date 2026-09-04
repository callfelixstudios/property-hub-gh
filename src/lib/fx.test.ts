import { describe, expect, it, vi } from 'vitest';
import { getUsdToGhsRate } from './fx';

const PRIMARY_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json';
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json';

function okResponse(ghs: unknown, date = '2026-09-03'): Response {
  return {
    ok: true,
    json: async () => ({ date, usd: { ghs } }),
  } as unknown as Response;
}

function failedResponse(): Response {
  return {
    ok: false,
    json: async () => ({}),
  } as unknown as Response;
}

describe('getUsdToGhsRate', () => {
  it('primary success returns rate', async () => {
    const fetchFn = vi.fn(async () => okResponse(15.2, '2026-09-03')) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(15.2);
    expect(result.date).toBe('2026-09-03');
    expect(result.source).toBe(PRIMARY_URL);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('primary fail -> fallback success', async () => {
    const fetchFn = vi
      .fn(async (url: string | URL | Request) => {
        if (String(url) === PRIMARY_URL) {
          throw new Error('network down');
        }
        return okResponse(12.7, '2026-09-03');
      }) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(12.7);
    expect(result.source).toBe(FALLBACK_URL);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('invalid ghs (0) -> skips to next', async () => {
    const fetchFn = vi
      .fn(async (url: string | URL | Request) => {
        if (String(url) === PRIMARY_URL) {
          return okResponse(0, '2026-09-03');
        }
        return okResponse(11.4, '2026-09-03');
      }) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(11.4);
    expect(result.source).toBe(FALLBACK_URL);
  });

  it('invalid ghs (NaN) -> skips to next', async () => {
    const fetchFn = vi
      .fn(async (url: string | URL | Request) => {
        if (String(url) === PRIMARY_URL) {
          return okResponse(Number.NaN, '2026-09-03');
        }
        return okResponse(10.9, '2026-09-03');
      }) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(10.9);
    expect(result.source).toBe(FALLBACK_URL);
  });

  it('non-ok primary -> skips to next', async () => {
    const fetchFn = vi
      .fn(async (url: string | URL | Request) => {
        if (String(url) === PRIMARY_URL) {
          return failedResponse();
        }
        return okResponse(13.1, '2026-09-03');
      }) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(13.1);
    expect(result.source).toBe(FALLBACK_URL);
  });

  it('all fail -> throws', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('down');
    }) as unknown as typeof fetch;
    await expect(getUsdToGhsRate(fetchFn)).rejects.toThrow('FX_RATE_UNAVAILABLE');
  });

  it('rounds full-precision rate to 2 decimals', async () => {
    const fetchFn = vi.fn(async () => okResponse(11.29297284, '2026-09-03')) as unknown as typeof fetch;
    const result = await getUsdToGhsRate(fetchFn);
    expect(result.rate).toBe(11.29);
    // User example: GHS300,000 / 11.29 = $26,572
    expect(Math.round(300000 / result.rate)).toBe(26572);
  });
});
