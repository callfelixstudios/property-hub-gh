"use client";

import Link from 'next/link';
import { Camera, Check, Loader2 } from 'lucide-react';
import { shouldShowAgentBadge, type TierSlug } from '@/lib/tiers';

export function SidebarProfile({
  avatarUrl,
  fullName,
  userEmail,
  isUploading,
  onAvatarClick,
  tier,
  isVerifiedAgent,
  creditBalance,
}: {
  avatarUrl?: string | null;
  fullName?: string | null;
  userEmail?: string | null;
  isUploading?: boolean;
  onAvatarClick?: () => void;
  tier?: TierSlug;
  isVerifiedAgent?: boolean;
  creditBalance?: number;
}) {
  const displayName = fullName || userEmail || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const effectiveTier: TierSlug = tier ?? 'free';
  const tierLabel = effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1);
  const showBadge = shouldShowAgentBadge(isVerifiedAgent ?? false, effectiveTier);

  const tierPillClass =
    effectiveTier === 'developer'
      ? 'bg-accent-gold text-navy-base'
      : effectiveTier === 'pro'
        ? 'bg-navy-base text-white'
        : 'bg-slate-100 text-slate-600';

  return (
    <div className="flex flex-col items-center justify-center py-6 border-b border-slate-100">
      <button
        type="button"
        onClick={onAvatarClick}
        disabled={isUploading}
        className="relative w-20 h-20 rounded-full group cursor-pointer overflow-hidden border-4 border-white shadow-md transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Click to update avatar"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] text-white font-medium tracking-wide">CHANGE</span>
            </>
          )}
        </div>
      </button>

      <h3 className="mt-3 text-sm font-semibold text-slate-800 tracking-tight text-center leading-snug px-2">
        {displayName}
      </h3>

      <div className="mt-2 flex flex-col items-center gap-1.5">
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tierPillClass}`}>
          {tierLabel}
        </span>
        {showBadge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent-gold text-navy-base">
            <Check className="w-3 h-3" strokeWidth={3} />
            Verified Agent
          </span>
        )}
        {creditBalance !== undefined && (
          <p className="text-xs text-slate-500">Boost credits: {creditBalance}</p>
        )}
        {(effectiveTier === 'free') && (
          <Link
            href="/pricing"
            className="mt-1 text-xs font-bold text-navy-base border border-navy-base rounded-md px-3 py-1.5 hover:bg-navy-base hover:text-white transition-colors"
          >
            Upgrade
          </Link>
        )}
        <button
          type="button"
          disabled
          title="Extra credit top-ups are coming soon"
          className="mt-1 text-xs font-semibold text-slate-400 border border-slate-200 rounded-md px-3 py-1.5 cursor-not-allowed"
        >
          Buy credits — coming soon
        </button>
      </div>
    </div>
  );
}
