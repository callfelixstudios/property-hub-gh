'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

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

  // On mount: load from DB if authenticated, else fall back to localStorage
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Authenticated — source of truth is the DB profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_currency')
          .eq('id', user.id)
          .single();

        if (profile?.preferred_currency === 'USD' || profile?.preferred_currency === 'GHS') {
          setDisplayCurrency(profile.preferred_currency as Currency);
          // Keep localStorage in sync
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('property_hub_currency', profile.preferred_currency);
          }
          return;
        }
      }

      // Unauthenticated — fall back to localStorage
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('property_hub_currency') as Currency;
        if (stored === 'USD' || stored === 'GHS') {
          setDisplayCurrency(stored);
        }
      }
    };

    init();
  }, []);

  const toggleCurrency = () => {
    setDisplayCurrency(prev => {
      const next = prev === 'GHS' ? 'USD' : 'GHS';

      // Always write to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('property_hub_currency', next);
        // Dispatch storage event so all tabs / components react immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'property_hub_currency',
          newValue: next,
          storageArea: window.localStorage,
        }));
      }

      // If authenticated, also persist to DB
      const persist = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_currency: next })
            .eq('id', user.id);
        }
      };
      persist();

      return next;
    });
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
