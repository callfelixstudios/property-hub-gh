interface CategoryPhrase {
  rent: string;
  sale: string;
}

const CATEGORY_PHRASES: Record<string, CategoryPhrase> = {
  apartment: { rent: 'Apartments for Rent', sale: 'Apartments for Sale' },
  house: { rent: 'Houses for Rent', sale: 'Houses for Sale' },
  'single room self-contain': { rent: 'Rooms for Rent', sale: 'Rooms for Sale' },
  'plot of land': { rent: 'Land for Rent', sale: 'Land for Sale' },
  'office space': { rent: 'Office Space for Rent', sale: 'Office Space for Sale' },
  warehouse: { rent: 'Warehouses for Rent', sale: 'Warehouses for Sale' },
  shop: { rent: 'Shops for Rent', sale: 'Shops for Sale' },
  store: { rent: 'Shops for Rent', sale: 'Shops for Sale' },
};

const FALLBACK_PHRASE: CategoryPhrase = {
  rent: 'Properties for Rent',
  sale: 'Properties for Sale',
};

export function categoryPhrase(category: string, transactionType: 'rent' | 'sale'): string {
  const key = category.trim().toLowerCase();
  return (CATEGORY_PHRASES[key] ?? FALLBACK_PHRASE)[transactionType];
}
