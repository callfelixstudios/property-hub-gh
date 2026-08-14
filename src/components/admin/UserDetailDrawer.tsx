'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Ban,
  Trash2,
  RotateCcw,
  KeyRound,
  Bell,
  UserCog,
  Eye,
  BadgeCheck,
  Building2,
  ChevronDown,
  Save,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getUserDetail,
  updateUserProfile,
  sendUserNotification,
  suspendUser,
  reactivateUser,
  deleteUser,
  restoreUser,
  resetUserPassword,
  impersonateUser,
} from '@/app/actions/userManagementActions';
import type { UserDetail } from '@/app/actions/userManagementActions';

interface Props {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  deleted: 'bg-gray-100 text-gray-600',
};

const MODERATION_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  flagged: 'bg-orange-100 text-orange-700',
  suspended: 'bg-violet-100 text-violet-700',
  archived: 'bg-gray-100 text-gray-600',
  deleted: 'bg-gray-100 text-gray-600',
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <h3 className="font-semibold text-[#0d1b2a] text-sm">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const INPUT_CLASSES =
  'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d1b2a] focus:ring-1 focus:ring-[#0d1b2a]/10 transition-all';

type LoadState =
  | { status: 'ready'; userId: string; data: UserDetail }
  | { status: 'error'; userId: string }
  | null;

const EMPTY_FORM = {
  full_name: '',
  company_name: '',
  contact_phone: '',
  whatsapp_link: '',
  preferred_currency: 'GHS',
};

