import { describe, expect, it } from 'vitest';
import { mapBoostError } from './boostActions';

describe('mapBoostError', () => {
  it('maps insufficient credits to the pricing hint', () => {
    expect(mapBoostError('Insufficient credits')).toBe(
      'Insufficient credits — buy more from /pricing#credits'
    );
  });

  it('maps unboostable listings to a friendly message', () => {
    expect(mapBoostError('Listing not boostable')).toBe(
      'Only active, approved listings you posted can be boosted'
    );
  });

  it('passes through unknown errors', () => {
    expect(mapBoostError('boom')).toBe('Boost failed: boom');
    expect(mapBoostError('')).toBe('Boost failed');
  });
});
