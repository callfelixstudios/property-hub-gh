import Image from "next/image";
import Link from "next/link";
import PriceDisplay from "./PriceDisplay";
import VerifiedBadge from "./VerifiedBadge";
import { generateListingSlug } from "@/utils/slugify";

export interface PropertyCardProps {
  id?: string | number;
  imageSrc?: string;
  title?: string;
  rawPrice?: number;
  currency?: string;
  priceSuffix?: string;
  location?: string;
  beds?: number;
  baths?: number;
  area?: string;
  badge?: "verified" | "new" | "safemove";
  category?: string;
  isVerified?: boolean;
  base_rent?: number;
  outright_price?: number;
  service_charge?: number;
  advance_period?: string;
  rent_advance_months?: number;
  is_rental?: boolean;
  viewing_fee?: number | null;
  agency_commission_percentage?: number | null;
  has_flood_resilience?: boolean;
  has_solar_backup?: boolean;
  has_borehole_system?: boolean;
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

export default function PropertyCard({
  id = "1",
  imageSrc = "/property-1.webp",
  title = "Modern Apartment",
  rawPrice = 4500,
  currency = "GHS",
  priceSuffix = "/mo",
  location = "East Legon, Accra",
  beds = 3,
  baths = 2,
  area = "120 m²",
  badge,
  category = "apartment",
  isVerified = false,
  base_rent,
  outright_price,
  service_charge,
  advance_period,
  rent_advance_months,
  is_rental,
  viewing_fee,
  agency_commission_percentage,
  has_flood_resilience,
  has_solar_backup,
  has_borehole_system,
}: PropertyCardProps) {
  const isRent = is_rental ?? true;
  const currencySymbol = currency === 'USD' ? '$' : 'GH₵';
  return (
    <Link href={`/listings/${generateListingSlug(title, location, id)}`} className="block group cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-ambient hover:shadow-lg transition-shadow duration-300 flex flex-col relative z-0">
      {/* Image Area */}
      <div className="relative">
        <div className="relative w-full pt-[66.66%] rounded-t-2xl overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {badge === "safemove" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
            </svg>
            SafeMove
          </div>
        )}
        {viewing_fee === 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[11px] font-bold rounded-full shadow-sm z-10">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Zero Viewing Fee
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title + Price Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-col gap-1.5 items-start">
            {isVerified && <VerifiedBadge />}
            <h3 className="text-base font-bold text-navy-base leading-tight line-clamp-1">
              {title}
            </h3>
          </div>
          <div className="ml-3 text-navy-base">
            <PriceDisplay rawPrice={rawPrice} currency={currency} priceSuffix={priceSuffix} isRental={true} />
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </div>

        {/* Pricing Details */}
        <div className="mb-3 pt-2 border-t border-slate-50 space-y-1">
          {/* Service Charge */}
          {isRent && (service_charge ?? 0) > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Service Charge</span>
              <span className="font-bold text-slate-700 flex items-center">
                <PriceDisplay rawPrice={service_charge || 0} currency={currency} isInline />
                <span className="text-[10px] font-semibold text-slate-400 ml-0.5">/mo</span>
              </span>
            </div>
          )}

