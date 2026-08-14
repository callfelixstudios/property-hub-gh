import { createClient } from '@/utils/supabase/server';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Archive, Ban } from 'lucide-react';
import ListingModerationQueue from '@/components/admin/ListingModerationQueue';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/utils/adminAuth';

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  // Validate admin identity (guard is handled in layout, but extra sanity check doesn't hurt)
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user)) redirect('/unauthorized');

  const { tab } = await searchParams;
  const currentTab = tab || 'pending';

  // 1. Fetch KPI Counts
  const { count: pendingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'pending')
    .neq('status', 'archived');

  const { count: approvedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'approved')
    .neq('status', 'archived');

  const { count: rejectedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'rejected')
    .neq('status', 'archived');

  const { count: flaggedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'flagged')
    .neq('status', 'archived');

  const { count: suspendedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'suspended')
    .neq('status', 'archived');

  const { count: archivedCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived');

  // 2. Build Query based on tab
  let query = supabase
    .from('listings')
    .select(`
      *,
      poster:profiles!poster_id(full_name, contact_phone)
    `)
    .order('created_at', { ascending: false });

  if (currentTab === 'archived') {
    query = query.eq('status', 'archived');
  } else if (currentTab !== 'all') {
    query = query
      .eq('moderation_status', currentTab)
      .neq('status', 'archived');
  }

  const { data: listings } = await query;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Listing Moderation Queue
          {pendingCount && pendingCount > 0 ? (
            <span className="relative flex h-3 w-3 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          ) : null}
        </h1>
        <p className="text-gray-500 mt-1">Review, approve, or reject new properties before they go live.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-gray-900">{pendingCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</p>
            <p className="text-xl font-bold text-gray-900">{approvedCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-bold text-gray-900">{rejectedCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged</p>
            <p className="text-xl font-bold text-gray-900">{flaggedCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-bold text-gray-900">{suspendedCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Archived</p>
            <p className="text-xl font-bold text-gray-900">{archivedCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Queue Component */}
      <ListingModerationQueue key={currentTab} initialListings={listings || []} currentTab={currentTab} />
    </div>
  );
}
