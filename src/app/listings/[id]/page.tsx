import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

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
  advance_period?: string;
  created_at?: string;
  image_url?: string;
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

function formatCurrency(amount?: number) {
  if (!amount && amount !== 0) return '—';
  return `₵${Number(amount).toLocaleString()}`;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch listing by ID
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

  // Fetch poster profile with whatsapp link
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
  const displayTitle = `${formatCategory(row.category)} in ${row.neighborhood || row.region || 'Ghana'}`;
  const displayLocation = [row.neighborhood, row.region].filter(Boolean).join(', ');
  const heroImage = row.image_url || row.media_urls?.[0] || null;
  const galleryImages = row.media_urls?.slice(1, 4) || [];
  const isRent = row.transaction_type === 'rent';
  const primaryPrice = isRent ? row.base_rent : row.outright_price;

  // Build WhatsApp pre-filled message
  const waMessage = encodeURIComponent(
    `Hello, I am interested in your listing on Property Hub GH:\n\n${displayTitle}\nPrice: ${formatCurrency(primaryPrice)}\n\nI would love to know more. Thank you!`
  );
  const whatsappUrl = profile.whatsapp_link
    ? `${profile.whatsapp_link}?text=${waMessage}`
    : null;

  return (
    <div className="w-full min-h-screen bg-surface-primary">
      {/* Hero Section */}
      <div className="bg-navy-base pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={isRent ? '/rentals' : '/sales'} className="hover:text-white transition-colors">
              {isRent ? 'Rentals' : 'Sales'}
            </Link>
            <span>/</span>
            <span className="text-white/90">{displayTitle}</span>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 -mt-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 rounded-xl overflow-hidden">
          {/* Main Image */}
          <div className="lg:col-span-3 relative h-[450px] bg-slate-200 rounded-xl overflow-hidden shadow-sm">
            {heroImage ? (
              <Image src={heroImage} alt={displayTitle} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">No photos available</span>
              </div>
            )}
          </div>
          {/* Side Thumbnails */}
          <div className="hidden lg:flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative flex-1 bg-slate-200 min-h-[100px]">
                {galleryImages[i] ? (
                  <Image src={galleryImages[i]} alt={`Photo ${i + 2}`} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN – 2/3 */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title & Location */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${isRent ? 'bg-navy-base/10 text-navy-base' : 'bg-accent-gold/10 text-accent-gold'}`}>
                  For {isRent ? 'Rent' : 'Sale'}
                </span>
                {row.safemove_active && (
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd"/></svg>
                    SafeMove
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-navy-base mb-2">{displayTitle}</h1>
              <div className="flex items-center gap-1.5 text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-sm">{displayLocation || 'Ghana'}</span>
              </div>
            </div>

            {/* Pricing Transparency Block */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-gray-100">
                <h2 className="font-bold text-navy-base">Pricing Transparency</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Base Price */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                      {isRent ? 'Monthly Rent' : 'Asking Price'}
                    </p>
                    <p className="text-2xl font-extrabold text-navy-base">
                      {formatCurrency(primaryPrice)}
                      {isRent && <span className="text-sm font-normal text-gray-400">/mo</span>}
                    </p>
                  </div>
                  {/* Service Charge (Rent only) */}
                  {isRent && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Service Charge</p>
                      <p className="text-2xl font-extrabold text-navy-base">
                        {row.service_charge ? formatCurrency(row.service_charge) : 'None'}
                      </p>
                    </div>
                  )}
                  {/* Advance Period / Legal Status */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                      {isRent ? 'Advance Period' : 'Legal Status'}
                    </p>
                    <p className="text-2xl font-extrabold text-navy-base">
                      {isRent
                        ? (row.advance_period || '—')
                        : (row.legal_status ? row.legal_status.charAt(0).toUpperCase() + row.legal_status.slice(1) : '—')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Amenities Grid */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-gray-100">
                <h2 className="font-bold text-navy-base">Features & Amenities</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-bold text-navy-base">{formatCategory(row.category)}</p>
                    </div>
                  </div>

                  {/* Power Backup */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${row.generator_backup ? 'bg-accent-emerald/10' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${row.generator_backup ? 'text-accent-emerald' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Power Backup</p>
                      <p className={`text-sm font-bold ${row.generator_backup ? 'text-accent-emerald' : 'text-gray-400'}`}>
                        {row.generator_backup ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                  </div>

                  {/* Solar Ready */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${row.solar_ready ? 'bg-accent-gold/10' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${row.solar_ready ? 'text-accent-gold' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Solar Ready</p>
                      <p className={`text-sm font-bold ${row.solar_ready ? 'text-accent-gold' : 'text-gray-400'}`}>
                        {row.solar_ready ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* GPS Address */}
                  {row.gps_address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg sm:col-span-2">
                      <div className="w-10 h-10 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Ghana Post GPS</p>
                        <p className="text-sm font-bold text-navy-base">{row.gps_address}</p>
                      </div>
                    </div>
                  )}

                  {/* Region */}
                  {row.region && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-navy-base/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-navy-base" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Region</p>
                        <p className="text-sm font-bold text-navy-base">{row.region}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – Action Sidebar (1/3) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 space-y-5">

              {/* Agent Card */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Listed By</h3>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-navy-base rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(profile.full_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-navy-base">{profile.full_name || 'Property Agent'}</p>
                    {profile.company_name && (
                      <p className="text-xs text-gray-500">{profile.company_name}</p>
                    )}
                    {profile.is_verified_agent && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        <span className="text-xs font-semibold text-accent-emerald">Verified Agent</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp CTA */}
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Message on WhatsApp
                  </a>
                ) : (
                  <div className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-lg text-center text-sm">
                    Contact info unavailable
                  </div>
                )}
              </div>

              {/* SafeMove Trust Section */}
              {row.safemove_active && (
                <div className="bg-accent-emerald/5 border border-accent-emerald/20 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd"/></svg>
                    <h3 className="font-bold text-accent-emerald">SafeMove Protected</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    This listing is protected by <span className="font-semibold text-navy-base">Property Hub SafeMove</span> — our secure escrow system. Your deposit is held safely until the property is verified, GPS-confirmed, and keys are handed over.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Funds locked until property verification
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      GPS coordinates cross-checked on-site
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Full refund if listing is fraudulent
                    </li>
                  </ul>
                </div>
              )}

              {/* Price Summary Card */}
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Cost Summary</h3>
                <div className="space-y-4">
                  <div className="flex flex-col mb-2">
                    <span className="text-sm font-semibold text-gray-500 mb-1">
                      {isRent ? 'Monthly Rent' : 'Outright Purchase Price'}
                    </span>
                    <div className="flex items-baseline gap-1 text-teal-700">
                      <span className="text-3xl font-extrabold">{formatCurrency(primaryPrice)}</span>
                      {isRent && <span className="text-sm font-bold opacity-80">/month</span>}
                    </div>
                  </div>
                  {isRent && row.service_charge && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Service Charge</span>
                      <span className="font-bold text-navy-base">{formatCurrency(row.service_charge)}</span>
                    </div>
                  )}
                  {isRent && row.advance_period && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Advance Period</span>
                      <span className="font-bold text-navy-base">{row.advance_period}</span>
                    </div>
                  )}
                  {!isRent && row.legal_status && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Legal Status</span>
                      <span className="font-bold text-navy-base">{row.legal_status.charAt(0).toUpperCase() + row.legal_status.slice(1)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-xs text-gray-400 text-center">
                      Posted {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
