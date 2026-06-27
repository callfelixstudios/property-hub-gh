"use client";

import { Camera, Loader2 } from 'lucide-react';

export function SidebarProfile({
  avatarUrl,
  fullName,
  userEmail,
  isUploading,
  onAvatarClick,
}: {
  avatarUrl?: string | null;
  fullName?: string | null;
  userEmail?: string | null;
  isUploading?: boolean;
  onAvatarClick?: () => void;
}) {
  const displayName = fullName || userEmail || 'User';
  const initials = displayName.charAt(0).toUpperCase();

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
    </div>
  );
}
