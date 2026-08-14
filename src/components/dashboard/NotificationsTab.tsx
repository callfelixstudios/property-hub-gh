"use client";

import { useState, useEffect, type ReactNode } from "react";
import { fetchListingNotifications, markNotificationRead } from "@/app/actions/leads";
import { Bell, Loader2, CheckCircle2, ExternalLink, AlertTriangle, Trash2, RefreshCw } from "lucide-react";

interface ListingNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: {
    listing_id?: string;
    listing_title?: string;
    reason?: string;
  } | null;
  is_read: boolean;
  created_at: string;
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

function getNotificationStyle(type: string): { icon: ReactNode; iconCls: string; badgeCls: string } {
  switch (type) {
    case 'listing_deleted':
      return {
        icon: <Trash2 className="w-5 h-5" />,
        iconCls: "bg-red-100 text-red-600",
        badgeCls: "bg-red-100 text-red-700 border-red-200"
      };
    case 'listing_suspended':
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        iconCls: "bg-amber-100 text-amber-600",
        badgeCls: "bg-amber-100 text-amber-700 border-amber-200"
      };
    case 'listing_unsuspended':
    case 'listing_restored':
      return {
        icon: <RefreshCw className="w-5 h-5" />,
        iconCls: "bg-emerald-100 text-emerald-600",
        badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200"
      };
    default:
      return {
        icon: <Bell className="w-5 h-5" />,
        iconCls: "bg-blue-100 text-blue-600",
        badgeCls: "bg-blue-100 text-blue-700 border-blue-200"
      };
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'listing_suspended':
      return "Listing Suspended";
    case 'listing_unsuspended':
      return "Listing Unsuspended";
    case 'listing_deleted':
      return "Listing Deleted";
    case 'listing_restored':
      return "Listing Restored";
    default:
      return "Notification";
  }
}

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingIds, setReadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const data = await fetchListingNotifications();
      setNotifications(data as ListingNotification[]);
      setLoading(false);
    })();
  }, []);

  const reloadNotifications = async () => {
    setLoading(true);
    const data = await fetchListingNotifications();
    setNotifications(data as ListingNotification[]);
    setLoading(false);
  };

  const handleMarkRead = async (notificationId: string) => {
    // Optimistic update — dim the card as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setReadingIds((prev) => new Set(prev).add(notificationId));

    try {
      await markNotificationRead(notificationId);
    } catch {
      // Revert on failure — reload from server
      reloadNotifications();
    } finally {
      setReadingIds((prev) => {
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
          <h2 className="text-xl font-extrabold text-navy-base">Notifications</h2>
          <p className="text-xs text-gray-500 mt-1">
            Updates about your listings from the Property Hub GH team.
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
            <Bell className="w-8 h-8 text-navy-base/40" />
          </div>
          <h3 className="text-lg font-bold text-navy-base mb-2">No notifications yet.</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Updates about your listings from the Property Hub GH team will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const style = getNotificationStyle(n.type);
            const listingId = n.metadata?.listing_id;

            return (
              <div
                key={n.id}
                className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconCls}`}
                      >
                        {style.icon}
                      </span>
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${style.badgeCls}`}
                      >
                        {getTypeLabel(n.type)}
                      </span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(n.created_at)}</span>
                    </div>

                    <h3 className="text-base font-bold text-navy-base mb-1">{n.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">{n.body}</p>
                    {n.metadata?.reason && (
                      <p className="text-sm text-gray-500 bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                        <span className="font-medium text-gray-500">Reason: </span>
                        {n.metadata.reason}
                      </p>
                    )}

                    {listingId && (
                      <a
                        href={`/listings/${listingId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-base hover:text-navy-light transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Listing
                      </a>
                    )}
                  </div>
                </div>

                {!n.is_read && (
                  <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={readingIds.has(n.id)}
                      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {readingIds.has(n.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}