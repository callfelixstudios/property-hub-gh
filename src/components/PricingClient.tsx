'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Check, Lock, Zap, Star } from 'lucide-react';
import type { PlanPricing } from '@/lib/plansPricing';

interface PricingClientProps {
  plans: PlanPricing[];
  isAuthed: boolean;
}

function ctaFor(plan: PlanPricing): string {
  if (plan.slug === 'free') return 'Start for free';
  return `Subscribe to ${plan.name}`;
}

function billingNoteFor(plan: PlanPricing): string {
  if (plan.price_ghs === 0) return 'Free forever';
  switch (plan.billing_cycle) {
    case 'quarterly':
      return 'per quarter, billed quarterly';
    case 'yearly':
      return 'per year, billed yearly';
    case 'one_time':
      return 'one-time payment';
    default:
      return 'per month, billed monthly';
  }
}

export default function PricingClient({ plans, isAuthed }: PricingClientProps) {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);

  const confirmPayment = useCallback(async (reference: string) => {
    try {
      const r = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
      const j = await r.json().catch(() => ({}));
      if (j.status === 'success' || j.status === 'completed') {
        setSuccessRef(reference);
      } else {
        setPendingMsg('We received your payment; your subscription will be confirmed shortly.');
      }
    } catch {
      setPendingMsg('Payment received; verifying your subscription.');
    } finally {
      setBusySlug(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('reference') || urlParams.get('trxref');
    if (ref) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      void (async () => {
        await confirmPayment(ref);
      })();
    }
  }, [confirmPayment]);

  async function handleSubscribe(plan: PlanPricing) {
    setBusySlug(plan.slug);
    setErrorMsg(null);
    setSuccessRef(null);
    setPendingMsg(null);

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503) {
          setErrorMsg('Payments are being set up — check back soon');
        } else {
          setErrorMsg(data.error || 'Could not start checkout');
        }
        setBusySlug(null);
        return;
      }

      if (data.authorization_url) {
        window.location.assign(data.authorization_url);
      } else {
        setErrorMsg('Could not start checkout');
        setBusySlug(null);
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
      setBusySlug(null);
    }
  }

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      {successRef && (
        <div role="status" className="mb-8 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 shadow-sm flex items-center gap-3">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>Payment received — your subscription is now active (Ref: {successRef}).</span>
        </div>
      )}
      {pendingMsg && (
        <div role="status" className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800 shadow-sm flex items-center gap-3">
          <span className="text-amber-600 font-bold">⏳</span>
          <span>{pendingMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div role="alert" className="mb-8 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-800 shadow-sm flex items-center gap-3">
          <span className="text-red-600 font-bold">✕</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan) => {
          const isDark = plan.slug === 'developer';
          const cta = ctaFor(plan);

          return (
            <div
              key={plan.slug}
              className={[
                'relative flex flex-col rounded-2xl transition-all duration-300 p-6 sm:p-8 lg:p-9 shadow-sm',
                isDark
                  ? 'bg-navy-base ring-2 ring-accent-gold/40 lg:scale-[1.02] shadow-xl'
                  : 'bg-white border border-slate-200',
                isDark
                  ? 'hover:-translate-y-1.5 hover:shadow-2xl'
                  : 'hover:-translate-y-1 hover:shadow-ambient',
              ].join(' ')}
            >
              {plan.slug === 'pro' && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-navy-base rounded-t-2xl" />
              )}

              <div className="mb-5 flex items-center gap-2">
                {plan.slug === 'developer' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-gold text-navy-base text-xs font-extrabold px-3.5 py-1 tracking-wide shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Most popular
                  </span>
                ) : plan.slug === 'pro' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-base text-white text-xs font-bold px-3.5 py-1 tracking-wide">
                    <Zap className="w-3.5 h-3.5 fill-current text-accent-gold" />
                    Most Value
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 tracking-wide border border-slate-200/60">
                    Free forever
                  </span>
                )}
              </div>

              <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-accent-gold/80' : 'text-slate-400'}`}>
                {plan.name} Plan
              </p>

              <div className="flex items-end gap-1.5 mb-1">
                <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>GHS</span>
                <span className={`text-4xl lg:text-5xl font-extrabold leading-none tracking-tight ${isDark ? 'text-white' : 'text-navy-base'}`}>
                  {plan.price_ghs === 0 ? '0' : plan.price_ghs}
                </span>
              </div>
              <p className={`text-xs sm:text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {billingNoteFor(plan)}
              </p>

              <div className={`border-t mb-6 ${isDark ? 'border-white/15' : 'border-slate-200'}`} />

              <ul className="space-y-3.5 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded-full p-0.5 ${isDark ? 'bg-accent-gold/20' : 'bg-slate-100'}`}>
                      <Check
                        className={`w-3.5 h-3.5 ${isDark ? 'text-accent-gold' : 'text-navy-base'}`}
                        aria-hidden="true"
                        strokeWidth={2.5}
                      />
                    </span>
                    <span className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                {plan.slug === 'free' ? (
                  isAuthed ? (
                    <Link
                      href="/dashboard"
                      className="block w-full text-center rounded-xl bg-slate-100 text-slate-700 font-bold py-3 px-4 hover:bg-slate-200 transition-all duration-200 text-sm border border-slate-200"
                    >
                      Go to Dashboard (Current Plan)
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="block w-full text-center rounded-xl border-2 border-navy-base text-navy-base bg-transparent font-bold py-3 px-4 hover:bg-navy-base hover:text-white transition-all duration-200 text-sm"
                    >
                      {cta}
                    </Link>
                  )
                ) : !isAuthed ? (
                  <Link
                    href="/login"
                    className={`block w-full text-center rounded-xl font-bold py-3 px-4 transition-all duration-200 text-sm shadow-sm ${
                      isDark
                        ? 'bg-accent-gold text-navy-base hover:brightness-105'
                        : 'bg-navy-base text-white hover:bg-navy-light'
                    }`}
                  >
                    Sign in to subscribe
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan)}
                    disabled={busySlug === plan.slug}
                    className={`w-full rounded-xl font-bold py-3.5 px-4 transition-all duration-200 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      isDark
                        ? 'bg-accent-gold text-navy-base hover:brightness-105 font-extrabold'
                        : 'bg-navy-base text-white hover:bg-navy-light'
                    }`}
                  >
                    {busySlug === plan.slug ? 'Starting checkout...' : cta}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        Subscriptions renew monthly. Cancel anytime.
      </p>
    </div>
  );
}
