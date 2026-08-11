type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 10_000;

/**
 * In-memory sliding-window rate limiter (per server instance).
 * Returns true when the request is allowed, false when the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (buckets.size >= MAX_BUCKETS) {
    const now = Date.now();
    for (const [k, w] of buckets) {
      if (now >= w.resetAt) buckets.delete(k);
    }
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
  }

  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

/** Best-effort client IP from proxy headers (accepts a Request or raw Headers). */
export function getClientIp(requestOrHeaders: Request | Headers): string {
  const headers = requestOrHeaders instanceof Request ? requestOrHeaders.headers : requestOrHeaders;

  const vercelForwarded = headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

  const cloudflare = headers.get('cf-connecting-ip');
  if (cloudflare) return cloudflare.trim();

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown-ip';
}
