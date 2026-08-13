import type { ReactNode } from "react";

interface ListingSellerCardProps {
  fullName?: string | null;
  companyName?: string | null;
  posterRole?: string | null;
  isVerifiedAgent?: boolean | null;
  isAuthenticated: boolean;
  cta: ReactNode;
}

export default function ListingSellerCard({
  fullName,
  companyName,
  posterRole,
  isVerifiedAgent,
  cta,
}: ListingSellerCardProps) {
  const name = fullName || 'Property Agent';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Listed By</h3>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 bg-navy-base rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
          {fullName ? (
            <span className="leading-none">{name.charAt(0).toUpperCase()}</span>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 0H6a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-900">
            {name}
            {posterRole === 'owner' && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ml-2">Owner</span>
            )}
            {posterRole === 'agent' && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ml-2">Agent</span>
            )}
          </p>
          {companyName && (
            <p className="text-xs text-slate-500">{companyName}</p>
          )}
          {isVerifiedAgent && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-emerald-600">Verified Agent</span>
            </div>
          )}
        </div>
      </div>
      <div>{cta}</div>
    </div>
  );
}
