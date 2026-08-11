'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, CheckCircle, Search, AlertTriangle, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { markListingVerified, archiveListing, bulkSendVerificationPing, runStaleListingDetection } from '@/app/actions/listingHealthActions';

interface PosterInfo {
  full_name?: string;
  phone?: string;
}

export interface ListingHealthData {
  id: string;
  title: string;
  category?: string;
  location?: string;
  created_at: string;
  listing_health: 'fresh' | 'stale' | 'expired';
  verification_ping_sent_at?: string | null;
  poster?: PosterInfo | null;
}

export default function ListingHealthDashboard({
  staleListings,
  stats
}: {
  staleListings: ListingHealthData[];
  stats: { fresh: number; stale: number; expired: number; pendingPings: number };
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRunDetection = () => {
    startTransition(async () => {
      await runStaleListingDetection();
      router.refresh();
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(staleListings.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkPing = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await bulkSendVerificationPing(ids);
      setSelectedIds(new Set());
      // Here we could add a toast notification
      alert(`Verification pings queued for ${ids.length} listings!`);
    });
  };

  const handleVerify = async (id: string) => {
    startTransition(async () => {
      await markListingVerified(id);
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      await archiveListing(id);
    });
  };

  return (
    <div className="space-y-6">
      {/* Run Detection */}
      <div className="flex justify-end">
        <button
          onClick={handleRunDetection}
          disabled={isPending}
          className="px-4 py-2 bg-navy-base text-white text-sm font-medium rounded-lg hover:bg-navy-light disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Run Detection
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Fresh Listings</div>
          <div className="text-2xl font-bold text-gray-900">{stats.fresh}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="text-amber-800 text-sm font-medium mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Stale (Needs Verification)
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.stale}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="text-red-800 text-sm font-medium mb-1">Expired / Archived</div>
          <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="text-blue-800 text-sm font-medium mb-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Pings Sent
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.pendingPings}</div>
        </div>
      </div>

      {/* Bulk Actions & Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 w-4 h-4 text-navy-base focus:ring-navy-base"
              checked={selectedIds.size === staleListings.length && staleListings.length > 0}
              onChange={handleSelectAll}
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size} selected
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkPing}
              disabled={selectedIds.size === 0 || isPending}
              className="px-4 py-2 bg-navy-base text-white text-sm font-medium rounded-lg hover:bg-navy-light disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Send Verification Ping
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Poster</th>
                <th className="px-4 py-3">Days Active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staleListings.map(listing => {
                const daysActive = Math.floor((new Date().getTime() - new Date(listing.created_at).getTime()) / (1000 * 3600 * 24));
                const hasPinged = !!listing.verification_ping_sent_at;
                
                return (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 w-4 h-4 text-navy-base focus:ring-navy-base"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => handleSelect(listing.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{listing.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{listing.category} • {listing.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{listing.poster?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{listing.poster?.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${daysActive > 60 ? 'text-red-600' : 'text-amber-600'}`}>
                        {daysActive} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {hasPinged ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Pinged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Stale
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVerify(listing.id)}
                          title="Mark Verified"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(listing.id)}
                          title="Force Archive"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {staleListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                      <p>All listings are fresh! No stale properties detected.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
