import Image from "next/image";

interface PropertyCardProps {
  imageSrc?: string;
  title?: string;
  price?: string;
  priceSuffix?: string;
  location?: string;
  beds?: number;
  baths?: number;
  area?: string;
  badge?: "verified" | "new" | "safemove";
  category?: string;
}

export default function PropertyCard({
  imageSrc = "/property-1.png",
  title = "Modern Apartment",
  price = "₵4,500",
  priceSuffix = "/mo",
  location = "East Legon, Accra",
  beds = 3,
  baths = 2,
  area = "1,200 sqft",
  badge,
  category = "apartment",
}: PropertyCardProps) {
  return (
    <div className="bg-white rounded-md overflow-hidden border border-gray-100 shadow-ambient hover:shadow-lg transition-shadow duration-300 group flex flex-col">
      {/* Image */}
      <div className="relative w-full pt-[66.66%] overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badge */}
        {badge === "verified" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-navy-base text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </div>
        )}
        {badge === "new" && (
          <div className="absolute top-3 left-3 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
            New
          </div>
        )}
        {badge === "safemove" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM14.5 8.5a.75.75 0 00-1.06-1.06l-3.94 3.94-1.44-1.44a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.44-4.44z" clipRule="evenodd" />
            </svg>
            SafeMove
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title + Price Row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-navy-base leading-tight line-clamp-1">
            {title}
          </h3>
          <div className="text-base font-extrabold text-navy-base whitespace-nowrap ml-3">
            {price}
            <span className="text-xs font-normal text-gray-400">{priceSuffix}</span>
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

        {/* Amenity Icons */}
        <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-50">
          {["plot of land", "commercial property / office", "farm house"].includes(category.toLowerCase()) ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent-emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Plot / Acreage
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {beds} Beds
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {baths} Baths
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {area}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
