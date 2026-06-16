import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import ListingGallery from "@/components/listings/ListingGallery";
import VerifiedBadge from "@/components/VerifiedBadge";
import ReportModal from "@/components/ReportModal";
import PriceDisplay from "@/components/PriceDisplay";
import WhatsAppButton from "@/components/WhatsAppButton";

interface ListingRow {
  id: string;
  poster_id: string;
  transaction_type: 'rent' | 'sale';
  category: string;
  region?: string;
  neighborhood?: string;
  gps_address?: string;
  base_rent?: number;
  service_charge?: number;
  outright_price?: number;
  legal_status?: string;
  generator_backup?: boolean;
  solar_ready?: boolean;
  safemove_active?: boolean;
  media_urls?: string[];
  status?: string;
  views?: number;
  currency?: string;
  rent_advance_months?: number;
  whatsapp_leads_count?: number;
  advance_period?: string;
  created_at?: string;
  image_url?: string;
  title?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing_status?: string;
  land_size?: string;
  square_meters?: number;
  amenities?: string[];
  land_use?: string;
  parking_capacity?: number;
  poster_role?: 'owner' | 'agent';
  is_verified?: boolean;
}

interface PosterProfile {
  id: string;
  full_name?: string;
  company_name?: string;
  whatsapp_link?: string;
  is_verified_agent?: boolean;
}

