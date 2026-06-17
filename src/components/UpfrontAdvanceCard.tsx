'use client';

import { useCurrency } from '@/context/CurrencyContext';

interface UpfrontAdvanceCardProps {
  advancePeriod: string;
  rentAdvanceMonths: number;
  rawPrice: number;
  serviceCharge?: number;
  currency?: string;
}

export default function UpfrontAdvanceCard({ 
  advancePeriod, 
  rentAdvanceMonths, 
  rawPrice, 
  serviceCharge = 0, 
  currency = 'GHS' 
}: UpfrontAdvanceCardProps) {
  const { formatPrice } = useCurrency();
  const totalAdvance = rawPrice * rentAdvanceMonths;
  const initialPayment = totalAdvance + serviceCharge;
  const formattedUpfront = formatPrice(initialPayment, currency);
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5 h-full">
      <span className="text-navy-base">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <span className="text-sm font-extrabold text-slate-900 leading-snug">{advancePeriod}</span>
      <span className="text-[10px] sm:text-xs font-semibold text-accent-gold mt-1 bg-accent-gold/10 px-2 py-0.5 rounded w-fit italic border border-accent-gold/20">
        Total Initial Payment: {formattedUpfront}
      </span>
      <span className="text-xs text-slate-500 font-medium mt-1">Required Advance</span>
    </div>
  );
}
