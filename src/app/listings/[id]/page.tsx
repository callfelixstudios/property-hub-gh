import Image from "next/image";
import Link from "next/link";
import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import ListingGallery from "@/components/listings/ListingGallery";
import VerifiedBadge from "@/components/VerifiedBadge";
import ReportModal from "@/components/ReportModal";
import PriceDisplay from "@/components/PriceDisplay";
import WhatsAppButton from "@/components/WhatsAppButton";
import SaveListingButton from "@/components/SaveListingButton";
import UpfrontAdvanceCard from "@/components/UpfrontAdvanceCard";
import MapLoader from "@/components/MapLoader";
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
  views_count: number;
  video_url?: string | null;
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
  listing_category_type?: 'residential' | 'commercial';
  condition?: string;
  parking_space?: string;
  is_verified?: boolean;
  latitude?: number;
  longitude?: number;
}

interface PosterProfile {
  id: string;
  full_name?: string;
  company_name?: string;
  whatsapp_link?: string;
  is_verified_agent?: boolean;
  avatar_url?: string | null;
}

function formatCategory(cat: string) {
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const formatRegion = (str: string | undefined) =>
  str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

const REGION_LABELS: Record<string, string> = {
  greater_accra:  "Greater Accra Region",
  ashanti:        "Ashanti Region",
  central:        "Central Region",
  ahafo:          "Ahafo Region",
  bono:           "Bono Region",
  bono_east:      "Bono East Region",
  eastern:        "Eastern Region",
  north_east:     "North East Region",
  northern:       "Northern Region",
  oti:            "Oti Region",
  savannah:       "Savannah Region",
  upper_east:     "Upper East Region",
  upper_west:     "Upper West Region",
  volta:          "Volta Region",
  western:        "Western Region",
  western_north:  "Western North Region",
};

function formatCurrency(amount?: number) {
  if (!amount && amount !== 0) return '—';
  return `₵${Number(amount).toLocaleString()}`;
}

function formatAdvanceDuration(duration?: string | number | null): string {
  if (!duration) return '';
  const normalized = duration.toString().toLowerCase().trim();
  const numericMatch = normalized.match(/\d+/);
  const totalMonths = numericMatch ? parseInt(numericMatch[0], 10) : null;

  if (normalized.includes('24') || normalized.includes('2 year') || normalized.includes('2 yr') || normalized === '2' || totalMonths === 24) return '/2 yrs';
  if (normalized.includes('12') || normalized.includes('1 year') || normalized.includes('1 yr') || normalized === '1' || normalized === 'one' || totalMonths === 12) return '/1 yr';
  if (normalized.includes('6') || normalized.includes('six') || totalMonths === 6) return '/6 mo';
  if (normalized.includes('3') || normalized.includes('three') || totalMonths === 3) return '/3 mo';
  if (totalMonths !== null) return `/${totalMonths} mo`;

  const cleaned = normalized.replace(/\s*months?|\s*years?|\s*advance|\s*upfront/g, '').trim();
  return cleaned ? `/${cleaned}` : '';
}

// ── SVG icon primitives ────────────────────────────────────────────────────────
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  const id = uuidMatch ? uuidMatch[1] : (slug.split('-').pop() || slug);

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (!listing) {
    return { title: 'Property Not Found | Property Hub GH' };
  }

  const title = `${formatCategory(listing.category || '')} in ${listing.neighborhood || formatRegion(listing.region) || 'Ghana'} | Property Hub GH`;
  const description = `${formatCategory(listing.category || '')} for ${listing.transaction_type === 'rent' ? 'Rent' : 'Sale'} - ₵${(listing.base_rent || listing.outright_price || 0).toLocaleString()}. ${listing.description?.substring(0, 150) || ''}...`;
  const imageUrl = listing.image_url || (listing.media_urls && listing.media_urls[0]);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  const id = uuidMatch ? uuidMatch[1] : (slug.split('-').pop() || slug);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  let initialIsSaved = false;
  if (user) {
    const { data: savedListing } = await supabase
      .from('saved_listings')
      .select('id')
      .match({ user_id: user.id, listing_id: id })
      .maybeSingle();
    
    if (savedListing) {
      initialIsSaved = true;
    }
  }

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
    .select('id, full_name, company_name, whatsapp_link, is_verified_agent, avatar_url')
    .eq('id', row.poster_id)
    .single();

  const profile = (poster || {}) as PosterProfile;

  // Increment view count via atomic RPC (fire-and-forget)
  supabase.rpc("increment_listing_views", { row_id: id }).then(() => {});

  // Build display values
  const displayTitle = `${formatCategory(row.category)} in ${row.neighborhood || formatRegion(row.region) || 'Ghana'}`;
  const displayLocation = [row.neighborhood, row.region ? (REGION_LABELS[row.region] || formatRegion(row.region)) : null].filter(Boolean).join(', ');
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

      {/* ── Two-Column Content Grid (Jiji Style) ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

          {/* ──────────────────── LEFT COLUMN (2/3) ──────────────────── */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* Gallery inside main content column */}
            <ListingGallery allImages={allImages} displayTitle={displayTitle} videoUrl={row.video_url} />

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
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight flex items-center gap-3 flex-wrap">
                  {displayTitle}
                  {row.is_verified && <VerifiedBadge />}
                </h1>
                <div className="flex-shrink-0 mt-1">
                  <SaveListingButton listingId={id} initialIsSaved={initialIsSaved} />
                </div>
              </div>
              {/* Location Ribbon and Views Counter */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
                  <IconPin />
                  <span className="text-sm font-medium">
                    {[row.neighborhood, formatRegion(row.region)].filter(Boolean).join(', ')}{row.gps_address ? ` | Near ${row.gps_address}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 py-1.5 px-3 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {row.views_count} views
                </div>
              </div>
            </div>

            {/* ── Property Quick Specs Grid ────────────────────────────── */}
            {!isLand && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-gray-100 text-slate-700">
                {/* Bedroom */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M23.961 16.171C23.998 16.072 24.011 15.963 23.977 15.853L22 9.428V3.50005C22 2.12206 20.879 1.00006 19.5 1.00006H4.5C3.12098 1.00006 2.00002 2.12206 2.00002 3.50005V9.42804L0.0230156 15.853C-0.0109688 15.962 0.00201563 16.071 0.039 16.171C0.015 16.277 0 16.386 0 16.5V20.5V22.5C0 22.776 0.224016 23 0.500016 23H2.50003C2.77598 23 3 22.776 3 22.5V21H21V22.5C21 22.776 21.224 23 21.5 23H23.5C23.776 23 24 22.776 24 22.5V20.5V16.5C24 16.386 23.985 16.277 23.961 16.171ZM3 3.50005C3 2.67303 3.67298 2.00005 4.5 2.00005H19.5C20.327 2.00005 21 2.67303 21 3.50005V9.00003H19.641L19.175 7.13604C19.007 6.46704 18.408 6.00003 17.719 6.00003H14.5C13.673 6.00003 13 6.67301 13 7.50003V9.00003H11V7.50101C11 6.674 10.327 6.00101 9.49997 6.00101H6.28097C5.59195 6.00101 4.99298 6.46901 4.82498 7.13703L4.359 9.00003H3V3.50005ZM18.614 9.80801C18.518 9.93003 18.374 10 18.219 10H14.5C14.225 10 14 9.776 14 9.5V7.50003C14 7.22403 14.225 7.00001 14.5 7.00001H17.72C17.95 7.00001 18.149 7.15503 18.205 7.37801L18.705 9.37803C18.743 9.52901 18.71 9.68501 18.614 9.80801ZM10.001 7.50003V9.49503C10.001 9.49704 10 9.49803 10 9.50004C10 9.50103 10 9.50206 10 9.50206C9.99905 9.77708 9.77503 10.0001 9.50105 10.0001H5.78203C5.62603 10.0001 5.48302 9.93008 5.38702 9.80806C5.29102 9.68506 5.25802 9.52808 5.29603 9.37808L5.79605 7.37806C5.85206 7.15606 6.05105 7.00006 6.28205 7.00006H9.50105C9.77602 7.00001 10.001 7.22403 10.001 7.50003ZM2.86898 10H4.374C4.42702 10.15 4.49602 10.294 4.59698 10.424C4.88498 10.79 5.316 11 5.781 11H9.50002C10.151 11 10.701 10.58 10.908 10H13.092C13.299 10.581 13.849 11 14.5 11H18.219C18.684 11 19.114 10.79 19.402 10.424C19.503 10.295 19.572 10.15 19.625 10H21.131L22.675 15.018C22.617 15.011 22.56 15 22.5 15H1.5C1.44 15 1.383 15.011 1.326 15.018L2.86898 10ZM2.00002 22H0.999984V21H1.99997V22H2.00002ZM23 22H22V21H23V22ZM23 20H0.999984V16.5C0.999984 16.224 1.22498 16 1.5 16H22.5C22.775 16 23 16.224 23 16.5V20Z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bedroom</p>
                    <p className="text-sm font-semibold text-slate-800">{row.bedrooms || 0} Rooms</p>
                  </div>
                </div>

                {/* Bathroom */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M22.5 11H22V3.00002C22 1.897 21.103 1 20 1C18.8969 1 18 1.89695 18 2.99903L17.999 3.50003C17.9985 3.77641 18.2217 4.00052 18.498 4.00103C18.7744 4.00103 18.9985 3.77791 18.999 3.502L19 3.00006C19 2.44881 19.4487 2.00008 20 2.00008C20.5512 2.00008 21 2.44872 21 3.00002V11H1.5C0.672844 11 0 11.6729 0 12.5C0 13.151 0.41925 13.7008 0.999984 13.9079V15.5C0.999984 17.7951 2.19877 19.8115 3.99998 20.9685V23.5C3.99998 23.7764 4.22363 24 4.5 24H5.49998C5.68945 24 5.86228 23.8931 5.94727 23.7236L6.82683 21.9649C7.04822 21.9878 7.2727 22 7.5 22H16.5C16.7273 22 16.9518 21.9878 17.1732 21.9649L18.0527 23.7236C18.1377 23.8931 18.3105 24 18.5 24H19.5C19.7764 24 20 23.7764 20 23.5V20.9684C21.8012 19.8115 23 17.795 23 15.5V13.9079C23.5807 13.7008 24 13.151 24 12.5C24 11.6729 23.3272 11 22.5 11ZM6 12H11V16.9097L6 16.0767V12ZM0.999984 12.5C0.999984 12.2241 1.22414 12 1.5 12H5.00002V13H1.5C1.22414 13 0.999984 12.7759 0.999984 12.5ZM5.19094 23H5.00002V21.4985C5.26013 21.6073 5.53097 21.6938 5.80683 21.7685L5.19094 23ZM19 23H18.8091L18.1932 21.7685C18.469 21.6939 18.7399 21.6073 19 21.4985V23ZM22 15.5C22 18.5327 19.5327 21 16.5 21H7.5C4.46728 21 2.00002 18.5327 2.00002 15.5V14H5.00002V16.5C5.00002 16.7446 5.17678 16.9531 5.418 16.9932L11.418 17.9932C11.4453 17.9976 11.4727 18 11.5 18C11.6177 18 11.7324 17.9585 11.8233 17.8814C11.9356 17.7866 12 17.647 12 17.5V14H22L22 15.5ZM22.5 13H12V12H22.5C22.7759 12 23 12.2241 23 12.5C23 12.7759 22.7759 13 22.5 13Z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bathroom</p>
                    <p className="text-sm font-semibold text-slate-800">{row.bathrooms || 0} Baths</p>
                  </div>
                </div>

                {/* Property Size */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 5.7V1.5H5.7V5.7H1.5ZM0 1C0 0.447715 0.447715 0 1 0H6.2C6.75228 0 7.2 0.447715 7.2 1V6.2C7.2 6.75228 6.75228 7.2 6.2 7.2H4.35V16.8H6.2C6.75228 16.8 7.2 17.2477 7.2 17.8V23C7.2 23.5523 6.75228 24 6.2 24H1C0.447715 24 0 23.5523 0 23V17.8C0 17.2477 0.447715 16.8 1 16.8H2.85V7.2H1C0.447715 7.2 0 6.75228 0 6.2V1ZM18.3 1.5H22.5V5.7H18.3V1.5ZM16.8 1C16.8 0.447715 17.2477 0 17.8 0H23C23.5523 0 24 0.447715 24 1V6.2C24 6.75228 23.5523 7.2 23 7.2H21.15V16.8H23C23.5523 16.8 24 17.2477 24 17.8V23C24 23.5523 23.5523 24 23 24H17.8C17.2477 24 16.8 23.5523 16.8 23V21.15H7.2V19.65H16.8V17.8C16.8 17.2477 17.2477 16.8 17.8 16.8H19.65V7.2H17.8C17.2477 7.2 16.8 6.75228 16.8 6.2V4.35L7.2 4.35V2.85L16.8 2.85V1ZM22.5 18.3H18.3V22.5H22.5V18.3ZM1.5 22.5V18.3H5.7V22.5H1.5Z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Property Size</p>
                    <p className="text-sm font-semibold text-slate-800">{row.square_meters ? `${row.square_meters} m²` : '—'}</p>
                  </div>
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

                  {/* Region and Landmark removed to top hero */}
                </div>
              </div>
            </div>

            {/* Vicinity Map */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Vicinity Map</h2>
              <MapLoader lat={row.latitude} lng={row.longitude} location={displayLocation} region={row.region} />
            </div>
          </div>

          {/* ──────────────────── RIGHT SIDEBAR (1/3) ────────────────── */}
          <div className="lg:col-span-1 space-y-6 sticky top-24">

              {/* ── Agent Card (TOP of sidebar) ──────────────────────────── */}
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
                    <div className="w-11 h-11 bg-navy-base rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name || 'Agent'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (profile.full_name || 'A').charAt(0).toUpperCase()
                      )}
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

              {/* ── Price Card (underneath agent) ────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    Financial Overview
                  </h3>
                  
                  {/* 1. Base Rent Line */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm font-medium text-slate-500">Rent</span>
                    <span className="text-sm font-extrabold text-navy-base">
                      GH₵{(row.base_rent || 0).toLocaleString()}
                      <span className="text-xs font-semibold text-slate-400 ml-0.5">/mo</span>
                    </span>
                  </div>

                  {/* 2. Service Charge Line - Suffix added conditionally */}
                  {isRent && (row.service_charge ?? 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Service Charge</span>
                      <span className="text-sm font-extrabold text-navy-base">
                        GH₵{(row.service_charge || 0).toLocaleString()}
                        <span className="text-xs font-semibold text-slate-400 ml-0.5">/mo</span>
                      </span>
                    </div>
                  )}

                  {/* 3. Required Advance Line - Multiplied dynamically & styled with Indigo Badge */}
                  {isRent && (row.rent_advance_months ?? 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Required Advance</span>
                      <span className="text-sm font-extrabold text-navy-base flex items-center gap-1.5">
                        GH₵{((row.base_rent || 0) * (row.rent_advance_months || 1)).toLocaleString()}
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded-md">
                          {formatAdvanceDuration(row.advance_period)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* 4. Legal Status (for sale listings) */}
                  {!isRent && row.legal_status && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">Legal Status</span>
                      <span className="text-sm font-bold text-slate-800">
                        {row.legal_status.charAt(0).toUpperCase() + row.legal_status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="px-6 pb-6 pt-4 text-xs text-slate-400 text-center border-t border-slate-100">
                  Posted {row.created_at
                    ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'recently'}
                </div>
              </div>

              {/* ── Verified Trust Banner ────────────────────────────────── */}
              {row.is_verified && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-emerald-800 mb-1">Property Hub Verified</h3>
                      <p className="text-sm text-emerald-700/90 leading-relaxed">
                        This property listing has been vetted and verified by the Property Hub GH team for authenticity.
                      </p>
                    </div>
                  </div>
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
          {/* ─────────────────────────────────────────────────────────── */}
        </div>
      </div>
    </div>
  );
}