function formatCategory(cat: string) {
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const formatRegion = (str: string | undefined) =>
  str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

function formatCurrency(amount?: number) {
  if (!amount && amount !== 0) return '—';
  return `₵${Number(amount).toLocaleString()}`;
}

// ── SVG icon primitives ────────────────────────────────────────────────────────
function IconBed() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12V8a1 1 0 011-1h16a1 1 0 011 1v4M3 12v5m18-5v5M3 17h18M7 11h4M7 8v3" />
    </svg>
  );
}
function IconBath() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h1V4a1 1 0 112 0v1h10V4a1 1 0 112 0v1h1a2 2 0 012 2v3a2 2 0 01-2 2M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5" />
    </svg>
  );
}
function IconFurnish() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM8 21v-2M16 21v-2" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLightning() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !listing) {
    return (
      <div className="w-full min-h-screen bg-surface-primary flex items-center justify-center px-4 pt-32">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-base mb-3">Listing Not Found</h1>
          <p className="text-gray-500 mb-8">The property you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
          <Link href="/rentals" className="inline-block bg-navy-base hover:bg-navy-light text-white font-bold py-3 px-8 rounded-md transition-colors">
            Browse Rentals
          </Link>
        </div>
      </div>
    );
  }

  const row = listing as ListingRow;

  const { data: poster } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, whatsapp_link, is_verified_agent')
    .eq('id', row.poster_id)
    .single();

  const profile = (poster || {}) as PosterProfile;

  // Increment view count (fire-and-forget)
  supabase
    .from('listings')
    .update({ views: (row.views || 0) + 1 })
    .eq('id', id)
    .then(() => {});

  // Build display values
  const displayTitle = `${formatCategory(row.category)} in ${row.neighborhood || formatRegion(row.region) || 'Ghana'}`;
  const displayLocation = [row.neighborhood, formatRegion(row.region)].filter(Boolean).join(', ');
  const allImages = Array.from(new Set([row.image_url, ...(row.media_urls || [])].filter(Boolean) as string[]));
  const isRent = row.transaction_type === 'rent';
  const primaryPrice = isRent ? row.base_rent : row.outright_price;

  // Determine if this is a land/commercial type
  const isLand = ['Plot of Land', 'Farm House'].some(t => row.category.toLowerCase().includes(t.toLowerCase()));
  const isCommercial = row.category.toLowerCase().includes('commercial');

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb]">

      {/* ── Breadcrumb Hero ─────────────────────────────────────────────── */}
      <div className="bg-navy-base pt-28 pb-8 px-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={isRent ? '/rentals' : '/sales'} className="hover:text-white transition-colors">
              {isRent ? 'Rentals' : 'Sales'}
            </Link>
            <span>/</span>
            <span className="text-white/90 truncate max-w-xs">{displayTitle}</span>
          </div>
        </div>
      </div>

      {/* ── Image Gallery ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ListingGallery allImages={allImages} displayTitle={displayTitle} />
      </div>

      {/* ── Two-Column Content Grid ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ──────────────────── LEFT COLUMN (2/3) ──────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Title & Location Ribbon */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wide ${isRent ? 'bg-navy-base/10 text-navy-base' : 'bg-accent-gold/10 text-accent-gold'}`}>
                  For {isRent ? 'Rent' : 'Sale'}
                </span>
                {row.safemove_active && (
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1 tracking-wide">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
                    </svg>
                    SafeMove
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-tight flex items-center gap-3 flex-wrap">
                {displayTitle}
                {row.is_verified && <VerifiedBadge />}
              </h1>
              {/* Location Ribbon with pin icon */}
              <div className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
                <IconPin />
                <span className="text-sm font-medium">{displayLocation || 'Ghana'}</span>
              </div>
            </div>

            {/* ── Property Quick Specs Grid ────────────────────────────── */}
            {!isLand && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Property Specs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                  {/* Bedrooms */}
                  {row.bedrooms != null && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5">
                      <span className="text-navy-base"><IconBed /></span>
                      <span className="text-lg font-extrabold text-slate-900">{row.bedrooms}</span>
                      <span className="text-xs text-slate-500 font-medium">Bedroom{row.bedrooms !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Bathrooms */}
                  {row.bathrooms != null && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5">
                      <span className="text-navy-base"><IconBath /></span>
                      <span className="text-lg font-extrabold text-slate-900">{row.bathrooms}</span>
                      <span className="text-xs text-slate-500 font-medium">Bathroom{row.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Furnishing */}
                  {!isCommercial && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5">
                      <span className="text-navy-base"><IconFurnish /></span>
                      <span className="text-sm font-extrabold text-slate-900 leading-snug">
                        {row.furnishing_status || 'Unfurnished'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Furnishing</span>
                    </div>
                  )}

                  {/* Advance Period (rent only) */}
                  {isRent && row.advance_period && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5">
                      <span className="text-navy-base"><IconClock /></span>
                      <span className="text-sm font-extrabold text-slate-900 leading-snug">{row.advance_period}</span>
                      <span className="text-xs text-slate-500 font-medium">Advance</span>
                    </div>
                  )}

                  {/* Parking (commercial) */}
                  {isCommercial && row.parking_capacity != null && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center gap-1.5">
                      <span className="text-navy-base">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7v8m4-8v8m4-8a4 4 0 010 8H4a4 4 0 010-8h12z" />
                        </svg>
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">{row.parking_capacity}</span>
                      <span className="text-xs text-slate-500 font-medium">Parking</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Land specs */}
            {isLand && (row.land_size || row.land_use || row.square_meters) && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Land Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {row.land_size && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Land Size</p>
                      <p className="text-sm font-extrabold text-slate-900">{row.land_size}</p>
                    </div>
                  )}
                  {row.square_meters != null && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Square Metres</p>
                      <p className="text-sm font-extrabold text-slate-900">{row.square_meters} m²</p>
                    </div>
                  )}
                  {row.land_use && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Land Use</p>
                      <p className="text-sm font-extrabold text-slate-900">{row.land_use}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {row.description && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Description</h2>
                <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">{row.description}</p>
              </div>
            )}

            {/* Amenities */}
            {row.amenities && row.amenities.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Amenities & Features</h2>
                <div className="flex flex-wrap gap-2">
                  {row.amenities.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-full px-3 py-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Utilities & Extras */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <h2 className="font-bold text-navy-base text-sm">Utilities & Extras</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                  {/* Category */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-9 h-9 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4.5 h-4.5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Type</p>
                      <p className="text-sm font-bold text-navy-base">{formatCategory(row.category)}</p>
                    </div>
                  </div>

                  {/* Power Backup */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${row.generator_backup ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <span className={row.generator_backup ? 'text-emerald-600' : 'text-gray-400'}><IconLightning /></span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Power Backup</p>
                      <p className={`text-sm font-bold ${row.generator_backup ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {row.generator_backup ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                  </div>

                  {/* Solar Ready */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${row.solar_ready ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <span className={row.solar_ready ? 'text-amber-500' : 'text-gray-400'}><IconSun /></span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Solar Ready</p>
                      <p className={`text-sm font-bold ${row.solar_ready ? 'text-amber-500' : 'text-gray-400'}`}>
                        {row.solar_ready ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* GPS Address */}
                  {row.gps_address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg sm:col-span-2">
                      <div className="w-9 h-9 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ghana Post GPS</p>
                        <p className="text-sm font-bold text-navy-base">{row.gps_address}</p>
                      </div>
                    </div>
                  )}

                  {/* Region */}
                  {row.region && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-9 h-9 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Region</p>
                        <p className="text-sm font-bold text-navy-base">{formatRegion(row.region)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────── RIGHT SIDEBAR (1/3) ────────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 space-y-4">

              {/* ── Price Card (TOP of sidebar, prominent) ─────────────── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  {isRent ? 'Monthly Rent' : 'Asking Price'}
                </p>
                <div className="mb-4 text-2xl text-slate-900">
                  <PriceDisplay
                    rawPrice={row.base_rent || row.outright_price || 0}
                    currency={row.currency || 'GHS'}
                    priceSuffix={isRent ? '/ month' : '/ outright'}
                    rentAdvanceMonths={row.rent_advance_months || 1}
                    serviceCharge={row.service_charge || 0}
                    isRental={isRent}
                  />
                </div>

                {/* Cost breakdown */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  {!isRent && row.legal_status && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Legal Status</span>
                      <span className="text-sm font-bold text-slate-800">
                        {row.legal_status.charAt(0).toUpperCase() + row.legal_status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 text-center mt-4">
                  Posted {row.created_at
                    ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'recently'}
                </p>
              </div>

              {/* ── Locked Agent Card / Agent Card Conditional ───────────── */}
              {!user ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <span className="text-xl">🔒</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Want to contact this lister?</h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                      Sign in or create a free account to view the agent&apos;s name, phone number, and message them directly on WhatsApp.
                    </p>
                    <Link href="/login" className="bg-navy-base hover:bg-navy-light text-white font-bold py-2.5 px-6 rounded-lg transition-colors w-full">
                      Sign In to View Contact
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Listed By</h3>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 bg-navy-base rounded-full flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                      {(profile.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {profile.full_name || 'Property Agent'}
                        {row.poster_role === 'owner' && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ml-2">Owner</span>
                        )}
                        {row.poster_role === 'agent' && (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ml-2">Agent</span>
                        )}
                      </p>
                      {profile.company_name && (
                        <p className="text-xs text-slate-500">{profile.company_name}</p>
                      )}
                      {profile.is_verified_agent && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold text-emerald-600">Verified Agent</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Premium CTA Button ────────────────────────────────── */}
                  {profile.whatsapp_link ? (
                    <WhatsAppButton 
                      profileWhatsAppLink={profile.whatsapp_link}
                      listingId={id}
                      displayTitle={displayTitle}
                      rawPrice={primaryPrice || 0}
                      currency={row.currency || 'GHS'}
                      rentAdvanceMonths={row.rent_advance_months || 1}
                      isRental={isRent}
                      serviceCharge={row.service_charge || 0}
                    />
                  ) : (
                    <div className="w-full py-3 bg-slate-100 text-slate-400 font-semibold rounded-xl text-center text-sm">
                      Contact info unavailable
                    </div>
                  )}
                </div>
              )}

              {/* ── SafeMove Trust Badge ─────────────────────────────────── */}
              {row.safemove_active && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-emerald-700">SafeMove Protected</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    This listing is protected by <span className="font-semibold text-navy-base">Property Hub SafeMove</span> — your deposit is held securely until the property is verified, GPS-confirmed, and keys are handed over.
                  </p>
                  <ul className="space-y-2">
                    {['Funds locked until property verification', 'GPS coordinates cross-checked on-site', 'Full refund if listing is fraudulent'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Report Listing ─────────────────────────────────────── */}
              <ReportModal listingId={id} />

            </div>
          </div>
          {/* ─────────────────────────────────────────────────────────── */}
        </div>
      </div>
    </div>
  );
}
