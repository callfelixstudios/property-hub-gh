'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'GHS' | 'USD';

interface CurrencyContextType {
  displayCurrency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
  formatPrice: (amount: number, fromCurrency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('GHS');
  const exchangeRate = 11.25;

  const toggleCurrency = () => {
    setDisplayCurrency(prev => prev === 'GHS' ? 'USD' : 'GHS');
  };

  const formatPrice = (amount: number, fromCurrency: string) => {
    let convertedAmount = amount;
    
    const normalizedFromCurrency = fromCurrency?.toUpperCase() === 'USD' ? 'USD' : 'GHS';

    if (normalizedFromCurrency === 'GHS' && displayCurrency === 'USD') {
      convertedAmount = amount / exchangeRate;
    } else if (normalizedFromCurrency === 'USD' && displayCurrency === 'GHS') {
      convertedAmount = amount * exchangeRate;
    }
    
    return displayCurrency === 'GHS' 
      ? `₵${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
      : `$${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ displayCurrency, toggleCurrency, exchangeRate, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
