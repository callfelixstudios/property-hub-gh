import { describe, expect, it } from 'vitest';
import { categoryPhrase } from './categoryMeta';

describe('categoryPhrase', () => {
  it('maps each supported category to its rent phrase', () => {
    expect(categoryPhrase('Apartment', 'rent')).toBe('Apartments for Rent');
    expect(categoryPhrase('House', 'rent')).toBe('Houses for Rent');
    expect(categoryPhrase('Single Room Self-Contain', 'rent')).toBe('Rooms for Rent');
    expect(categoryPhrase('Plot of Land', 'rent')).toBe('Land for Rent');
    expect(categoryPhrase('Office Space', 'rent')).toBe('Office Space for Rent');
    expect(categoryPhrase('Warehouse', 'rent')).toBe('Warehouses for Rent');
    expect(categoryPhrase('Shop', 'rent')).toBe('Shops for Rent');
    expect(categoryPhrase('Store', 'rent')).toBe('Shops for Rent');
  });

  it('maps each supported category to its sale phrase', () => {
    expect(categoryPhrase('Apartment', 'sale')).toBe('Apartments for Sale');
    expect(categoryPhrase('House', 'sale')).toBe('Houses for Sale');
    expect(categoryPhrase('Single Room Self-Contain', 'sale')).toBe('Rooms for Sale');
    expect(categoryPhrase('Plot of Land', 'sale')).toBe('Land for Sale');
    expect(categoryPhrase('Office Space', 'sale')).toBe('Office Space for Sale');
    expect(categoryPhrase('Warehouse', 'sale')).toBe('Warehouses for Sale');
    expect(categoryPhrase('Shop', 'sale')).toBe('Shops for Sale');
    expect(categoryPhrase('Store', 'sale')).toBe('Shops for Sale');
  });

  it('matches case-insensitively', () => {
    expect(categoryPhrase('apartment', 'rent')).toBe('Apartments for Rent');
    expect(categoryPhrase('PLOT OF LAND', 'sale')).toBe('Land for Sale');
  });

  it('falls back to generic phrases for unknown categories', () => {
    expect(categoryPhrase('Hostel', 'rent')).toBe('Properties for Rent');
    expect(categoryPhrase('Villa / Mansion', 'sale')).toBe('Properties for Sale');
    expect(categoryPhrase('', 'rent')).toBe('Properties for Rent');
  });
});
