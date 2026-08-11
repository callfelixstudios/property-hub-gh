/**
 * Validates a `?next=` redirect target to prevent open redirects.
 * Only plain same-origin relative paths are allowed; anything else
 * returns null so callers can fall back to a safe default.
 */
export function safeDestination(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.includes('\\') || next.includes(':')) return null;
  if (/[\x00-\x1F\x7F]/.test(next)) return null;
  if (/%2f|%5c/i.test(next)) return null;
  return next;
}
