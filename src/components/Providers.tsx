'use client';
import { CurrencyProvider } from '@/context/CurrencyContext';
import type { Currency } from '@/utils/currency-cookie';

export function Providers({ children, initialCurrency }: { children: React.ReactNode; initialCurrency: Currency }) {
  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      {children}
    </CurrencyProvider>
  );
}
