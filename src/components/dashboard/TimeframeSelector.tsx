'use client';

export type TimeframePeriod = '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

interface TimeframeSelectorProps {
  value: TimeframePeriod;
  onChange: (value: TimeframePeriod) => void;
  isPending?: boolean;
}

export default function TimeframeSelector({ value, onChange, isPending }: TimeframeSelectorProps) {
  const options: { value: TimeframePeriod; label: string }[] = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      )}
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeframe:</span>
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value as TimeframePeriod)}
        className="bg-white border border-slate-200 text-sm font-semibold text-navy-base rounded-lg px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
