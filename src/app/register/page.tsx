"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Phone, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle } from "@/app/actions/authActions";

type AuthMethod = 'select' | 'email' | 'phone' | 'otp';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // URL Params
  const next = searchParams.get('next');

  // UI Flow State
  const [method, setMethod] = useState<AuthMethod>('select');

  // Email registration state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone state
  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Shared state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleEmailRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/login?message=Account%20created%20successfully.%20Please%20log%20in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await sendPhoneOtp(phone);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send OTP code.');
      return;
    }

    if (res.formattedPhone) {
      setFormattedPhone(res.formattedPhone);
      setMethod('otp');
      setResendCooldown(60);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setLoading(true);

    const res = await sendPhoneOtp(phone);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to resend OTP code.');
      return;
    }

    setResendCooldown(60);
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await verifyPhoneOtp(formattedPhone, otp);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid OTP code. Please try again.');
      return;
    }

    router.push(next || "/rentals");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await signInWithGoogle(next || undefined);
    if (!res.success) {
      setLoading(false);
      setErrorMsg(res.error || 'Failed to initiate Google sign-in.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-md shadow-ambient border border-gray-100">
        <div>
          {/* Tab Navigation (only visible when in select or email step) */}
          {(method === 'select' || method === 'email') && (
            <div className="flex justify-center space-x-6 mb-6">
              <Link href="/login" className="font-medium pb-1 text-slate-400 hover:text-navy-base transition-colors">Login</Link>
              <Link href="/register" className="font-bold pb-1 text-navy-base border-b-2 border-accent-gold">Register</Link>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-navy-base">
            {method === 'otp' ? 'Enter Verification Code' : method === 'phone' ? 'Enter Phone Number' : 'Create your Property Hub account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {method === 'otp' ? (
              <>Sent to <span className="font-semibold text-navy-base">{formattedPhone}</span></>
            ) : method === 'phone' ? (
              "We'll send a 6-digit verification code via SMS"
            ) : (
              "Choose your preferred registration method"
            )}
          </p>
        </div>

        {/* ─── METHOD SELECT ─── */}
        {method === 'select' && (
          <div className="space-y-4 pt-2">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Phone Number OTP */}
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setMethod('phone'); }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-accent-emerald text-white rounded-md font-bold hover:brightness-105 transition-all disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
              Continue with Phone Number
            </button>

            {/* Email Registration */}
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setMethod('email'); }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>
          </div>
        )}

        {/* ─── EMAIL REGISTER FORM ─── */}
        {method === 'email' && (
          <form method="POST" className="mt-6 space-y-6" onSubmit={handleEmailRegister}>
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setMethod('select'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to options
            </button>

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-sm focus:border-navy-base focus:outline-none focus:ring-1 focus:ring-navy-base sm:text-sm"
                  placeholder="John Doe"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-sm focus:border-navy-base focus:outline-none focus:ring-1 focus:ring-navy-base sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-sm focus:border-navy-base focus:outline-none focus:ring-1 focus:ring-navy-base sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-md bg-navy-base text-white font-bold py-3 px-4 hover:bg-navy-light focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
            </button>
          </form>
        )}

        {/* ─── PHONE INPUT FORM ─── */}
        {method === 'phone' && (
          <form className="mt-6 space-y-6" onSubmit={handleSendOtp}>
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setMethod('select'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to options
            </button>

            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-navy-base focus-within:border-navy-base transition-all">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-3 border-r border-slate-200 font-medium text-slate-700 text-sm select-none">
                <span>🇬🇭</span>
                <span>+233</span>
              </div>
              <input
                type="tel"
                placeholder="24 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-3 outline-none text-navy-base placeholder-gray-400 sm:text-sm"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy-base text-white rounded-md font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </button>
          </form>
        )}

        {/* ─── OTP VERIFICATION FORM ─── */}
        {method === 'otp' && (
          <form className="mt-6 space-y-6" onSubmit={handleVerifyOtp}>
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setMethod('phone'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Change Number
            </button>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-3 border border-slate-200 rounded-md text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy-base text-white rounded-md font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-400">
                  Resend code in <span className="font-semibold text-navy-base">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-semibold text-navy-base hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* Bottom Switch */}
        {(method === 'select' || method === 'email') && (
          <p className="mt-4 text-center text-sm text-navy-base">
            Already have an account? <Link href="/login" className="font-medium text-slate-900 hover:underline">Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
