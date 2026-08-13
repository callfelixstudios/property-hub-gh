import type { Metadata } from 'next';
import SearchWidget from "@/components/SearchWidget";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Property Hub GH | Rent & Buy Properties in Ghana',
  description: 'Find your next space in Ghana. Search verified rentals, student hostels, apartments, houses for sale, and litigation-free plots of land.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com',
  },
  openGraph: {
    title: 'Property Hub GH | Rent & Buy Properties in Ghana',
    description: 'Find your next space in Ghana. Search verified rentals, student hostels, apartments, houses for sale, and litigation-free plots of land.',
    url: 'https://www.propertyhubgh.com',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

const featuredListings = [
  {
    imageSrc: "/property-1.png",
    title: "The Apex Residency",
    rawPrice: 2500,
    currency: "USD",
    priceSuffix: "/mo",
    location: "East Legon, Accra",
    beds: 3,
    baths: 2,
    area: "120 m²",
    badge: "verified" as const,
  },
  {
    imageSrc: "/property-2.png",
    title: "Vista Heights",
    rawPrice: 1800,
    currency: "USD",
    priceSuffix: "/mo",
    location: "Cantonments, Accra",
    beds: 2,
    baths: 2,
    area: "90 m²",
    badge: "safemove" as const,
  },
  {
    imageSrc: "/property-3.png",
    title: "Eco-Haven Estate",
    rawPrice: 450000,
    currency: "USD",
    priceSuffix: "",
    location: "Trasacco, East Legon",
    beds: 5,
    baths: 4,
    area: "315 m²",
    badge: "verified" as const,
  },
];

export default function Home() {
  return (
    <div className="w-full">
      {/* ─── BLOCK 1: HERO ─── */}
      <section className="relative w-full min-h-[540px] md:min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <Image
          src="/hero-bg.png"
          alt="Modern residential estate in Ghana"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-base/90 via-navy-base/75 to-navy-base/50" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Trust-First Real Estate
              <br />
              in Modern Ghana.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-xl">
              Every space you see is verified. Own your property journey with
              verified listings, transparent terms and zero agent duplication.
            </p>

            {/* Search Widget */}
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* ─── BLOCK 2: FEATURED VERIFIED LISTINGS ─── */}
      <section className="w-full bg-white py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-navy-base mb-2">
                Featured Verified Listings
              </h2>
              <p className="text-gray-500">
                Properties that meet our highest standard of safety and transparency.
              </p>
            </div>
            <Link
              href="/rentals"
              className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-navy-base hover:underline"
            >
              View All Properties
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredListings.map((listing, i) => (
              <PropertyCard key={i} {...listing} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK 3: LIST YOUR PROPERTY (CTA SPLIT) ─── */}
      <section className="w-full bg-surface-primary py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-2">
            For Landlords &amp; Estate Owners
          </p>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left Copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-base leading-tight mb-6">
                List Your Property on Ghana&apos;s Most Trusted Network.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Join the top echelon of verified property owners. Our
                platform rewards transparency, smart marketplace dynamics,
                and fraud-proof accountability with trust.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="text-navy-base font-medium">Real Verification — Documents cross-referenced offline.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="text-navy-base font-medium">Full Instant Lead Access — No middleman billing per enquiry.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="text-navy-base font-medium">Active search visibility and premium badge upgrades.</span>
                </li>
              </ul>

              <Link
                href="/post-space"
                className="inline-flex items-center px-8 py-3.5 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors"
              >
                List Your Property Now
              </Link>
            </div>

            {/* Right: Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100">
                <div className="w-10 h-10 rounded-sm bg-navy-base flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h3 className="font-bold text-navy-base mb-1">Safe Payments</h3>
                <p className="text-sm text-gray-500">Every money exchange is independently tracked, verified and escrowed.</p>
              </div>
              <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100">
                <div className="w-10 h-10 rounded-sm bg-accent-gold flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-navy-base" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="font-bold text-navy-base mb-1">Verified Profiles</h3>
                <p className="text-sm text-gray-500">Ensure the agent or developer is properly digitally verified and validated.</p>
              </div>
              <div className="col-span-1 sm:col-span-2 bg-white rounded-md p-6 shadow-ambient border border-gray-100">
                <div className="w-10 h-10 rounded-sm bg-accent-emerald flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                </div>
                <h3 className="font-bold text-navy-base mb-1">Manage All Properties in One Dashboard</h3>
                <p className="text-sm text-gray-500">Manage all your active listings, enquiries and analytics from a single dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOCK 4: EXPLORE NEIGHBORHOODS ─── */}
      <section className="w-full bg-white py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-navy-base text-center mb-12">
            Explore Verified Neighbourhoods
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "East Legon", img: "/neighborhood-eastlegon.png", count: "124 listings" },
              { name: "Cantonments", img: "/neighborhood-cantonments.png", count: "87 listings" },
              { name: "Labone", img: "/neighborhood-labone.png", count: "63 listings" },
            ].map((n) => (
              <Link
                key={n.name}
                href={`/rentals?neighborhood=${encodeURIComponent(n.name)}`}
                className="group relative h-64 md:h-72 rounded-md overflow-hidden"
              >
                <Image
                  src={n.img}
                  alt={n.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-base/80 via-navy-base/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{n.name}</h3>
                  <p className="text-sm text-white/70">{n.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK 5: MARKET INSIGHTS ─── */}
      <section className="w-full bg-surface-primary py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-base leading-tight mb-4">
              Market Insights: Transact with Intelligence.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Leading transparency to the Ghana market with data-driven
              reports, trend analysis and real-time market updates.
            </p>

            <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100 mb-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-emerald/20 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </span>
                <div>
                  <p className="font-semibold text-navy-base">e-Portal Marketplace Analytics</p>
                  <p className="text-sm text-gray-500 mt-1">Our market tracker aggregates real-time trends to ensure transparency, enabling smarter transactions and informed decisions.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <div>
                  <p className="font-semibold text-navy-base">Broker-Free Gold Standard</p>
                  <p className="text-sm text-gray-500 mt-1">Our system verifies and validates every listing, offering an un-brokered experience at scale via SafeMove protection.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Price Table */}
          <div className="bg-white rounded-md shadow-ambient border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="font-semibold text-navy-base">Your Rental Trend (GHS)</p>
              <span className="text-xs font-bold bg-accent-emerald/10 text-accent-emerald px-3 py-1 rounded-full">
                +5.7% avg growth
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Top 1-Bed Apartments", range: "₵1,200 – ₵3,500" },
                { label: "2-Bed Apartments, Rent", range: "₵2,000 – ₵6,200" },
                { label: "Serviced Studios (Accra)", range: "₵900 – ₵2,800" },
                { label: "3-Bed Detached Villa, Rent", range: "₵5,500 – ₵15,000" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className="text-sm font-semibold text-navy-base">{row.range}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Link href="/rentals" className="text-sm font-semibold text-navy-base hover:underline flex items-center gap-1">
                View Full Q3 Market Report
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
