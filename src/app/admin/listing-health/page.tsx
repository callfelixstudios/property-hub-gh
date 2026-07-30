import { createClient } from '@/utils/supabase/server';
import ListingHealthDashboard, { ListingHealthData } from '@/components/admin/ListingHealthDashboard';

export const metadata = {
  title: 'Listing Health | Admin — Property Hub GH',
};

interface StaleListingsRow {
  id: string;
  title: string;
  category: string;
  location: string;
  created_at: string;
  listing_health: string;
  verification_ping_sent_at: string | null;
  poster: { id: string; full_name: string; phone: string }[];
}

export default async function AdminListingHealthPage() {
  const supabase = await createClient();

  // 1. Force trigger the stale listing detection first to ensure stats are up to date
  await supabase.rpc('fn_update_stale_listings');

  // 2. Fetch Stale listings
  const { data: staleListings } = await supabase
    .from('listings')
    .select(`
      id, title, category, location, created_at, listing_health, verification_ping_sent_at,
      poster:poster_id (id, full_name, phone)
    `)
    .eq('listing_health', 'stale')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  // 3. Fetch KPI Stats
  const { count: freshCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('listing_health', 'fresh')
    .eq('status', 'active');

  const { count: expiredCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived');
    
  const { count: pingedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .not('verification_ping_sent_at', 'is', null);

  const stats = {
    fresh: freshCount || 0,
    stale: staleListings?.length || 0,
    expired: expiredCount || 0,
    pendingPings: pingedCount || 0,
  };

  const rawListings = (staleListings || []) as unknown as StaleListingsRow[];
  const mappedStale: ListingHealthData[] = rawListings.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    location: item.location,
    created_at: item.created_at,
    listing_health: item.listing_health as 'fresh' | 'stale' | 'expired',
    verification_ping_sent_at: item.verification_ping_sent_at,
    poster: item.poster?.[0] ? { full_name: item.poster[0].full_name, phone: item.poster[0].phone } : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listing Health & Expiry</h1>
        <p className="text-gray-500 mt-1">Detect and manage ghost listings to ensure platform trust.</p>
      </div>

      <ListingHealthDashboard
        staleListings={mappedStale}
        stats={stats}
      />
    </div>
  );
}
