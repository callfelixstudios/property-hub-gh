import { createClient } from '@/utils/supabase/server';
import { Building2, FileCheck, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';
import SeekerNoticeMonitor from '@/components/admin/SeekerNoticeMonitor';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch KPI counts
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: pendingListingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'pending');

  const { count: requestsCount } = await supabase
    .from('space_requests')
    .select('*', { count: 'exact', head: true });

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('listings')
    .select('id, title, moderation_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: requests } = await supabase
    .from('space_requests')
    .select('id, seeker_name, whatsapp_number, location, property_type, budget, purpose, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Manage platform listings and user demands.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Listings</p>
            <p className="text-2xl font-bold text-gray-900">{listingsCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between relative overflow-hidden">
          {pendingListingsCount && pendingListingsCount > 0 ? (
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 animate-pulse"></div>
          ) : null}
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Moderation</p>
            <p className="text-2xl font-bold text-gray-900">{pendingListingsCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Space Requests</p>
            <p className="text-2xl font-bold text-gray-900">{requestsCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{usersCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/listings" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-emerald-500 transition-colors flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">Moderation Queue</h3>
              <p className="text-sm text-gray-500 mt-1">Review new listings before they go public</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-600 transition-colors">
              &rarr;
            </div>
          </Link>
          <Link href="/admin/users" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-500 transition-colors flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">User Management</h3>
              <p className="text-sm text-gray-500 mt-1">Manage accounts, tiers, and verification</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 transition-colors">
              &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* Legacy / Lower Priority Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <SeekerNoticeMonitor initialRequests={requests || []} />
        </div>
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Recent Listing Submissions</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivity?.map(activity => (
                <div key={activity.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{activity.title || 'Untitled Property'}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wider ${
                      activity.moderation_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      activity.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      activity.moderation_status === 'flagged' ? 'bg-orange-100 text-orange-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {activity.moderation_status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                 <div className="p-8 text-center text-gray-500 text-sm">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
