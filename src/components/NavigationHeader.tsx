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
              } ${pathname === "/rentals" ? "border-b-2 border-accent-gold" : ""}`}
            >
              Rentals
            </Link>
            <Link
              href="/sales"
              className={`font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              } ${pathname === "/sales" ? "border-b-2 border-accent-gold" : ""}`}
            >
              Sales
            </Link>
            <Link
              href="/safemove"
              className={`flex items-center font-medium transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-navy-base"
                  : "text-white/80 hover:text-white"
              } ${pathname === "/safemove" ? "border-b-2 border-accent-gold" : ""}`}
            >
              SafeMove
              <span className="ml-2 bg-accent-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
          </nav>

          {/* Desktop Auth & CTA */}
          <div className="hidden md:flex items-center space-x-1">
            {session ? null : (
              <>
                <Link
                  href="/login"
                  className={`relative px-3 py-1.5 text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                    isScrolled
                      ? "text-slate-600 hover:text-navy-base"
                      : "text-white/70 hover:text-white"
                  } ${pathname === "/login" ? "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4/5 after:h-0.5 after:bg-accent-gold after:rounded-full" : ""}`}
                >
                  Login
                </Link>
                <span className={`mx-1 text-xs select-none ${isScrolled ? "text-slate-300" : "text-white/30"}`}>•</span>
                <Link
                  href="/register"
                  className={`relative px-3 py-1.5 text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                    isScrolled
                      ? "text-slate-600 hover:text-navy-base"
                      : "text-white/70 hover:text-white"
                  } ${pathname === "/register" ? "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4/5 after:h-0.5 after:bg-accent-gold after:rounded-full" : ""}`}
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
              className="ml-4 bg-accent-gold text-navy-base font-bold py-2 px-5 rounded-sm transition-all duration-200 hover:opacity-90 hover:shadow-md"
            >
              + Post a Space
            </button>
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
            <Link href="/login" className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50 ${pathname === "/login" ? "bg-gray-100 border-l-2 border-accent-gold" : ""}`}>Login</Link>
            <Link href="/register" className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-base hover:bg-gray-50 ${pathname === "/register" ? "bg-gray-100 border-l-2 border-accent-gold" : ""}`}>Register</Link>
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
