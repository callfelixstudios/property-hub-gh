'use client';
import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Currency } from '@/utils/currency-cookie';
import { getClientCurrency, setClientCurrency } from '@/utils/currency-cookie';

interface CurrencyContextType {
  displayCurrency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
  formatPrice: (amount: number, fromCurrency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialCurrency }: { children: ReactNode; initialCurrency: Currency }) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(initialCurrency);
  const exchangeRate = 11.25;
  const hasInteracted = useRef(false);

  // On mount: sync the source of truth into state (unless user already toggled)
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!hasInteracted.current && user) {
        // Logged in — DB is the source of truth
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_currency')
          .eq('id', user.id)
          .single();

        if (profile?.preferred_currency === 'USD' || profile?.preferred_currency === 'GHS') {
          const dbCurrency = profile.preferred_currency as Currency;
          setDisplayCurrency(dbCurrency);
          setClientCurrency(dbCurrency);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('property_hub_currency', dbCurrency);
          }
        }
      } else if (!hasInteracted.current) {
        // Not logged in — the client-side cookie is the source of truth.
        // Correct any mismatch between the server-rendered initialCurrency
        // and the actual cookie value in the browser.
        const cookieCurrency = getClientCurrency();
        setDisplayCurrency(cookieCurrency);
      }
    };
    init();
  }, []);

  const toggleCurrency = () => {
    hasInteracted.current = true;

    const next: Currency = displayCurrency === 'GHS' ? 'USD' : 'GHS';
    setDisplayCurrency(next);

    setClientCurrency(next);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('property_hub_currency', next);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'property_hub_currency',
        newValue: next,
        storageArea: window.localStorage,
      }));
    }

    const persist = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_currency: next })
            .eq('id', user.id);
        }
      } catch {
        // DB persistence is best-effort — never block the toggle
      }
    };
    persist();
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
