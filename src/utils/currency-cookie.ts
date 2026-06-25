export type Currency = 'GHS' | 'USD';

const COOKIE_NAME = 'property_hub_currency';

export function getClientCurrency(): Currency {
  if (typeof document === 'undefined') return 'GHS';

  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (match) {
    const value = decodeURIComponent(match[1]);
    if (value === 'USD' || value === 'GHS') return value;
  }

  // Migrate from localStorage (legacy)
  const stored = window.localStorage.getItem(COOKIE_NAME);
  if (stored === 'USD' || stored === 'GHS') {
    setClientCurrency(stored);
    return stored;
  }

  return 'GHS';
}

export function setClientCurrency(value: Currency): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${31536000}; sameSite=lax`;
}
