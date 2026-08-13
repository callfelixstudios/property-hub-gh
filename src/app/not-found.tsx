import Link from "next/link";
import type { Metadata } from 'next';
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: 'Page Not Found | Property Hub GH',
};

export default function NotFound() {
  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] flex flex-col">
      <div className="bg-navy-base pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto"></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full bg-white rounded-lg border border-[#e2e8f0] px-8 py-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-5xl font-bold text-navy-base mb-2">404</p>
          <h1 className="text-2xl font-bold text-navy-base mb-3">Page Not Found</h1>
          <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
          <Link
            href="/rentals"
            className="inline-block bg-navy-base hover:bg-navy-light text-white font-bold py-3 px-8 rounded-md transition-colors"
          >
            Browse Rentals
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}