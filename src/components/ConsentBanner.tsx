'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsentChoice, setConsentChoice, type ConsentChoice } from '@/utils/consent-cookie';

export default function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChoice(getConsentChoice());
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  if (choice !== null) return null;

  const handleChoice = (value: ConsentChoice) => {
    setConsentChoice(value);
    setChoice(value);
    if (typeof (window as { gtag?: unknown }).gtag === 'function') {
      (
        window as unknown as {
          gtag: (a: string, b: string, c: { analytics_storage: string }) => void;
        }
      ).gtag('consent', 'update', { analytics_storage: value });
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
        <p className="text-sm text-navy-base">
          We use Google Analytics to understand how our site is used — never for advertising or
          cross-site tracking.{' '}
          <Link href="/cookie-policy" className="underline underline-offset-2 hover:opacity-70">
            Learn more
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleChoice('granted')}
            className="rounded-lg bg-navy-base px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-light"
          >
            Accept
          </button>
          <button
            onClick={() => handleChoice('denied')}
            className="rounded-lg border border-navy-base px-5 py-2.5 text-sm font-bold text-navy-base transition-colors hover:bg-navy-base/5"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}