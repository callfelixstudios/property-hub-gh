export type ConsentChoice = 'granted' | 'denied';

export const CONSENT_COOKIE_NAME = 'ph_consent';

export function parseConsentCookie(cookieString: string): ConsentChoice | null {
  const match = cookieString.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  if (match[1] === 'granted') return 'granted';
  if (match[1] === 'denied') return 'denied';
  return null;
}

export function getConsentChoice(): ConsentChoice | null {
  if (typeof document === 'undefined') return null;
  return parseConsentCookie(document.cookie);
}

export function setConsentChoice(choice: ConsentChoice): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSENT_COOKIE_NAME}=${choice}; path=/; max-age=31536000; sameSite=lax`;
}