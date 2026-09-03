'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Minus, Plus, Zap } from 'lucide-react';

type Status = 'idle' | 'working' | 'success' | 'pending' | 'error' | 'unavailable' | 'login';

export default function CreditPurchaseButton({
  creditPriceGhs,
  minQty,
  maxQty,
  compact = false,
}: {
  creditPriceGhs: number;
  minQty: number;
  maxQty: number;
  compact?: boolean;
}) {
  const [qty, setQty] = useState(minQty);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const total = qty * creditPriceGhs;

  const clampQty = (next: number) =>
    setQty(Math.min(maxQty, Math.max(minQty, next)));

  const verifyReference = async (reference: string) => {
    try {
      const r = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
      const j = await r.json().catch(() => ({}));
      if (j.status === 'success' || j.status === 'completed') {
        setStatus('success');
        setMessage('Payment received — your credits are now available.');
      } else {
        setStatus('pending');
        setMessage("Payment received — we'll confirm shortly.");
      }
    } catch {
      setStatus('pending');
      setMessage('Payment received; verifying your credits.');
    }
  };

  const handleBuy = async () => {
    setStatus('working');
    setMessage(null);
    try {
      const res = await fetch('/api/paystack/credits/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 503) {
        setStatus('unavailable');
        return;
      }
      if (res.status === 401) {
        setStatus('login');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Could not start checkout');
        return;
      }

      if (data.access_code && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        const { default: PaystackPop } = await import('@paystack/inline-js');
        const popup = new PaystackPop();
        popup.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          access_code: data.access_code,
          onSuccess: (tr: { reference: string }) => {
            void verifyReference(tr.reference || data.reference);
          },
          onCancel: () => {
            setStatus('idle');
          },
        });
      } else if (data.authorization_url) {
        window.location.assign(data.authorization_url);
      } else {
        setStatus('error');
        setMessage('Could not start checkout');
      }
    } catch {
      setStatus('error');
      setMessage('A network error occurred. Please try again.');
    }
  };

  if (status === 'unavailable') {
    return (
      <button
        type="button"
        disabled
        className={`${compact ? 'text-xs px-3 py-1.5' : 'text-sm py-3 px-4'} rounded-xl bg-slate-100 text-slate-400 font-bold border border-slate-200 cursor-not-allowed w-full sm:w-auto`}
      >
        Payments not configured
      </button>
    );
  }

  if (status === 'login') {
    return (
      <Link
        href="/login"
        className={`${compact ? 'text-xs px-3 py-1.5' : 'text-sm py-3 px-4'} block w-full sm:w-auto text-center rounded-xl bg-navy-base text-white font-bold hover:bg-navy-light transition-colors`}
      >
        Sign in to buy credits
      </Link>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${compact ? '' : 'w-full sm:w-auto'}`}>
      {(status === 'success' || status === 'pending') && message && (
        <div
          role="status"
          className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
            status === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {message}
        </div>
      )}
      {status === 'error' && message && (
        <div
          role="alert"
          className="rounded-xl px-4 py-2.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-800"
        >
          {message}
        </div>
      )}
      <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
        <div
          className={`flex items-center rounded-xl border overflow-hidden ${
            compact ? 'border-slate-200 bg-slate-50' : 'border-white/15 bg-white/10'
          }`}
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => clampQty(qty - 1)}
            disabled={qty <= minQty || status === 'working'}
            className={`${compact ? 'text-navy-base hover:bg-slate-100' : 'text-white hover:bg-white/10'} p-2 disabled:opacity-40`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className={`font-bold text-center ${compact ? 'w-6 text-xs text-navy-base' : 'w-8 text-sm text-white'}`}>
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => clampQty(qty + 1)}
            disabled={qty >= maxQty || status === 'working'}
            className={`${compact ? 'text-navy-base hover:bg-slate-100' : 'text-white hover:bg-white/10'} p-2 disabled:opacity-40`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleBuy}
          disabled={status === 'working'}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-gold text-navy-base font-extrabold hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${compact ? 'text-xs px-3 py-1.5' : 'text-sm py-3 px-4'}`}
        >
          {status === 'working' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-current" />
          )}
          {status === 'working'
            ? 'Starting checkout...'
            : `Buy ${qty} credit${qty > 1 ? 's' : ''} — GHS ${total}`}
        </button>
      </div>
    </div>
  );
}
