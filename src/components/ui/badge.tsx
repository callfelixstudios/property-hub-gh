import * as React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#0d1b2a] text-white border-transparent',
  secondary: 'bg-amber-100 text-amber-800 border-transparent',
  destructive: 'bg-red-100 text-red-700 border-transparent',
  outline: 'border border-slate-300 text-slate-700 bg-transparent',
  success: 'bg-emerald-100 text-emerald-700 border-transparent',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeVariant };
