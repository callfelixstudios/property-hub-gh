import { describe, expect, it } from 'vitest';
import { parseConsentCookie } from './consent-cookie';

describe('parseConsentCookie', () => {
  it('parses a granted value', () => {
    expect(parseConsentCookie('ph_consent=granted')).toBe('granted');
  });

  it('parses a denied value', () => {
    expect(parseConsentCookie('ph_consent=denied')).toBe('denied');
  });

  it('returns null for an unknown value', () => {
    expect(parseConsentCookie('ph_consent=maybe')).toBeNull();
  });

  it('returns null when the cookie is absent', () => {
    expect(parseConsentCookie('other=1')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseConsentCookie('')).toBeNull();
  });

  it('finds the value embedded among multiple cookies', () => {
    expect(parseConsentCookie('other=1; ph_consent=granted; x=y')).toBe('granted');
    expect(parseConsentCookie('ph_consent=denied; other=1')).toBe('denied');
  });

  it('is case sensitive', () => {
    expect(parseConsentCookie('ph_consent=Granted')).toBeNull();
    expect(parseConsentCookie('PH_CONSENT=granted')).toBeNull();
  });
});