export default function UserDetailDrawer({ userId, open, onClose }: Props) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmImpersonate, setConfirmImpersonate] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSyncedFor, setFormSyncedFor] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const pending = pendingAction !== null;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch detail whenever the drawer opens or the target user changes.
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    startTransition(async () => {
      try {
        const data = await getUserDetail(userId);
        if (!cancelled) setLoadState({ status: 'ready', userId, data });
      } catch (err) {
        if (!cancelled) {
          setLoadState({ status: 'error', userId });
          showToast(
            err instanceof Error ? err.message : 'Failed to load user details.',
            'error'
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, userId, showToast, startTransition]);

  // Keep the edit form in sync with the loaded profile (render-phase update).
  if (loadState?.status === 'ready' && loadState.userId === userId && loadState.data.profile.id !== formSyncedFor) {
    setFormSyncedFor(loadState.data.profile.id);
    setForm({
      full_name: loadState.data.profile.full_name ?? '',
      company_name: loadState.data.profile.company_name ?? '',
      contact_phone: loadState.data.profile.contact_phone ?? '',
      whatsapp_link: loadState.data.profile.whatsapp_link ?? '',
      preferred_currency: loadState.data.profile.preferred_currency === 'USD' ? 'USD' : 'GHS',
    });
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const refreshDetail = () => {
    if (!userId) return;
    startTransition(async () => {
      try {
        const data = await getUserDetail(userId);
        setLoadState({ status: 'ready', userId, data });
      } catch {
        // Keep the stale detail; the table refresh still reflects the change.
      }
    });
  };

  const runAction = (key: string, fn: () => Promise<unknown>, successMessage: string) => {
    setPendingAction(key);
    startTransition(async () => {
      try {
        await fn();
        showToast(successMessage);
        router.refresh();
        refreshDetail();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSuspend = () => {
    const reason = window.prompt('Reason for suspension (optional):');
    if (reason === null) return;
    runAction('suspend', () => suspendUser(userId!, reason || undefined), 'Account suspended.');
  };

  const handleReactivate = () => {
    runAction('reactivate', () => reactivateUser(userId!), 'Account reactivated.');
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    runAction('delete', () => deleteUser(userId!), 'Account deleted.');
  };

  const handleRestore = () => {
    runAction('restore', () => restoreUser(userId!), 'Account restored.');
  };

  const handleResetPassword = () => {
    setPendingAction('reset');
    startTransition(async () => {
      try {
        const result = await resetUserPassword(userId!);
        setRecoveryLink(result.link);
        showToast('Password reset link generated.');
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to reset password.', 'error');
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleImpersonate = () => {
    setConfirmImpersonate(false);
    setPendingAction('impersonate');
    startTransition(async () => {
      try {
        await impersonateUser(userId!);
        // On success the action redirects away; nothing to do here.
      } catch (err) {
        // NEXT_REDIRECT is handled by the framework - do not surface it.
        if (
          typeof err === 'object' &&
          err !== null &&
          (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')
        ) {
          return;
        }
        showToast(
          err instanceof Error ? err.message : 'Failed to start impersonation.',
          'error'
        );
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleUpdateProfile = () => {
    setPendingAction('profile');
    startTransition(async () => {
      try {
        await updateUserProfile(userId!, {
          full_name: form.full_name,
          company_name: form.company_name,
          contact_phone: form.contact_phone,
          whatsapp_link: form.whatsapp_link,
          preferred_currency: form.preferred_currency as 'GHS' | 'USD',
        });
        showToast('Profile updated.');
        router.refresh();
        refreshDetail();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSendNotification = () => {
    setPendingAction('notify');
    startTransition(async () => {
      try {
        await sendUserNotification(userId!, notifyTitle, notifyBody);
        setNotifyOpen(false);
        setNotifyTitle('');
        setNotifyBody('');
        showToast('Notification sent.');
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to send notification.', 'error');
      } finally {
        setPendingAction(null);
      }
    });
  };

  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!open || !userId) return null;

  const current = loadState && loadState.userId === userId ? loadState : null;
  const loading = current === null;
  const detail = current?.status === 'ready' ? current.data : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <aside className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#0d1b2a] flex-shrink-0">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            User Details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f7f9fb]">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : current?.status === 'error' ? (
            <div className="text-center text-slate-400 text-sm py-20">
              Could not load user details. Close and try again.
            </div>
          ) : detail ? (
            <>
              {/* ── 1. Header / account overview ─────────────────────── */}
              <Section icon={ShieldCheck} title="Account Overview">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {(detail.profile.full_name?.[0] ?? detail.profile.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0d1b2a] text-lg leading-tight truncate">
                      {detail.profile.full_name || 'Unnamed User'}
                    </p>
                    <p className="text-sm text-slate-400 truncate">{detail.profile.email || 'No email on file'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_STYLES[detail.profile.account_status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {detail.profile.account_status}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          TIER_STYLES[detail.profile.membership_tier] ?? TIER_STYLES.free
                        }`}
                      >
                        {TIER_LABELS[detail.profile.membership_tier] ?? detail.profile.membership_tier}
                      </span>
                      {detail.profile.is_verified_agent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eab308] text-[#0d1b2a]">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified Agent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="text-slate-700">
                      {new Date(detail.profile.created_at).toLocaleDateString('en-GH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Verification</p>
                    <p className="text-slate-700 capitalize">{detail.profile.verification_status || '—'}</p>
                  </div>
                  {detail.profile.document_type && (
                    <div>
                      <p className="text-xs text-slate-400">Document</p>
                      <p className="text-slate-700 capitalize">{detail.profile.document_type}</p>
                    </div>
                  )}
                  {detail.profile.license_number && (
                    <div>
                      <p className="text-xs text-slate-400">License</p>
                      <p className="text-slate-700">{detail.profile.license_number}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* ── 2. Account actions ────────────────────────────────── */}
              <Section icon={ShieldOff} title="Account Actions">
                <div className="flex flex-wrap gap-2">
                  {detail.profile.account_status === 'suspended' ? (
                    <button
                      onClick={handleReactivate}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pendingAction === 'reactivate' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Reactivate
                    </button>
                  ) : detail.profile.account_status === 'deleted' ? (
                    <button
                      onClick={handleRestore}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pendingAction === 'restore' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSuspend}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pendingAction === 'suspend' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                        Suspend
                      </button>
                      <button
                        onClick={() => setConfirmDelete(true)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleResetPassword}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0d1b2a] text-[#0d1b2a] hover:bg-[#0d1b2a]/5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pendingAction === 'reset' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    Reset password
                  </button>
                  <button
                    onClick={() => setNotifyOpen(true)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0d1b2a] text-[#0d1b2a] hover:bg-[#0d1b2a]/5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bell className="w-4 h-4" />
                    Send notification
                  </button>
                  <button
                    onClick={() => setConfirmImpersonate(true)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eab308] text-[#0d1b2a] hover:bg-[#eab308]/90 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    Impersonate
                  </button>
                </div>
              </Section>

              {/* ── 3. Profile edit form ──────────────────────────────── */}
              <Section icon={UserCog} title="Profile Details">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Full name</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact phone</label>
                    <input
                      type="text"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp link</label>
                    <input
                      type="text"
                      value={form.whatsapp_link}
                      onChange={(e) => setForm({ ...form, whatsapp_link: e.target.value })}
                      placeholder="https://wa.me/233XXXXXXXXX"
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preferred currency</label>
                    <div className="relative">
                      <select
                        value={form.preferred_currency}
                        onChange={(e) => setForm({ ...form, preferred_currency: e.target.value })}
                        className={`${INPUT_CLASSES} appearance-none pr-8 cursor-pointer`}
                      >
                        <option value="GHS">GHS (₵)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUpdateProfile}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0d1b2a] text-white hover:bg-[#0d1b2a]/90 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pendingAction === 'profile' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save changes
                </button>
              </Section>

              {/* ── 4. Listings ───────────────────────────────────────── */}
              <Section icon={Building2} title="Listings">
                {detail.listings.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No listings.</p>
                ) : (
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Moderation</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Health</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.listings.map((listing) => (
                            <tr key={listing.id}>
                              <td className="px-3 py-2.5 text-slate-700 truncate max-w-[140px]">{listing.title || '—'}</td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                                    STATUS_STYLES[listing.status] ?? 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {listing.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                                    MODERATION_STYLES[listing.moderation_status] ?? 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {listing.moderation_status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 whitespace-nowrap capitalize">
                                  {listing.listing_health}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                                {new Date(listing.created_at).toLocaleDateString('en-GH', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Section>

              {/* ── 5. Audit trail ────────────────────────────────────── */}
              <Section icon={Eye} title="Audit Trail">
                {detail.auditLogs.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No audit records.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.auditLogs.map((log) => {
                      const expanded = expandedLogs.has(log.id);
                      return (
                        <div key={log.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleLog(log.id)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold whitespace-nowrap">
                                {log.action_type}
                              </span>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('en-GH')}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                                expanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expanded && (
                            <div className="px-3 pb-3 space-y-2">
                              <div>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                                  Previous values
                                </p>
                                <pre className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5 overflow-x-auto text-slate-700 whitespace-pre-wrap break-words">
                                  {JSON.stringify(log.previous_values ?? {}, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                                  New values
                                </p>
                                <pre className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5 overflow-x-auto text-slate-700 whitespace-pre-wrap break-words">
                                  {JSON.stringify(log.new_values ?? {}, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </>
          ) : (
            <div className="text-center text-slate-400 text-sm py-20">No user data available.</div>
          )}
        </div>
      </aside>

      {/* ── Delete confirm modal ─────────────────────────────────────── */}
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4 z-10">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0d1b2a]">Delete user account</h3>
                <p className="text-xs text-slate-400">Soft delete — can be restored later.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Are you sure you want to delete this user? Their account will be marked as deleted and hidden from the platform.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === 'delete' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Impersonate confirm modal ────────────────────────────────── */}
      {confirmImpersonate && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4 z-10">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#eab308]/15 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0d1b2a]">Impersonate user</h3>
                <p className="text-xs text-slate-400">Full access as this user.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              You will see the app exactly as this user does for 30 minutes. Every action is logged.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmImpersonate(false)}
                disabled={pending}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImpersonate}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#eab308] text-[#0d1b2a] text-sm font-medium hover:bg-[#eab308]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === 'impersonate' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Start impersonation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recovery link modal ──────────────────────────────────────── */}
      {recoveryLink && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4 z-10">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-[#0d1b2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0d1b2a]">Password reset link</h3>
                <p className="text-xs text-slate-400">Share this with the user to reset their password.</p>
              </div>
            </div>
            <input
              readOnly
              value={recoveryLink}
              onFocus={(e) => e.target.select()}
              className={`${INPUT_CLASSES} mb-4 text-xs bg-slate-50`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRecoveryLink(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(recoveryLink);
                  showToast('Recovery link copied.');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#0d1b2a] text-[#0d1b2a] hover:bg-[#0d1b2a]/5 text-sm font-medium transition-colors"
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification modal ───────────────────────────────────────── */}
      {notifyOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4 z-10">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#0d1b2a]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0d1b2a]">Send notification</h3>
                <p className="text-xs text-slate-400">Delivered to the user&apos;s inbox.</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  maxLength={200}
                  className={INPUT_CLASSES}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                <textarea
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className={`${INPUT_CLASSES} resize-none`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNotifyOpen(false);
                  setNotifyTitle('');
                  setNotifyBody('');
                }}
                disabled={pending}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0d1b2a] text-white text-sm font-medium hover:bg-[#0d1b2a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === 'notify' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0d1b2a] text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}