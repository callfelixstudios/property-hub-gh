import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { Heart } from "lucide-react";

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

  // Use the inner join to fetch only saved listings and their corresponding public.listings data
  const { data: savedRecords, error } = await supabase
    .from("saved_listings")
    .select(`
      id,
      listing_id,
      listings!inner (
        id,
        title,
        base_rent,
        outright_price,
        currency,
        rent_advance_months,
        transaction_type,
        category,
        neighborhood,
        region,
        bedrooms,
        bathrooms,
        image_url,
        created_at,
        views_count,
        safemove_active
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const hasListings = savedRecords && savedRecords.length > 0;

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-10 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
            <Heart className="w-7 h-7 fill-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Saved Properties</h1>
            <p className="text-slate-500 mt-1">Your personal collection of bookmarked listings</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {!hasListings ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No saved listings yet</h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Start building your collection by clicking the heart icon on any property you like.
            </p>
            <Link href="/rentals" className="bg-navy-base hover:bg-navy-light text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedRecords.map((record: any) => {
              const listing = record.listings;
              if (!listing) return null;
              
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
  );
}
