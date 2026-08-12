'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Mail, ArrowLeft, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { resolvePostLoginDestination } from '@/utils/postLoginDestination';
import { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle } from '@/app/actions/authActions';

type Step = 'select' | 'phone_input' | 'otp_verify' | 'email_login' | 'email_register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Default to login or register view when email is selected */
  defaultEmailStep?: 'email_login' | 'email_register';
  /** Where to redirect after successful auth */
  redirectTo?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultEmailStep = 'email_login',
  redirectTo,
}: AuthModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');

  // Phone state
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Email state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Shared state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset state when modal opens (render-time adjustment, avoids setState-in-effect)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep('select');
      setPhone('');
      setFormattedPhone('');
      setOtp('');
      setFullName('');
      setEmail('');
      setPassword('');
      setErrorMsg(null);
      setLoading(false);
      setResendCooldown(0);
    }
  }

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSendOtp = async (e: React.FormEvent) => {
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
      setStep('otp_verify');
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await verifyPhoneOtp(formattedPhone, otp);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid OTP code. Please try again.');
      return;
    }

    onClose();
    const supabase = createClient();
    router.push(await resolvePostLoginDestination(supabase, redirectTo));
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await signInWithGoogle(redirectTo);
    if (!res.success) {
      setLoading(false);
      setErrorMsg(res.error || 'Failed to initiate Google sign-in.');
    }
    // Browser will redirect to Google — loading stays true
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    onClose();
    router.push(await resolvePostLoginDestination(supabase, redirectTo));
    router.refresh();
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    onClose();
    router.push('/login?message=Account%20created%20successfully.%20Please%20log%20in.');
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-base/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-md shadow-ambient p-6 relative border border-gray-100 animate-in fade-in duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* ─── STEP: Method Selection ─── */}
        {step === 'select' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-navy-base text-center">
              Log in or Sign up
            </h2>
            <p className="text-sm text-slate-500 text-center">
              Choose your preferred login option
            </p>

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

            {/* Phone Number — Primary for Ghana */}
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep('phone_input'); }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-accent-emerald text-white rounded-md font-bold hover:brightness-105 transition-all disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
              Continue with Phone Number
            </button>

            {/* Email */}
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep(defaultEmailStep); }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>

            <p className="text-xs text-slate-400 text-center pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}

        {/* ─── STEP: Phone Input ─── */}
        {step === 'phone_input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep('select'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h3 className="text-lg font-bold text-navy-base">Enter your Phone Number</h3>
            <p className="text-xs text-slate-500">
              We&apos;ll send a 6-digit verification code via SMS
            </p>

            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-navy-base focus-within:border-navy-base transition-all">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-3 border-r border-slate-200 font-medium text-slate-700 text-sm">
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

        {/* ─── STEP: OTP Verification ─── */}
        {step === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep('phone_input'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Change Number
            </button>
            <h3 className="text-lg font-bold text-navy-base">Enter Verification Code</h3>
            <p className="text-xs text-slate-500">
              Sent to <span className="font-semibold text-navy-base">{formattedPhone}</span>
            </p>

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

        {/* ─── STEP: Email Login ─── */}
        {step === 'email_login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep('select'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h3 className="text-lg font-bold text-navy-base">Sign in with Email</h3>

            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-md outline-none text-navy-base placeholder-gray-400 focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all sm:text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="modal-password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setStep('email_register'); }}
                className="font-semibold text-navy-base hover:underline"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {/* ─── STEP: Email Register ─── */}
        {step === 'email_register' && (
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setStep('select'); }}
              className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h3 className="text-lg font-bold text-navy-base">Create your Account</h3>

            <div>
              <label htmlFor="modal-fullname" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="modal-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-md outline-none text-navy-base placeholder-gray-400 focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all sm:text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="modal-reg-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="modal-reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-md outline-none text-navy-base placeholder-gray-400 focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-reg-password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="modal-reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setStep('email_login'); }}
                className="font-semibold text-navy-base hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/** Inline Google "G" logo SVG to avoid external asset dependency */
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
