import { describe, expect, it } from 'vitest';
import { isCronAuthorized } from './route';

describe('isCronAuthorized', () => {
  it('accepts the matching bearer secret', () => {
    expect(isCronAuthorized('Bearer s3cr3t', 's3cr3t')).toBe(true);
  });

  it('rejects mismatches, missing headers, and missing secrets', () => {
    expect(isCronAuthorized('Bearer wrong', 's3cr3t')).toBe(false);
    expect(isCronAuthorized(null, 's3cr3t')).toBe(false);
    expect(isCronAuthorized('Bearer s3cr3t', undefined)).toBe(false);
    expect(isCronAuthorized('Bearer short', 'a-much-longer-secret')).toBe(false);
  });
});
