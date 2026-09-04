'use client';
import { CurrencyProvider } from '@/context/CurrencyContext';
import type { Currency } from '@/utils/currency-cookie';

export function Providers({ children, initialCurrency, initialRate, initialRateDate }: { children: React.ReactNode; initialCurrency: Currency; initialRate: number; initialRateDate: string }) {
  return (
    <CurrencyProvider initialCurrency={initialCurrency} initialRate={initialRate} initialRateDate={initialRateDate}>
      {children}
    </CurrencyProvider>
  );
}
