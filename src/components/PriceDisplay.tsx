'use client';
import { useCurrency } from '@/context/CurrencyContext';

interface PriceDisplayProps {
  rawPrice: number;
  currency?: string;
  priceSuffix?: string;
  rentAdvanceMonths?: number;
  isRental?: boolean;
  serviceCharge?: number;
  isInline?: boolean;
}

export default function PriceDisplay({ 
  rawPrice, 
  currency = 'GHS', 
  priceSuffix, 
  rentAdvanceMonths = 1, 
  isRental = false,
  serviceCharge = 0,
  isInline = false
}: PriceDisplayProps) {
  const { formatPrice, displayCurrency } = useCurrency();
  const formattedPrice = formatPrice(rawPrice, currency);
  
  if (isInline) {
    return <span className="font-bold">{formattedPrice}</span>;
  }
  
  return (
    <div className="flex items-baseline gap-2 flex-wrap text-lg font-extrabold text-inherit">
      <span>{formattedPrice}</span>
      {priceSuffix && <span className="text-xs font-normal opacity-70">{priceSuffix}</span>}
    </div>
  );
}
