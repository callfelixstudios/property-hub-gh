import React from 'react';

export default function VerifiedBadge() {
  return (
    <div className="group relative inline-flex items-center justify-center w-6 h-6 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full shadow-sm border border-emerald-200 dark:border-emerald-800/50 cursor-pointer">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
      </svg>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
        Verified Property
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
