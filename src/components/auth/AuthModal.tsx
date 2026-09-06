'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Mail, ArrowLeft, Loader2, X, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { resolvePostLoginDestination } from '@/utils/postLoginDestination';
import { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle } from '@/app/actions/authActions';

type Step = 'select' | 'phone_input' | 'otp_verify' | 'email_login' | 'email_register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmailStep?: 'email_login' | 'email_register';
  redirectTo?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultEmailStep = 'email_login',
  redirectTo,
}: AuthModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(defaultEmailStep);
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep(defaultEmailStep);
      setPhone('');
      setFormattedPhone('');
      setOtp('');
      setFullName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRememberMe(false);
      setErrorMsg(null);
      setLoading(false);
      setResendCooldown(0);
      setSuspended(false);
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      if (res.error?.toLowerCase().includes('user is banned')) { setSuspended(true); }
      else { setErrorMsg(res.error || 'Failed to send OTP code.'); }
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
      if (res.error?.toLowerCase().includes('user is banned')) { setSuspended(true); }
      else { setErrorMsg(res.error || 'Failed to resend OTP code.'); }
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
      if (res.error?.toLowerCase().includes('user is banned')) { setSuspended(true); }
      else { setErrorMsg(res.error || 'Invalid OTP code. Please try again.'); }
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
      if (res.error?.toLowerCase().includes('user is banned')) { setSuspended(true); }
      else { setErrorMsg(res.error || 'Failed to initiate Google sign-in.'); }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('user is banned')) { setSuspended(true); }
      else { setErrorMsg(error.message); }
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
    if (error) { setErrorMsg(error.message); return; }
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative border border-gray-100 animate-in fade-in duration-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" width={32} height={32} alt="PropertyHub GH" className="rounded-lg" />
            <span className="text-sm font-bold text-navy-base tracking-tight">PropertyHub GH</span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-gray-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6">
          {errorMsg && !suspended && (
            <div className="mb-4 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

          {suspended ? (
            <div className="py-4">
              <div className="flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Lock className="h-7 w-7" />
                </div>
              </div>
              <h2 className="mt-5 text-center text-xl font-bold text-navy-base">Account Suspended</h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
                Your account has been suspended by the Property Hub GH trust team. If you believe this is a mistake, please contact our support team.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/" className="w-full rounded-lg bg-navy-base px-5 py-2.5 text-center font-bold text-white transition-colors hover:bg-navy-light">Back to Home</Link>
                <a href="mailto:support@propertyhubgh.com" className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-center font-bold text-slate-700 transition-colors hover:bg-slate-50">Contact Support</a>
              </div>
            </div>
          ) : (
            <>
              {/* STEP: Method Selection */}
              {step === 'select' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-navy-base text-center">Log in or Sign up</h2>
                  <p className="text-sm text-slate-500 text-center">Choose your preferred login option</p>
                  <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <GoogleIcon />Continue with Google
                  </button>
                  <button type="button" onClick={() => { setErrorMsg(null); setStep('phone_input'); }} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-accent-emerald text-white rounded-lg font-bold hover:brightness-105 transition-all disabled:opacity-50">
                    <Phone className="w-5 h-5" />Continue with Phone Number
                  </button>
                  <button type="button" onClick={() => { setErrorMsg(null); setStep(defaultEmailStep); }} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Mail className="w-5 h-5" />Continue with Email
                  </button>
                  <p className="text-xs text-slate-400 text-center pt-2">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-slate-600" onClick={onClose}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-slate-600" onClick={onClose}>Privacy Policy</Link>.
                  </p>
                </div>
              )}

              {/* STEP: Phone Input */}
              {step === 'phone_input' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <button type="button" onClick={() => { setErrorMsg(null); setStep('select'); }} className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <h3 className="text-lg font-bold text-navy-base">Enter your Phone Number</h3>
                  <p className="text-xs text-slate-500">We&apos;ll send a 6-digit verification code via SMS</p>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-navy-base focus-within:border-navy-base transition-all">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-3 border-r border-slate-200 font-medium text-slate-700 text-sm">
                      <span>🇬🇭</span><span>+233</span>
                    </div>
                    <input type="tel" placeholder="24 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-3 outline-none text-navy-base placeholder-gray-400 sm:text-sm" required autoFocus />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-navy-base text-white rounded-lg font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                  </button>
                </form>
              )}

              {/* STEP: OTP Verification */}
              {step === 'otp_verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <button type="button" onClick={() => { setErrorMsg(null); setStep('phone_input'); }} className="flex items-center text-xs text-slate-500 hover:text-slate-800 gap-1 mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Change Number
                  </button>
                  <h3 className="text-lg font-bold text-navy-base">Enter Verification Code</h3>
                  <p className="text-xs text-slate-500">Sent to <span className="font-semibold text-navy-base">{formattedPhone}</span></p>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-3 border border-slate-200 rounded-lg text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-navy-base focus:border-navy-base transition-all" required autoFocus />
                  <button type="submit" disabled={loading} className="w-full py-3 bg-navy-base text-white rounded-lg font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                  </button>
                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-xs text-slate-400">Resend code in <span className="font-semibold text-navy-base">{resendCooldown}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={loading} className="text-xs font-semibold text-navy-base hover:underline disabled:opacity-50">Resend Code</button>
                    )}
                  </div>
                </form>
              )}

              {/* STEP: Email Login (Redesigned) */}
              {step === 'email_login' && (
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-base">Welcome Back</h2>
                    <p className="text-sm text-slate-500 mt-1">Sign in to manage your listings, saved spaces, or inquiries.</p>
                  </div>

                  <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm">
                    <GoogleIcon />Continue with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 tracking-wider uppercase whitespace-nowrap">Or sign in with email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div>
                    <label htmlFor="modal-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input id="modal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-navy-base placeholder-slate-400 focus:ring-2 focus:ring-navy-base/20 focus:border-navy-base transition-all text-sm" required autoFocus />
                  </div>

                  <div>
                    <label htmlFor="modal-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input id="modal-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-lg outline-none text-navy-base placeholder-slate-400 focus:ring-2 focus:ring-navy-base/20 focus:border-navy-base transition-all text-sm" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-navy-base cursor-pointer" />
                      <span className="text-sm text-slate-600">Remember me</span>
                    </label>
                    <Link href="/update-password" onClick={onClose} className="text-sm font-bold text-navy-base hover:underline">Forgot Password?</Link>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 bg-navy-base text-white rounded-lg font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </button>

                  <p className="text-sm text-slate-500 text-center">
                    Don&apos;t have an account?{' '}
                    <button type="button" onClick={() => { setErrorMsg(null); setStep('email_register'); }} className="font-bold text-navy-base hover:underline">Register</button>
                  </p>

                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 text-slate-600 text-xs font-medium rounded-full px-3.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <ColoredLockIcon />
                      <span>256-bit Secure Authentication</span>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP: Email Register (Redesigned) */}
              {step === 'email_register' && (
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-base">Create your account</h2>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Join Ghana&apos;s trusted property network to Save favorite properties, message verified agents, or list your space.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    <GoogleIcon />Continue with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 tracking-wider uppercase whitespace-nowrap">
                      Or register with email
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div>
                    <label htmlFor="modal-fullname" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="modal-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-navy-base placeholder-slate-400 focus:ring-2 focus:ring-navy-base/20 focus:border-navy-base transition-all text-sm bg-white"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="modal-reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-navy-base placeholder-slate-400 focus:ring-2 focus:ring-navy-base/20 focus:border-navy-base transition-all text-sm bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="modal-reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={8}
                        className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-lg outline-none text-navy-base placeholder-slate-400 focus:ring-2 focus:ring-navy-base/20 focus:border-navy-base transition-all text-sm bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">Must be at least 8 characters</p>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    By clicking Create Account, you agree to PropertyHub GH&apos;s{' '}
                    <Link href="/terms" onClick={onClose} className="font-semibold text-slate-700 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" onClick={onClose} className="font-semibold text-slate-700 hover:underline">
                      Privacy Policy
                    </Link>.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-navy-base text-white rounded-lg font-bold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>

                  <p className="text-sm text-slate-500 text-center">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setErrorMsg(null); setStep('email_login'); }}
                      className="font-bold text-navy-base hover:underline"
                    >
                      Login
                    </button>
                  </p>

                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 text-slate-600 text-xs font-medium rounded-full px-3.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <ColoredLockIcon />
                      <span>256-bit Secure Registration</span>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function ColoredLockIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 6.5V4.2C4.5 2.43 5.93 1 7.7 1h0.6C10.07 1 11.5 2.43 11.5 4.2V6.5"
        stroke="#94A3B8"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="2.5" y="6" width="11" height="9" rx="2" fill="url(#auth-lock-grad)" stroke="#D97706" strokeWidth="0.5" />
      <circle cx="8" cy="9.5" r="1.1" fill="#78350F" />
      <path d="M8 10.5V12.5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
      <defs>
        <linearGradient id="auth-lock-grad" x1="2.5" y1="6" x2="13.5" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

