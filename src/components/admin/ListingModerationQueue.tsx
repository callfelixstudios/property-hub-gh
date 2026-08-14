"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, MapPin, User, ChevronDown, Check, Info, RefreshCw, Ban, Trash2 } from 'lucide-react';
import { approveListing, rejectListing, flagListing, renewListing, suspendListing, unsuspendListing, deleteListing } from '@/app/actions/adminActions';

interface ListingWithPoster {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  listing_category_type: string;
  property_type: string;
  city: string;
  neighborhood: string;
  created_at: string;
  media_urls: string[] | null;
  image_url: string | null;
  status: string;
  moderation_status: string;
  moderated_by: string | null;
  moderated_at: string | null;
  rejection_reason: string | null;
  moderation_note: string | null;
  poster?: {
    full_name: string;
    contact_phone: string;
  };
}

const TABS = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All Listings' },
];

const REJECT_REASONS = [
  "Low-quality or watermarked photos",
  "Price is unrealistically low for this area",
  "Incorrect or unverifiable location",
  "Duplicate listing already exists on platform",
  "Insufficient property description",
  "Suspicious contact details / potential fraud",
];

export default function ListingModerationQueue({
  initialListings,
  currentTab
}: {
  initialListings: ListingWithPoster[]; 
  currentTab: string;
}) {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithPoster[]>(initialListings);
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [showRejectDropdown, setShowRejectDropdown] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [showToast, setShowToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      router.push(`/admin/listings?tab=${tabId}`);
    });
  };

  const optimisticUpdate = (id: string, newStatus: string, actionFn: () => Promise<{ success: boolean }>) => {
    setActiveActionId(id);
    setShowRejectDropdown(null);
    setCustomReason("");
    
    // If not on 'all' tab, remove the card. Otherwise update its status.
    setListings(prev => {
      if (currentTab !== 'all') {
        return prev.filter(l => l.id !== id);
      }
      return prev.map(l => l.id === id ? { ...l, moderation_status: newStatus } : l);
    });

    startTransition(async () => {
      try {
        await actionFn();
        triggerToast(`Listing marked as ${newStatus}`, 'success');
      } catch (err) {
        console.error(err);
        triggerToast("Action failed. Please refresh.", "error");
        // We could revert optimistic state here, but a router.refresh() is safer
        router.refresh();
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const onApprove = (id: string) => {
    optimisticUpdate(id, 'approved', () => approveListing(id));
  };

  const onReject = (id: string, reason: string) => {
    optimisticUpdate(id, 'rejected', () => rejectListing(id, reason));
  };

  const onFlag = (id: string) => {
    optimisticUpdate(id, 'flagged', () => flagListing(id, "Flagged for manual review"));
  };

  const onRenew = (id: string) => {
    setActiveActionId(id);
    setShowRejectDropdown(null);
    setCustomReason("");

    // On the archived tab, remove the card. On 'all', mark it as active again.
    setListings(prev =>
      currentTab !== 'all'
        ? prev.filter(l => l.id !== id)
        : prev.map(l => l.id === id ? { ...l, status: 'active' } : l)
    );

    startTransition(async () => {
      try {
        await renewListing(id);
        const wasDeleted = listings.find(l => l.id === id)?.moderation_status === 'deleted';
        triggerToast(wasDeleted ? 'Listing restored to review queue' : 'Listing renewed and reactivated', 'success');
      } catch (err) {
        console.error(err);
        triggerToast("Renew failed. Please refresh.", "error");
        router.refresh();
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const onSuspend = (id: string) => {
    const reason = window.prompt('Reason for suspension (optional):');
    if (reason === null) return;

    setActiveActionId(id);
    setShowRejectDropdown(null);
    setCustomReason("");

    // On other tabs, remove the card. On 'all', suspend it in place.
    setListings(prev =>
      currentTab !== 'all'
        ? prev.filter(l => l.id !== id)
        : prev.map(l => l.id === id ? { ...l, moderation_status: 'suspended', status: 'pending' } : l)
    );

    startTransition(async () => {
      try {
        await suspendListing(id, reason || undefined);
        triggerToast('Listing suspended', 'success');
      } catch (err) {
        console.error(err);
        triggerToast("Suspend failed. Please refresh.", "error");
        router.refresh();
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const onUnsuspend = (id: string) => {
    setActiveActionId(id);
    setShowRejectDropdown(null);
    setCustomReason("");

    // On other tabs, remove the card. On 'all', return it to review.
    setListings(prev =>
      currentTab !== 'all'
        ? prev.filter(l => l.id !== id)
        : prev.map(l => l.id === id ? { ...l, moderation_status: 'pending' } : l)
    );

    startTransition(async () => {
      try {
        await unsuspendListing(id);
        triggerToast('Listing returned to review', 'success');
      } catch (err) {
        console.error(err);
        triggerToast("Action failed. Please refresh.", "error");
        router.refresh();
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const onDelete = (id: string) => {
    if (!window.confirm('Delete this listing? It will be hidden and can be restored from the Archived tab.')) return;

    setActiveActionId(id);
    setShowRejectDropdown(null);
    setCustomReason("");

    // On other tabs, remove the card. On 'all', soft-delete it in place.
    setListings(prev =>
      currentTab !== 'all'
        ? prev.filter(l => l.id !== id)
        : prev.map(l => l.id === id ? { ...l, status: 'archived', moderation_status: 'deleted' } : l)
    );

    startTransition(async () => {
      try {
        await deleteListing(id);
        triggerToast('Listing deleted (soft delete)', 'success');
      } catch (err) {
        console.error(err);
        triggerToast("Delete failed. Please refresh.", "error");
        router.refresh();
      } finally {
        setActiveActionId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 ${
          showToast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {showToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{showToast.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-max">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              currentTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
          <p className="text-gray-500 mt-1">No listings found in the &quot;{currentTab}&quot; status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const heroImg = (listing.media_urls && listing.media_urls.length > 0) 
              ? listing.media_urls[0] 
              : listing.image_url || '/placeholder-house.jpg';

            const isProcessing = activeActionId === listing.id;

            return (
              <div 
                key={listing.id} 
                className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Image Section */}
                <Link href={`/listings/${listing.id}`} className="relative h-48 w-full bg-gray-100 block group">
                  <Image 
                    src={heroImg} 
                    alt={listing.title || 'Property'} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized={heroImg.startsWith('http')} 
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {listing.listing_category_type || 'Residential'}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {/* Status Badge */}
                  {currentTab === 'all' && listing.moderation_status !== 'deleted' && (
                    <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      listing.moderation_status === 'approved' ? 'bg-emerald-500 text-white' :
                      listing.moderation_status === 'rejected' ? 'bg-red-500 text-white' :
                      listing.moderation_status === 'flagged' ? 'bg-orange-500 text-white' :
                      listing.moderation_status === 'suspended' ? 'bg-violet-500 text-white' :
                      listing.moderation_status === 'deleted' ? 'bg-gray-500 text-white' :
                      'bg-amber-500 text-white'
                    }`}>
                      {listing.moderation_status}
                    </div>
                  )}
                  {listing.moderation_status === 'deleted' && (
                    <div className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-gray-700 text-white">
                      Deleted by admin
                    </div>
                  )}
                </Link>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <Link href={`/listings/${listing.id}`} className="hover:text-emerald-600 transition-colors">
                    <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-2 leading-snug">
                      {listing.title || 'Untitled Property'}
                    </h3>
                  </Link>
                  
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center text-sm text-gray-500 gap-1.5">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{listing.neighborhood}, {listing.city}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-1.5">
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center font-bold text-gray-400">₵</div>
                      <span className="font-semibold text-gray-900">{listing.currency} {listing.price?.toLocaleString()}</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="capitalize">{listing.category?.replace('_', ' ') || listing.property_type || 'Property'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-1.5 pt-2 border-t border-gray-100">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <Link 
                        href={`/admin/users?search=${encodeURIComponent(listing.poster?.full_name || '')}`}
                        className="truncate hover:underline text-emerald-600 font-medium"
                      >
                        {listing.poster?.full_name || 'Unknown User'} 
                        {listing.poster?.contact_phone && ` (${listing.poster.contact_phone})`}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-400 pl-5.5">
                      Submitted {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Audit Info (for processed items) */}
                  {(listing.moderation_status === 'approved' || listing.moderation_status === 'rejected' || listing.moderation_status === 'flagged' || listing.moderation_status === 'suspended' || listing.moderation_status === 'deleted') && currentTab !== 'pending' && (
                    <div className="mt-2 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                        <Info className="w-3.5 h-3.5" />
                        <span className="font-medium">Moderated by {listing.moderated_by}</span>
                      </div>
                      {listing.rejection_reason && (
                        <div className="text-red-600 font-medium ml-5">
                          Reason: {listing.rejection_reason}
                        </div>
                      )}
                      {listing.moderation_note && (
                        <div className={`font-medium ml-5 ${listing.moderation_status === 'suspended' ? 'text-violet-600' : 'text-red-600'}`}>
                          Reason: {listing.moderation_note}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Section */}
                  {listing.moderation_status === 'suspended' ? (
                    <div className="grid grid-cols-2 gap-2 mt-auto relative">
                      <button
                        onClick={() => onUnsuspend(listing.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Unsuspend
                      </button>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2 rounded-lg transition-colors"
                      >
                        <Info className="w-4 h-4" /> View Details
                      </Link>
                      <button
                        onClick={() => onDelete(listing.id)}
                        disabled={isProcessing}
                        className="col-span-2 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                      </button>
                    </div>
                  ) : listing.status === 'archived' ? (
                    <div className="grid grid-cols-2 gap-2 mt-auto relative">
                      <button
                        onClick={() => onRenew(listing.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Renew
                      </button>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2 rounded-lg transition-colors"
                      >
                        <Info className="w-4 h-4" /> View Details
                      </Link>
                    </div>
                  ) : listing.moderation_status === 'approved' ? (
                    <div className="grid grid-cols-2 gap-2 mt-auto relative">
                      <button
                        onClick={() => onSuspend(listing.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Suspend
                      </button>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2 rounded-lg transition-colors"
                      >
                        <Info className="w-4 h-4" /> View Details
                      </Link>
                      <button
                        onClick={() => onDelete(listing.id)}
                        disabled={isProcessing}
                        className="col-span-2 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                      </button>
                    </div>
                  ) : (listing.moderation_status === 'pending' || listing.moderation_status === 'flagged') ? (
                    <div className="grid grid-cols-2 gap-2 mt-auto relative">
                      <button
                        onClick={() => onApprove(listing.id)}
                        className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium py-2 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowRejectDropdown(showRejectDropdown === listing.id ? null : listing.id)}
                          className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium py-2 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>

                        {/* Reject Dropdown */}
                        {showRejectDropdown === listing.id && (
                          <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-10 overflow-hidden p-1 slide-in-from-bottom-2 animate-in">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Quick Reject</div>
                            {REJECT_REASONS.map(reason => (
                              <button
                                key={reason}
                                onClick={() => onReject(listing.id, reason)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                              >
                                {reason}
                              </button>
                            ))}
                            <div className="px-3 py-2 border-t border-gray-100 mt-1">
                              <input 
                                type="text"
                                placeholder="Custom reason..."
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-2"
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                              />
                              <button
                                onClick={() => onReject(listing.id, customReason || "Admin rejected without specific reason")}
                                className="w-full bg-red-600 text-white text-xs font-medium py-1.5 rounded-md hover:bg-red-700 transition-colors"
                              >
                                Submit Custom Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Optional Flag action */}
                      <button
                        onClick={() => onFlag(listing.id)}
                        className="col-span-2 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-1.5 rounded-lg transition-colors text-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Flag for review
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