          {/* Required Advance */}
          {isRent && (rent_advance_months ?? 0) > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Required Advance</span>
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <PriceDisplay rawPrice={(base_rent || rawPrice || 0) * (rent_advance_months || 1)} currency={currency} isInline />
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {formatAdvanceDuration(advance_period)}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Amenity Icons */}
        <div className="flex items-center gap-4 mt-auto pt-3 pb-3 border-t border-gray-100 text-slate-500 text-xs">
          {category.toLowerCase() === "plot of land" ? (
            <div className="flex items-center gap-1.5 font-bold text-accent-emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Plot / Acreage
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                  <path d="M23.961 16.171C23.998 16.072 24.011 15.963 23.977 15.853L22 9.428V3.50005C22 2.12206 20.879 1.00006 19.5 1.00006H4.5C3.12098 1.00006 2.00002 2.12206 2.00002 3.50005V9.42804L0.0230156 15.853C-0.0109688 15.962 0.00201563 16.071 0.039 16.171C0.015 16.277 0 16.386 0 16.5V20.5V22.5C0 22.776 0.224016 23 0.500016 23H2.50003C2.77598 23 3 22.776 3 22.5V21H21V22.5C21 22.776 21.224 23 21.5 23H23.5C23.776 23 24 22.776 24 22.5V20.5V16.5C24 16.386 23.985 16.277 23.961 16.171ZM3 3.50005C3 2.67303 3.67298 2.00005 4.5 2.00005H19.5C20.327 2.00005 21 2.67303 21 3.50005V9.00003H19.641L19.175 7.13604C19.007 6.46704 18.408 6.00003 17.719 6.00003H14.5C13.673 6.00003 13 6.67301 13 7.50003V9.00003H11V7.50101C11 6.674 10.327 6.00101 9.49997 6.00101H6.28097C5.59195 6.00101 4.99298 6.46901 4.82498 7.13703L4.359 9.00003H3V3.50005ZM18.614 9.80801C18.518 9.93003 18.374 10 18.219 10H14.5C14.225 10 14 9.776 14 9.5V7.50003C14 7.22403 14.225 7.00001 14.5 7.00001H17.72C17.95 7.00001 18.149 7.15503 18.205 7.37801L18.705 9.37803C18.743 9.52901 18.71 9.68501 18.614 9.80801ZM10.001 7.50003V9.49503C10.001 9.49704 10 9.49803 10 9.50004C10 9.50103 10 9.50206 10 9.50206C9.99905 9.77708 9.77503 10.0001 9.50105 10.0001H5.78203C5.62603 10.0001 5.48302 9.93008 5.38702 9.80806C5.29102 9.68506 5.25802 9.52808 5.29603 9.37808L5.79605 7.37806C5.85206 7.15606 6.05105 7.00006 6.28205 7.00006H9.50105C9.77602 7.00001 10.001 7.22403 10.001 7.50003ZM2.86898 10H4.374C4.42702 10.15 4.49602 10.294 4.59698 10.424C4.88498 10.79 5.316 11 5.781 11H9.50002C10.151 11 10.701 10.58 10.908 10H13.092C13.299 10.581 13.849 11 14.5 11H18.219C18.684 11 19.114 10.79 19.402 10.424C19.503 10.295 19.572 10.15 19.625 10H21.131L22.675 15.018C22.617 15.011 22.56 15 22.5 15H1.5C1.44 15 1.383 15.011 1.326 15.018L2.86898 10ZM2.00002 22H0.999984V21H1.99997V22H2.00002ZM23 22H22V21H23V22ZM23 20H0.999984V16.5C0.999984 16.224 1.22498 16 1.5 16H22.5C22.775 16 23 16.224 23 16.5V20Z"/>
                </svg>
                <span>{beds || 0} Rooms</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                  <path d="M22.5 11H22V3.00002C22 1.897 21.103 1 20 1C18.8969 1 18 1.89695 18 2.99903L17.999 3.50003C17.9985 3.77641 18.2217 4.00052 18.498 4.00103C18.7744 4.00103 18.9985 3.77791 18.999 3.502L19 3.00006C19 2.44881 19.4487 2.00008 20 2.00008C20.5512 2.00008 21 2.44872 21 3.00002V11H1.5C0.672844 11 0 11.6729 0 12.5C0 13.151 0.41925 13.7008 0.999984 13.9079V15.5C0.999984 17.7951 2.19877 19.8115 3.99998 20.9685V23.5C3.99998 23.7764 4.22363 24 4.5 24H5.49998C5.68945 24 5.86228 23.8931 5.94727 23.7236L6.82683 21.9649C7.04822 21.9878 7.2727 22 7.5 22H16.5C16.7273 22 16.9518 21.9878 17.1732 21.9649L18.0527 23.7236C18.1377 23.8931 18.3105 24 18.5 24H19.5C19.7764 24 20 23.7764 20 23.5V20.9684C21.8012 19.8115 23 17.795 23 15.5V13.9079C23.5807 13.7008 24 13.151 24 12.5C24 11.6729 23.3272 11 22.5 11ZM6 12H11V16.9097L6 16.0767V12ZM0.999984 12.5C0.999984 12.2241 1.22414 12 1.5 12H5.00002V13H1.5C1.22414 13 0.999984 12.7759 0.999984 12.5ZM5.19094 23H5.00002V21.4985C5.26013 21.6073 5.53097 21.6938 5.80683 21.7685L5.19094 23ZM19 23H18.8091L18.1932 21.7685C18.469 21.6939 18.7399 21.6073 19 21.4985V23ZM22 15.5C22 18.5327 19.5327 21 16.5 21H7.5C4.46728 21 2.00002 18.5327 2.00002 15.5V14H5.00002V16.5C5.00002 16.7446 5.17678 16.9531 5.418 16.9932L11.418 17.9932C11.4453 17.9976 11.4727 18 11.5 18C11.6177 18 11.7324 17.9585 11.8233 17.8814C11.9356 17.7866 12 17.647 12 17.5V14H22L22 15.5ZM22.5 13H12V12H22.5C22.7759 12 23 12.2241 23 12.5C23 12.7759 22.7759 13 22.5 13Z"/>
                </svg>
                <span>{baths || 0} Baths</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.5 5.7V1.5H5.7V5.7H1.5ZM0 1C0 0.447715 0.447715 0 1 0H6.2C6.75228 0 7.2 0.447715 7.2 1V6.2C7.2 6.75228 6.75228 7.2 6.2 7.2H4.35V16.8H6.2C6.75228 16.8 7.2 17.2477 7.2 17.8V23C7.2 23.5523 6.75228 24 6.2 24H1C0.447715 24 0 23.5523 0 23V17.8C0 17.2477 0.447715 16.8 1 16.8H2.85V7.2H1C0.447715 7.2 0 6.75228 0 6.2V1ZM18.3 1.5H22.5V5.7H18.3V1.5ZM16.8 1C16.8 0.447715 17.2477 0 17.8 0H23C23.5523 0 24 0.447715 24 1V6.2C24 6.75228 23.5523 7.2 23 7.2H21.15V16.8H23C23.5523 16.8 24 17.2477 24 17.8V23C24 23.5523 23.5523 24 23 24H17.8C17.2477 24 16.8 23.5523 16.8 23V21.15H7.2V19.65H16.8V17.8C16.8 17.2477 17.2477 16.8 17.8 16.8H19.65V7.2H17.8C17.2477 7.2 16.8 6.75228 16.8 6.2V4.35L7.2 4.35V2.85L16.8 2.85V1ZM22.5 18.3H18.3V22.5H22.5V18.3ZM1.5 22.5V18.3H5.7V22.5H1.5Z"/>
                </svg>
                <span className="whitespace-nowrap">{area ? `${area} m²` : '—'}</span>
              </div>
            </>
          )}

          {/* Resiliency Icon Row */}
          {(has_flood_resilience || has_solar_backup || has_borehole_system) && (
            <div className="flex items-center gap-3 mt-1 pt-2 border-t border-gray-100 text-xs">
              {has_flood_resilience && (
                <div className="flex items-center gap-1 font-medium text-blue-600" title="Elevated Foundation / Flood-Resilient Drainage">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Flood-Resilient
                </div>
              )}
              {has_solar_backup && (
                <div className="flex items-center gap-1 font-medium text-amber-600" title="Solar-Grid / Inverter Backup Power">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Solar Backup
                </div>
              )}
              {has_borehole_system && (
                <div className="flex items-center gap-1 font-medium text-cyan-600" title="Borehole + Integrated Water Treatment System">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Borehole
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
