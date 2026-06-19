import { createClient } from '@/utils/supabase/server';
import { Building2, Users } from 'lucide-react';
import VerificationCommandDesk from '@/components/admin/VerificationCommandDesk';
import SeekerNoticeMonitor from '@/components/admin/SeekerNoticeMonitor';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch metrics: Total Listings and Total Space Requests
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  const { count: requestsCount } = await supabase
    .from('space_requests')
    .select('*', { count: 'exact', head: true });

  // Fetch initial data for the command desks
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, category, is_verified, city, neighborhood, created_at')
    .order('created_at', { ascending: false });

  const { data: requests } = await supabase
    .from('space_requests')
    .select('id, seeker_name, whatsapp_number, location, property_type, budget, purpose, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Manage platform listings and user demands.</p>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Listings</p>
            <p className="text-2xl font-bold text-gray-900">{listingsCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Space Requests</p>
            <p className="text-2xl font-bold text-gray-900">{requestsCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Control Desks */}
      <VerificationCommandDesk initialListings={listings || []} />
      <SeekerNoticeMonitor initialRequests={requests || []} />
    </div>
  );
}
