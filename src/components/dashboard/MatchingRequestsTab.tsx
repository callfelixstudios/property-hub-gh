"use client";

import { useState, useEffect } from "react";
import { fetchMatchingRequests, markLeadContacted } from "@/app/actions/leads";
import { Loader2, ExternalLink, Phone, CheckCircle2, XCircle } from "lucide-react";

interface RequestData {
  id: string;
  seeker_name: string;
  whatsapp_number: string;
  property_type: string;
  purpose: string;
  location: string;
  budget: number;
  additional_details?: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: {
    request_id: string;
    score: number;
    matching_listing_ids: string[];
  };
  is_read: boolean;
  created_at: string;
  request: RequestData | null;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Strong Match";
  if (score >= 50) return "Partial Match";
  return "Possible Match";
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function MatchingRequestsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactingIds, setContactingIds] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchMatchingRequests();
    setNotifications(data as NotificationItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleMarkContacted = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setContactingIds((prev) => new Set(prev).add(notificationId));

    try {
      await markLeadContacted(notificationId);
    } catch {
      // Revert on failure — reload from server
      loadRequests();
    } finally {
      setContactingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-navy-base">Matching Requests</h2>
          <p className="text-xs text-gray-500 mt-1">
            Seekers whose requirements match your listings — ranked by relevance.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-navy-base/5 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-navy-base/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy-base mb-2">No Matching Requests Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            When a seeker submits a space request that matches your listings, it will appear here ranked by relevance score.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const req = n.request;
            const score = n.metadata?.score ?? 0;
            const listingCount = n.metadata?.matching_listing_ids?.length ?? 0;
            const waNumber = req?.whatsapp_number?.replace(/\D/g, "");
            const waLink = waNumber ? `https://wa.me/${waNumber}` : null;
            const waMessage = req
              ? `Hello ${req.seeker_name}! I saw your request on Property Hub GH for a ${req.property_type} in ${req.location}. I have properties that may interest you. Would you like to discuss?`
              : "";

            return (
              <div
                key={n.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColor(score)}`}
                      >
                        {score}% — {getScoreLabel(score)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(n.created_at)}
                      </span>
                      {listingCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {listingCount} matching listing{listingCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {req ? (
                      <>
                        <h3 className="text-base font-bold text-navy-base mb-1">
                          {req.property_type} in {req.location}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                          <span>
                            <span className="font-medium text-gray-500">Seeker: </span>
                            {req.seeker_name}
                          </span>
                          <span>
                            <span className="font-medium text-gray-500">Purpose: </span>
                            {req.purpose}
                          </span>
                          <span>
                            <span className="font-medium text-gray-500">Budget: </span>
                            ₵{req.budget?.toLocaleString() ?? "—"}
                          </span>
                        </div>
                        {req.additional_details && (
                          <p className="text-sm text-gray-500 bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                            {req.additional_details}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Request details unavailable</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  {waLink && (
                    <a
                      href={`${waLink}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Contact via WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => handleMarkContacted(n.id)}
                    disabled={contactingIds.has(n.id)}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {contactingIds.has(n.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Mark as Contacted
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
