"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NavigationHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-ambient"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className={`text-xl font-bold transition-colors ${
                isScrolled ? "text-navy-base" : "text-white"
              }`}
            >
              Property Hub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/rentals"
              className={`font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Rentals
            </Link>
            <Link
              href="/sales"
              className={`font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Sales
            </Link>
            <Link
              href="/safemove"
              className={`flex items-center font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              }`}
            >
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className={`font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Login
            </Link>
            <Link
              href="/post-space"
              className="bg-accent-gold text-navy-base font-bold py-2 px-4 rounded-sm transition-opacity hover:opacity-90"
            >
              + Post a Space
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none cursor-pointer transition-colors ${
                isScrolled ? "text-gray-700" : "text-white"
              }`}
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
        <div className="md:hidden bg-white border-t border-gray-100 shadow-ambient">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/rentals" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50">
              Rentals
            </Link>
            <Link href="/sales" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50">
              Sales
            </Link>
            <Link href="/safemove" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50">
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">New</span>
            </Link>
            <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50">
              Login
            </Link>
            <div className="px-3 py-2">
              <Link href="/post-space" className="block w-full text-center bg-accent-gold text-navy-base font-bold py-2 px-4 rounded-sm transition-opacity hover:opacity-90">
                + Post a Space
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
