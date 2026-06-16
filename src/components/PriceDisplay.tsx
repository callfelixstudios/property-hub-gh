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
  
  const showUpfront = isRental && rentAdvanceMonths > 1;
  const upfrontPrice = showUpfront ? formatPrice((rawPrice + serviceCharge) * rentAdvanceMonths, currency) : null;
  
  return (
    <div className="flex flex-col">
      <div className="text-lg font-extrabold text-slate-900 dark:text-white">
        {formattedPrice}
        {priceSuffix && <span className="text-xs font-normal text-gray-500 dark:text-gray-300 ml-1">{priceSuffix}</span>}
      </div>
      {showUpfront && (
        <div className="text-[10px] sm:text-xs font-semibold text-accent-gold mt-1 bg-accent-gold/10 px-2 py-0.5 rounded w-fit italic border border-accent-gold/20">
          Total Upfront: {upfrontPrice} ({rentAdvanceMonths} Mos. Advance)
        </div>
      )}
    </div>
  );
}
