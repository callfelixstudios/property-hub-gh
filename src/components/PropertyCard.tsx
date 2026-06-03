export default function PropertyCard({ isFeatured = false }: { isFeatured?: boolean }) {
  return (
    <div className="bg-white rounded-md shadow-ambient overflow-hidden flex flex-col group border border-gray-100">
      {/* 3:2 Image Placeholder Container */}
      <div className="relative w-full pt-[66.66%] bg-surface-container-high overflow-hidden">
        {/* Placeholder image background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-500" />
        
        {/* Floating Trust Badge (Top Left) */}
        {isFeatured ? (
          <div className="absolute top-3 left-3 bg-accent-gold text-navy-base px-3 py-1 text-xs font-bold rounded-full shadow-sm">
            ✓ Verified Agent
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-accent-emerald text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
            New
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-sm text-gray-500 font-medium mb-1">East Legon, Accra</div>
        <h3 className="text-lg font-bold text-navy-base leading-tight mb-2 line-clamp-1">
          Modern 3-Bedroom Apartment
        </h3>
        
        {/* Pricing */}
        <div className="mt-auto mb-4">
          <div className="text-xl font-extrabold text-navy-base">
            ₵4,500 <span className="text-sm font-normal text-gray-500">/ Month</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">(1-Year Advance Required)</div>
        </div>

        {/* Action Button */}
        <button className="w-full py-2.5 bg-accent-gold text-navy-base font-bold rounded-sm hover:bg-accent-gold/90 transition-colors shadow-sm">
          Connect via WhatsApp
        </button>
      </div>
    </div>
  );
}
