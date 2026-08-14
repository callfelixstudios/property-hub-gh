'use client';

import { useState, useTransition, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
  Search,
  Loader2,
  Building2,
} from 'lucide-react';
import {
  toggleUserVerification,
  setAccountStatus,
  setMembershipTier,
} from '@/app/actions/adminActions';
import UserDetailDrawer from '@/components/admin/UserDetailDrawer';
import type { AdminUser } from '@/app/admin/users/page';

interface Props {
  users: AdminUser[];
  proUsersCount: number;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted';
type TierFilter = 'all' | 'free' | 'pro' | 'developer';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  developer: 'Developer',
};

const TIER_STYLES: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-100 text-blue-700',
  developer: 'bg-purple-100 text-purple-700',
};

export default function UserManagementTable({ users: initialUsers }: Props) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Derived filtered list ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'deleted'
          ? u.account_status === 'deleted'
          : statusFilter === 'suspended'
            ? u.account_status === 'suspended'
            : u.account_status !== 'suspended' && u.account_status !== 'deleted');
      const matchesTier = tierFilter === 'all' || u.membership_tier === tierFilter;
      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [users, searchQuery, statusFilter, tierFilter]);

  // ── Toast helper ─────────────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Action handlers ──────────────────────────────────────────────────
  const handleToggleVerification = (userId: string, current: boolean) => {
    setPendingId(userId);
    setPendingAction('verify');
    startTransition(async () => {
      try {
        await toggleUserVerification(userId, current);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_verified: !current } : u))
        );
        showToast(current ? 'Verification removed.' : 'User verified successfully.');
      } catch {
        showToast('Failed to update verification.', 'error');
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  };

  const handleToggleStatus = (userId: string, current: string | null) => {
    const newStatus: 'active' | 'suspended' =
      current === 'suspended' ? 'active' : 'suspended';
    setPendingId(userId);
    setPendingAction('status');
    startTransition(async () => {
      try {
        await setAccountStatus(userId, newStatus);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, account_status: newStatus } : u))
        );
        showToast(
          newStatus === 'suspended'
            ? 'Account suspended.'
            : 'Account reactivated.'
        );
      } catch {
        showToast('Failed to update account status.', 'error');
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  };

  const handleTierChange = (userId: string, tier: 'free' | 'pro' | 'developer') => {
    setPendingId(userId);
    setPendingAction('tier');
    startTransition(async () => {
      try {
        await setMembershipTier(userId, tier);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, membership_tier: tier } : u))
        );
        showToast(`Tier updated to ${TIER_LABELS[tier]}.`);
      } catch {
        showToast('Failed to update tier.', 'error');
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  };

  const isLoading = (userId: string, action: string) =>
    pendingId === userId && pendingAction === action;

  return (
    <div className="space-y-4">
      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#0d1b2a] text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d1b2a] focus:ring-1 focus:ring-[#0d1b2a]/10 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-[#0d1b2a] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Tier filter */}
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
              className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-[#0d1b2a] cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="developer">Developer</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          <span className="text-xs text-slate-400 ml-1">
            {filtered.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Listings
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Tier
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Verified
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400 text-sm">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                      user.account_status === 'suspended' || user.account_status === 'deleted'
                        ? 'opacity-60'
                        : ''
                    }`}
                  >
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0d1b2a] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                          {(user.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#0d1b2a] leading-tight">
                            {user.full_name || '—'}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">
                            {user.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-slate-600 text-xs">
                      {user.phone || <span className="text-slate-300">No phone</span>}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-GH', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Listing count */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {user.listing_count}
                      </div>
                    </td>

                    {/* Tier dropdown */}
                    <td className="px-5 py-4 text-center">
                      {isLoading(user.id, 'tier') ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={user.membership_tier ?? 'free'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleTierChange(user.id, e.target.value as 'free' | 'pro' | 'developer');
                            }}
                            className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 ${
                              TIER_STYLES[user.membership_tier ?? 'free'] ?? TIER_STYLES.free
                            }`}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="developer">Developer</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                        </div>
                      )}
                    </td>

                    {/* Verified toggle */}
                    <td className="px-5 py-4 text-center">
                      {isLoading(user.id, 'verify') ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVerification(user.id, user.is_verified ?? false);
                          }}
                          title={user.is_verified ? 'Remove verification' : 'Verify user'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.is_verified
                              ? 'bg-[#eab308]/15 text-yellow-700 hover:bg-[#eab308]/25'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {user.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                      )}
                    </td>

                    {/* Account status */}
                    <td className="px-5 py-4 text-center">
                      {isLoading(user.id, 'status') ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                      ) : user.account_status === 'deleted' ? (
                        <span
                          title="Deleted accounts are restored from the user detail drawer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          Deleted
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user.id, user.account_status);
                          }}
                          title={
                            user.account_status === 'suspended'
                              ? 'Reactivate account'
                              : 'Suspend account'
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.account_status === 'suspended'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {user.account_status === 'suspended' ? (
                            <ShieldOff className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {user.account_status === 'suspended' ? 'Suspended' : 'Active'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailDrawer
        userId={selectedUserId}
        open={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
