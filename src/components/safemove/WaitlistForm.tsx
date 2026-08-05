"use client";

import React from 'react';

export default function WaitlistForm() {
  return (
    <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl mx-auto w-full" onSubmit={(e) => e.preventDefault()}>
      <input 
        type="email" 
        placeholder="Enter your email address" 
        className="flex-1 px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-navy-base focus:ring-1 focus:ring-navy-base text-gray-900 w-full"
        required
      />
      <button 
        type="submit"
        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-md transition-colors whitespace-nowrap"
      >
        Join Early Access
      </button>
    </form>
  );
}
