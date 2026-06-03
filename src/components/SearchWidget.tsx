"use client";

import { useState } from "react";

export default function SearchWidget() {
  const [activeTab, setActiveTab] = useState<"renting" | "buying">("renting");

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-md shadow-ambient p-2">
      {/* Macro Tabs */}
      <div className="flex gap-2 mb-2 p-1 bg-surface-primary rounded-sm">
        <button
          onClick={() => setActiveTab("renting")}
          className={`flex-1 py-3 text-sm font-semibold rounded-sm transition-colors ${
            activeTab === "renting"
              ? "bg-white text-navy-base shadow-sm"
              : "text-navy-base/60 hover:text-navy-base hover:bg-white/50"
          }`}
        >
          Renting
        </button>
        <button
          onClick={() => setActiveTab("buying")}
          className={`flex-1 py-3 text-sm font-semibold rounded-sm transition-colors ${
            activeTab === "buying"
              ? "bg-white text-navy-base shadow-sm"
              : "text-navy-base/60 hover:text-navy-base hover:bg-white/50"
          }`}
        >
          Buying
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-sm focus-within:border-navy-light focus-within:ring-2 focus-within:ring-navy-base/10 transition-all">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search area, neighborhood, or city (e.g. East Legon)..."
          autoFocus
          className="flex-1 py-2 text-navy-base placeholder:text-gray-400 outline-none bg-transparent"
        />
        <button className="px-6 py-2 bg-navy-base text-white font-semibold rounded-sm hover:bg-navy-light transition-colors">
          Search
        </button>
      </div>
    </div>
  );
}
