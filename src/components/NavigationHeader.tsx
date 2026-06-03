"use client";

import { useState } from "react";
import Link from "next/link";

export default function NavigationHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-ambient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-navy-base">
              Property Hub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/rentals" className="text-gray-700 hover:text-navy-base font-medium transition-colors">
              Rentals
            </Link>
            <Link href="/sales" className="text-gray-700 hover:text-navy-base font-medium transition-colors">
              Sales
            </Link>
            <Link href="/safemove" className="flex items-center text-gray-700 hover:text-navy-base font-medium transition-colors">
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-navy-base font-medium transition-colors">
              Login
            </Link>
            <button className="bg-accent-gold text-navy-base font-bold py-2 px-4 rounded-sm transition-opacity hover:opacity-90">
              [ + Post a Space ]
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-navy-base focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/rentals" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50"
            >
              Rentals
            </Link>
            <Link 
              href="/sales" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50"
            >
              Sales
            </Link>
            <Link 
              href="/safemove" 
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50"
            >
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
            <Link 
              href="/login" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50"
            >
              Login
            </Link>
            <div className="px-3 py-2">
              <button className="w-full bg-accent-gold text-navy-base font-bold py-2 px-4 rounded-sm transition-opacity hover:opacity-90">
                [ + Post a Space ]
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
