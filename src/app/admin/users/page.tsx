import { createClient } from '@/utils/supabase/server';
import UserManagementTable from '@/components/admin/UserManagementTable';
import { Users, UserCheck, UserX, Crown, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export const metadata = {
  title: 'User Management | Admin — Property Hub GH',
};

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  account_status: string | null;
  is_verified: boolean | null;
  membership_tier: string | null;
  created_at: string | null;
  listing_count: number;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Call the SECURITY DEFINER RPC — admin domain guard enforced inside the function
  const { data, error } = await supabase.rpc('admin_get_all_users_with_email');

  const users: AdminUser[] = (data ?? []).map((u: AdminUser) => ({
    ...u,
    listing_count: Number(u.listing_count ?? 0),
  }));

  // KPI counts
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.account_status !== 'suspended').length;
  const suspendedUsers = users.filter((u) => u.account_status === 'suspended').length;
  const verifiedUsers = users.filter((u) => u.is_verified).length;
  const proUsers = users.filter(
    (u) => u.membership_tier === 'pro' || u.membership_tier === 'developer'
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a] tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage accounts, verification badges, and membership tiers across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          color="navy"
        />
        <StatCard
          label="Active Accounts"
          value={activeUsers}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          label="Suspended"
          value={suspendedUsers}
          icon={UserX}
          color="red"
        />
        <StatCard
          label="Verified Agents"
          value={verifiedUsers}
          icon={Crown}
          color="gold"
        />
      </div>

      {/* ── Error state ───────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          <strong>Failed to load users:</strong> {error.message}
        </div>
      )}

      {/* ── User table ────────────────────────────────────────────────── */}
      {!error && (
        <Suspense fallback={
          <div className="bg-white rounded-xl border border-slate-200 p-10 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        }>
          <UserManagementTable users={users} proUsersCount={proUsers} />
        </Suspense>
      )}
    </div>
  );
}

// ── Stat card sub-component ───────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'navy' | 'emerald' | 'red' | 'gold';
}) {
  const colorMap = {
    navy: 'bg-[#0d1b2a]/10 text-[#0d1b2a]',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-600',
    gold: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-[#0d1b2a]">{value}</p>
      </div>
    </div>
  );
}
