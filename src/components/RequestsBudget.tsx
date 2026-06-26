'use client';
import { useCurrency } from '@/context/CurrencyContext';

export default function RequestsBudget({ amount }: { amount: number }) {
  const { formatPrice } = useCurrency();
  return <span className="text-sm font-medium">Up to {formatPrice(amount, 'GHS')}</span>;
}
