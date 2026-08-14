'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { exitImpersonation } from '@/app/actions/userManagementActions';

export default function ImpersonationBanner() {
  const pathname = usePathname();
  const [info, setInfo] = useState<{ userId: string; expiresAt: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith('ph_impersonating='))
      ?.split('=')[1];
    if (!raw) return;
    const timeout = setTimeout(() => {
      try {
        setInfo(JSON.parse(decodeURIComponent(raw)));
      } catch {
        // ignore malformed cookie
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (info && info.expiresAt < Date.now()) {
      startTransition(async () => {
        try {
          await exitImpersonation();
        } catch {
          // already exited server-side
        }
      });
    }
  }, [info]);

  if (!info || pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white text-sm font-medium shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>You are viewing the platform as this user. All actions are audited.</span>
        </div>
        <button
          onClick={() => {
            setPending(true);
            startTransition(async () => {
              try {
                await exitImpersonation();
              } catch {
                setPending(false);
              }
            });
          }}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          {pending ? 'Exiting…' : 'Exit'}
        </button>
      </div>
    </div>
  );
}
