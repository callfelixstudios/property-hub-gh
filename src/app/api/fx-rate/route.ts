import { getUsdToGhsRate } from '@/lib/fx';

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  try {
    const { rate, date, source } = await getUsdToGhsRate();
    return Response.json({ rate, date, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FX_RATE_UNAVAILABLE';
    return Response.json({ error: message }, { status: 503 });
  }
}
