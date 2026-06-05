"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

export default function NavigationHeader() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSolidHeader = isScrolled || pathname === '/login' || pathname === '/register' || pathname === '/post-space' || pathname === '/safemove' || pathname === '/dashboard';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolidHeader
          ? "bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 shadow-sm"
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
                isSolidHeader ? "text-navy-base" : "text-white"
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
                isSolidHeader
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              } ${pathname === "/rentals" ? "border-b-2 border-accent-gold" : ""}`}
            >
              Rentals
            </Link>
            <Link
              href="/sales"
              className={`font-medium transition-colors ${
                isSolidHeader
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              } ${pathname === "/sales" ? "border-b-2 border-accent-gold" : ""}`}
            >
              Sales
            </Link>
            <Link
              href="/safemove"
              className={`flex items-center font-medium transition-colors ${
                isSolidHeader
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span className={`${pathname === "/safemove" ? "border-b-2 border-accent-gold" : ""}`}>
                SafeMove
              </span>
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
          </nav>

          {/* Desktop Auth & CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <div className="relative group mr-2">
                <button
                  type="button"
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    isSolidHeader
                      ? "border-slate-300 text-slate-700 hover:border-navy-base hover:text-navy-base bg-white"
                      : "border-white/50 text-white hover:border-white hover:bg-white/10"
                  }`}
                  aria-label="User Menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-hidden">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-navy-base font-medium transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      href="/dashboard?tab=listings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-navy-base font-medium transition-colors"
                    >
                      My Listings
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      type="button"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    isSolidHeader
                      ? "text-slate-700 hover:text-slate-900"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    isSolidHeader
                      ? "text-slate-700 hover:text-slate-900"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Register
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (!session) {
                  router.push('/login?message=Please%20log%20in%20or%20register%20an%20account%20to%20list%20a%20space');
                } else {
                  router.push('/post-space');
                }
              }}
              className="ml-1 bg-accent-gold text-navy-base font-bold py-2 px-5 rounded-full transition-all duration-200 hover:brightness-105 hover:shadow-md"
            >
              + Post a Space
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none cursor-pointer transition-colors ${
                isSolidHeader ? "text-gray-700" : "text-white"
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
        <div className="md:hidden bg-slate-50 border-t border-slate-200 shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/rentals" className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50 ${pathname === "/rentals" ? "bg-gray-100" : ""}`}>
              Rentals
            </Link>
            <Link href="/sales" className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50 ${pathname === "/sales" ? "bg-gray-100" : ""}`}>
              Sales
            </Link>
            <Link href="/safemove" className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50 ${pathname === "/safemove" ? "bg-gray-100" : ""}`}>
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">New</span>
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-navy-base hover:bg-slate-100 ${pathname === "/dashboard" ? "bg-slate-100 text-navy-base font-semibold" : ""}`}>
                  Dashboard
                </Link>
                <Link href="/dashboard?tab=listings" className={`block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-navy-base hover:bg-slate-100`}>
                  My Listings
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-navy-base hover:bg-slate-100 ${pathname === "/login" ? "bg-slate-100 text-navy-base font-semibold" : ""}`}>Login</Link>
                <Link href="/register" className={`block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-navy-base hover:bg-slate-100 ${pathname === "/register" ? "bg-slate-100 text-navy-base font-semibold" : ""}`}>Register</Link>
              </>
            )}
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  if (!session) {
                    router.push('/login?message=Please%20log%20in%20or%20register%20an%20account%20to%20list%20a%20space');
                  } else {
                    router.push('/post-space');
                  }
                }}
                className="block w-full text-center bg-accent-gold text-navy-base font-bold py-2 px-4 rounded-sm transition-opacity hover:opacity-90"
              >
                + Post a Space
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
