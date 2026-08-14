"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { revokeAllUserSessions } from "@/app/actions/otpActions";
import { Loader2, Lock, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";

function UpdatePasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const hash = window.location.hash;
      const isRecoveryFragment = hash.includes("type=recovery");
      const code = searchParams.get("code");

      const activated = await new Promise<boolean>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" && session?.user) {
            subscription.unsubscribe();
            resolve(true);
          }
        });
        setTimeout(() => {
          subscription.unsubscribe();
          resolve(false);
        }, 3000);
      });

      if (cancelled) return;

      if (activated || isRecoveryFragment) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setReady(true);
          setChecking(false);
          return;
        }
      }

      if (code) {
        const { data: exchange } = await supabase.auth.exchangeCodeForSession(code);
        if (exchange.session?.user) {
          setReady(true);
          setChecking(false);
          return;
        }
      }

      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    await revokeAllUserSessions();
    await supabase.auth.signOut();
    setSuccess(true);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-navy-base" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-navy-base">Password Updated</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your password has been changed successfully. You can now sign in with your new
          password.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-block w-full rounded-lg bg-navy-base px-5 py-2.5 text-center font-bold text-white transition-colors hover:bg-navy-light"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-navy-base">Invalid or Expired Link</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This password reset link is invalid, expired, or has already been used. Please
          request a new one from the administrator.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block w-full rounded-lg bg-navy-base px-5 py-2.5 text-center font-bold text-white transition-colors hover:bg-navy-light"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-base/10 text-navy-base">
          <KeyRound className="h-7 w-7" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-navy-base">Set a New Password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-md outline-none text-navy-base placeholder-gray-400 focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all sm:text-sm"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
          Confirm New Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-md outline-none text-navy-base placeholder-gray-400 focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all sm:text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-navy-base text-white rounded-md font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
      </button>

      <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        Your session is protected with bank-grade encryption
      </p>
    </form>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eab308]">
                <span className="text-[#0d1b2a] font-black text-sm">PH</span>
              </div>
              <span className="text-xl font-bold text-navy-base">Property Hub GH</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-ambient p-6 sm:p-8 border border-slate-100">
          <Suspense fallback={<div className="py-16 text-center text-sm text-slate-500">Loading...</div>}>
            <UpdatePasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}