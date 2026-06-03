"use client";

import { useState } from "react";

export default function SearchWidget() {
  const [activeTab, setActiveTab] = useState<"rent" | "buy" | "safemove">("rent");

  return (
    <div className="w-full max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-6 mb-4">
        {(["rent", "buy", "safemove"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-semibold pb-1 transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? "text-white border-white"
                : "text-white/50 border-transparent hover:text-white/80"
            }`}
          >
            {tab === "rent" ? "Rent" : tab === "buy" ? "Buy" : "SafeMove"}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white rounded-md shadow-ambient overflow-hidden">
        <div className="flex items-center gap-2 flex-1 px-4 py-3">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Neighbourhood, Baatsona..."
            className="flex-1 text-navy-base placeholder:text-gray-400 outline-none bg-transparent text-sm"
            autoFocus
          />
        </div>
        <button className="flex items-center justify-center bg-navy-base hover:bg-navy-light transition-colors px-5 py-3 m-1.5 rounded-sm cursor-pointer">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
