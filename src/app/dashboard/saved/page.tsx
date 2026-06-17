import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { Heart } from "lucide-react";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

export default async function SavedListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-4 bg-[#f8f9fb]">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-navy-base mb-2">Sign in to view your saved listings</h1>
        <p className="text-slate-500 mb-6 text-center max-w-sm">Keep track of your favorite properties by signing in or creating a free account.</p>
        <Link href="/login" className="bg-navy-base text-white px-8 py-3 rounded-lg font-bold hover:bg-navy-light transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  // Fetch saved listing IDs first to avoid relationship syntax issues
  const { data: savedRecords, error: savedError } = await supabase
    .from("saved_listings")
    .select("id, listing_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (savedError) {
    console.error("Error fetching saved listings:", savedError);
  }

  let finalListings: any[] = [];
  if (savedRecords && savedRecords.length > 0) {
    const listingIds = savedRecords.map(r => r.listing_id);
    
    // Fetch the actual listings
    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .in("id", listingIds);
      
    if (listingsError) {
      console.error("Error fetching listings data:", listingsError);
    }
    
    if (listingsData) {
      // Map them together to preserve the saved_listings 'created_at' sort order
      finalListings = savedRecords.map(record => {
        const listing = listingsData.find(l => l.id === record.listing_id);
        return {
          id: record.id,
          listing
        };
      }).filter(r => r.listing != null);
    }
  }

  const hasListings = finalListings.length > 0;

  return (
    <DashboardTabs activeTabOverride="saved" userId={user.id}>
      <div>

        {/* Header Banner */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 fill-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-base">Saved Properties</h2>
            <p className="text-sm text-slate-500 mt-1">Your personal collection of bookmarked listings</p>
          </div>
        </div>

        <div>
          {!hasListings ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Heart className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-navy-base mb-2">No saved listings yet</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">
                Start building your collection by clicking the heart icon on any property you like.
              </p>
              <Link href="/rentals" className="bg-navy-base hover:bg-navy-light text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
                Explore Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {finalListings.map((record: any) => {
                const listing = record.listing;
                
                const isRent = listing.transaction_type === 'rent';
                const price = isRent ? listing.base_rent : listing.outright_price;
                const suffix = isRent ? '/ month' : '';
                
                // Format category helper
                const formatCategory = (cat: string) => cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                const location = [listing.neighborhood, listing.region].filter(Boolean).join(', ');

                return (
                  <Link href={`/listings/${listing.id}`} key={record.id} className="block">
                    <PropertyCard
                      imageSrc={listing.image_url || "/property-placeholder.jpg"}
                      title={listing.title || `${formatCategory(listing.category)} in ${listing.neighborhood || 'Ghana'}`}
                      rawPrice={price || 0}
                      currency={listing.currency || "GHS"}
                      priceSuffix={suffix}
                      location={location || "Ghana"}
                      beds={listing.bedrooms}
                      baths={listing.bathrooms}
                      category={listing.category}
                      badge={listing.safemove_active ? "safemove" : undefined}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardTabs>
  );
}
