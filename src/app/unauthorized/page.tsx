import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Access Restricted | Property Hub GH',
  description: 'This area is restricted to authorized administrators only.',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-slate-400 text-base leading-relaxed mb-2">
          This area is reserved for authorized Property Hub GH administrators only.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Valid sessions require a{' '}
          <span className="text-slate-300 font-mono">@propertyhubgh.com</span>{' '}
          email address.
        </p>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-8" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#eab308] hover:bg-[#ca9a06] text-[#0d1b2a] text-sm font-bold transition-colors"
          >
            Sign in with Admin Account
          </Link>
        </div>
      </div>
    </div>
  );
}
