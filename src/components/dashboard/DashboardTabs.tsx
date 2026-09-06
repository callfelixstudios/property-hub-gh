"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EditListingModal from '@/components/listings/EditListingModal';
import imageCompression from 'browser-image-compression';
import { Heart, Camera, Loader2, CheckCircle2, AlertCircle, Bell, Zap } from 'lucide-react';
import TimeframeSelector, { TimeframePeriod } from './TimeframeSelector';
import { fetchTimeframeAnalytics } from '@/app/actions/analytics';
import { boostListing } from '@/app/actions/boostActions';
import { SidebarProfile } from './SidebarProfile';
import MatchingRequestsTab from './MatchingRequestsTab';
import NotificationsTab from './NotificationsTab';
import type { TierSlug } from '@/lib/tiers';
import type { CreditConfig } from '@/lib/creditPurchase';

interface Listing {
  id: string;
  title: string;
  status: string;
  moderation_status?: string;
  boosted_until?: string | null;
  transaction_type: 'rent' | 'sale';
  base_rent?: number;
  outright_price?: number;
  safemove_enabled?: boolean;
  views?: number;
  whatsapp_leads_count?: number;
  [key: string]: unknown;
}

interface Profile {
  id?: string;
  full_name?: string;
  contact_phone?: string;
  whatsapp_link?: string;
  avatar_url?: string;
  membership_tier?: string;
  is_verified_agent?: boolean;
  [key: string]: unknown;
}

interface SpaceRequest {
  id: string;
  seeker_name: string;
  whatsapp_number: string;
  property_type: string;
  purpose: string;
  location: string;
  budget: number;
  additional_details?: string;
  status: string;
  user_id?: string;
  created_at: string;
}

interface SafemoveTransaction {
  id: string;
  status: string;
  transaction_amount: number;
  listings?: {
    id: string;
    title: string;
    neighborhood?: string;
    city?: string;
  };
  [key: string]: unknown;
}

const extractPhoneFromWaLink = (link?: string) => {
  if (!link) return '';
  const match = link.match(/wa\.me\/(\d+)/);
  return match ? match[1] : '';
};

export default function DashboardTabs({
  initialListings,
  initialProfile,
  initialSafemoveTransactions = [],
  userId,
  userEmail,
  activeTabOverride,
  children,
  initialTier = 'free',
  tierLimit = 2,
  creditBalance,
  creditConfig,
}: {
  initialListings?: Listing[];
  initialProfile?: Profile;
  initialSafemoveTransactions?: SafemoveTransaction[];
  userId: string;
  userEmail?: string;
  activeTabOverride?: string;
  children?: React.ReactNode;
  initialTier?: TierSlug;
  tierLimit?: number;
  creditBalance?: number;
  creditConfig?: CreditConfig;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'overview' | 'listings' | 'archived' | 'safemove' | 'profile' | 'space-requests' | 'matching-requests' | 'notifications' | null;
  const timeframeParam = searchParams.get('timeframe') as TimeframePeriod | null;

  const supabase = createClient();

  const [internalActiveTab, setInternalActiveTab] = useState<'overview' | 'listings' | 'archived' | 'safemove' | 'profile' | 'space-requests' | 'matching-requests' | 'notifications'>('overview');
  const activeTab = tabParam || internalActiveTab;
  const setActiveTab = setInternalActiveTab;

  const [period, setPeriod] = useState<TimeframePeriod>(timeframeParam || 'all');
  const [isAnalyticsPending, startAnalyticsTransition] = useTransition();
  const [analyticsData, setAnalyticsData] = useState(() => {
    const tViews = initialListings?.reduce((sum, l) => sum + (l.views || 0), 0) || 0;
    const tLeads = initialListings?.reduce((sum, l) => sum + (l.whatsapp_leads_count || 0), 0) || 0;
    return {
      totalViews: tViews,
      totalLeads: tLeads,
      conversionRate: tViews > 0 ? ((tLeads / tViews) * 100).toFixed(1) : '0.0',
      listingBreakdown: initialListings?.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status || 'active',
        views_count: l.views || 0,
        whatsapp_leads_count: l.whatsapp_leads_count || 0,
        conversion_rate: (l.views || 0) > 0 ? ((l.whatsapp_leads_count || 0) / (l.views || 0) * 100).toFixed(1) : '0.0'
      })) || []
    };
  });

  useEffect(() => {
    if (timeframeParam && timeframeParam !== 'all') {
      startAnalyticsTransition(async () => {
        try {
          const updated = await fetchTimeframeAnalytics(userId, timeframeParam);
          setAnalyticsData(updated);
        } catch (err) {
          console.error('Failed to fetch timeframe analytics:', err);
        }
      });
    }
  }, [timeframeParam]);

  const [listings, setListings] = useState<Listing[]>(initialListings || []);
  const [profile, setProfile] = useState<Profile>(initialProfile || {});
  const [whatsappInput, setWhatsappInput] = useState(() => extractPhoneFromWaLink(initialProfile?.whatsapp_link));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [boostMsg, setBoostMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTimeframeChange = (newPeriod: TimeframePeriod) => {
    setPeriod(newPeriod);
    const params = new URLSearchParams(searchParams.toString());
    params.set('timeframe', newPeriod);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reauthentication gate: proof of identity (OTP) before email/password changes
  const [reauthPending, setReauthPending] = useState<'email' | 'password' | null>(null);
  const [reauthToken, setReauthToken] = useState('');
  const [reauthMsg, setReauthMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  // Separate locks: sending (reauthenticate) vs verifying (verifyOtp). Each new
  // OTP invalidates the previous one, so these prevent accidental invalidation
  // via double-clicks and show spinners for both async phases.
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // Diagnostics: when the code was last (re)sent and how many challenges were
  // issued this session. Proves whether a failed code was stale/superseded.
  const [reauthSentAt, setReauthSentAt] = useState<number | null>(null);
  const [reauthSendCount, setReauthSendCount] = useState(0);

  const [spaceRequests, setSpaceRequests] = useState<SpaceRequest[]>([]);
  const [srLoading, setSrLoading] = useState(false);
  const [srFilter, setSrFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [editingSr, setEditingSr] = useState<SpaceRequest | null>(null);
  const [srMsg, setSrMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeTab !== 'space-requests') return;
    const loadData = async () => {
      setSrLoading(true);
      try {
        let query = supabase
          .from('space_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (srFilter === 'active') query = query.eq('status', 'active');
        else if (srFilter === 'archived') query = query.eq('status', 'archived');

        const { data, error } = await query;
        if (error) throw error;
        setSpaceRequests(data || []);
      } catch (err: unknown) {
        console.error('Failed to fetch space requests:', err);
      } finally {
        setSrLoading(false);
      }
    };
    loadData();
  }, [activeTab, supabase, userId, srFilter]);

  const handleEditSr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSr) return;
    setSrMsg(null);
    try {
      const { data, error } = await supabase
        .from('space_requests')
        .update({
          seeker_name: editingSr.seeker_name,
          whatsapp_number: editingSr.whatsapp_number,
          property_type: editingSr.property_type,
          purpose: editingSr.purpose,
          location: editingSr.location,
          budget: editingSr.budget,
          additional_details: editingSr.additional_details,
        })
        .eq('id', editingSr.id)
        .select();

      if (error) {
        console.error('Edit space request — Supabase error detail:', error);
        setSrMsg({ type: 'error', text: error.message || 'Update failed.' });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Edit space request — no rows returned (permission or id mismatch)');
        setSrMsg({ type: 'error', text: 'No matching record found. The row may have been deleted or you lack permission.' });
        return;
      }

      setSrMsg({ type: 'success', text: 'Request updated!' });
      setEditingSr(null);
      setSpaceRequests(prev => prev.map(r => r.id === data[0].id ? data[0] : r));
    } catch (err: unknown) {
      console.error('Edit space request — unexpected error:', err);
      setSrMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed.' });
    }
  };

  const handleArchiveSr = async (id: string) => {
    setSrMsg(null);
    try {
      const { data, error } = await supabase
        .from('space_requests')
        .update({ status: 'archived' })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Archive space request — Supabase error detail:', error);
        setSrMsg({ type: 'error', text: error.message || 'Archive failed.' });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Archive space request — no rows returned (permission or id mismatch)');
        setSrMsg({ type: 'error', text: 'No matching record found. The row may have been deleted or you lack permission.' });
        return;
      }

      setSpaceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'archived' } : r));
      setSrMsg({ type: 'success', text: 'Request archived.' });
    } catch (err: unknown) {
      console.error('Archive space request — unexpected error:', err);
      setSrMsg({ type: 'error', text: err instanceof Error ? err.message : 'Archive failed.' });
    }
  };

  const handleDeleteSr = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this request? This cannot be undone.')) return;
    setSrMsg(null);
    try {
      const { data, error } = await supabase
        .from('space_requests')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Delete space request — Supabase error detail:', error);
        setSrMsg({ type: 'error', text: error.message || 'Delete failed.' });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Delete space request — no rows returned (permission or id mismatch)');
        setSrMsg({ type: 'error', text: 'No matching record found. The row may have been deleted or you lack permission.' });
        return;
      }

      setSpaceRequests(prev => prev.filter(r => r.id !== id));
      setSrMsg({ type: 'success', text: 'Request permanently deleted.' });
    } catch (err: unknown) {
      console.error('Delete space request — unexpected error:', err);
      setSrMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  const handleRestoreSr = async (id: string) => {
    setSrMsg(null);
    try {
      const { data, error } = await supabase
        .from('space_requests')
        .update({ status: 'active' })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Restore space request — Supabase error detail:', error);
        setSrMsg({ type: 'error', text: error.message || 'Restore failed.' });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Restore space request — no rows returned (permission or id mismatch)');
        setSrMsg({ type: 'error', text: 'No matching record found. The row may have been deleted or you lack permission.' });
        return;
      }

      setSpaceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'active' } : r));
      setSrMsg({ type: 'success', text: 'Request restored to active successfully!' });
    } catch (err: unknown) {
      console.error('Restore space request — unexpected error:', err);
      setSrMsg({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed.' });
    }
  };

  const handleArchiveListing = async (listingId: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', listingId)
      .eq('poster_id', userId);
    
    if (error) {
      console.error('Archive failed:', error.message, error);
      alert(`Failed to archive listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'archived' } : l));
    router.refresh();
  };

  const tierLabel = initialTier.charAt(0).toUpperCase() + initialTier.slice(1);

  const handleRenewListing = async (listingId: string) => {
    setRestoreError(null);

    // ── Pre-renewal limit guard ─────────────────────────────────────────
    // Count the user's currently active (non-archived, non-sold/rented)
    // listings. If the limit is already reached, block the renewal and
    // surface a descriptive error instead of performing the DB write.
    const { data: activeListings, error: countError } = await supabase
      .from('listings')
      .select('id')
      .eq('poster_id', userId)
      .in('status', ['active']);

    if (countError) {
      console.error('Failed to count active listings:', countError.message);
      setRestoreError('Unable to verify your active listing count. Please try again.');
      return;
    }

    if ((activeListings?.length ?? 0) >= tierLimit) {
      setRestoreError(
        `${tierLabel} plan allows ${tierLimit} active listings — upgrade for more. ` +
        `Archive or delete an existing listing before renewing this one.`
      );
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    const { error } = await supabase
      .from('listings')
      .update({
        status: 'active',
        listing_health: 'fresh',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('poster_id', userId);
    
    if (error) {
      console.error('Renew failed:', error.message, error);
      setRestoreError(`Failed to renew listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active', listing_health: 'fresh' } : l));
    router.refresh();
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) return;
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('poster_id', userId);

    if (error) {
      console.error('Database deletion failed:', error.message, error);
      alert(`Failed to delete listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.filter(l => l.id !== listingId));
    router.refresh();
  };

  const handleStatusToggle = async (listingId: string, currentStatus: string, transactionType: string) => {
    const newStatus = currentStatus === 'active' 
      ? (transactionType === 'rent' ? 'rented' : 'sold') 
      : 'active';

    // ── Relist cap guard (sold/rented → active) ─────────────────────────
    if (newStatus === 'active') {
      const activeCount = listings.filter(l => l.status === 'active').length;
      if (activeCount >= tierLimit) {
        alert(`${tierLabel} plan allows ${tierLimit} active listings — upgrade for more.`);
        return;
      }
    }
    // ───────────────────────────────────────────────────────────────────

    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId)
      .eq('poster_id', userId);

    if (error) {
      console.error('Database update failed:', error.message, error);
      alert(`Failed to update status: ${error.message}`);
      return;
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    router.refresh();
  };

  const handleBoostListing = async (listingId: string) => {
    setBoostingId(listingId);
    setBoostMsg(null);
    try {
      await boostListing(listingId);
      const days = creditConfig?.boost_duration_days ?? 7;
      const boostedUntil = new Date(new Date().getTime() + days * 86400000).toISOString();
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, boosted_until: boostedUntil } : l));
      setBoostMsg({ type: 'success', text: 'Listing boosted.' });
      router.refresh();
    } catch (err) {
      setBoostMsg({ type: 'error', text: err instanceof Error ? err.message : 'Boost failed.' });
    } finally {
      setBoostingId(null);
    }
  };

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
  };
  const closeEditModal = () => {
    setEditingListing(null);
  };

  const handleListingSaved = (updatedListing: Listing) => {
    setListings(listings.map(l => l.id === updatedListing.id ? { ...l, ...updatedListing } : l));
    closeEditModal();
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarMsg(null);

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 400,
        maxSizeMB: 0.15,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });

      const ext = 'jpg';
      const fileName = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressed, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (dbError) throw dbError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarMsg({ type: 'success', text: 'Profile photo updated!' });
    } catch (err: unknown) {
      console.error('Avatar upload error:', err);
      setAvatarMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to upload photo.' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    const currentUrl = profile.avatar_url;
    if (!currentUrl) return;

    setIsUploadingAvatar(true);
    setAvatarMsg(null);

    try {
      const pathParts = currentUrl.split('/avatars/');
      const storagePath = pathParts.length > 1 ? `avatars/${pathParts[1]}` : null;

      if (storagePath) {
        await supabase.storage.from('avatars').remove([storagePath]);
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (dbError) throw dbError;

      setProfile(prev => ({ ...prev, avatar_url: undefined }));
      setAvatarMsg({ type: 'success', text: 'Profile photo removed.' });
    } catch (err: unknown) {
      console.error('Avatar remove error:', err);
      setAvatarMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to remove photo.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const startReauth = async (pendingAction: 'email' | 'password') => {
    // Guard: each reauthenticate() call invalidates the previous OTP, so never
    // fire while a send is in flight.
    if (isSendingCode) return;
    setIsSendingCode(true);
    setReauthMsg(null);
    setReauthToken('');
    try {
      const { error } = await supabase.auth.reauthenticate();
      if (error) {
        setReauthMsg({ type: 'error', text: error.message || 'Failed to start verification.' });
        return;
      }
      setReauthSentAt(Date.now());
      setReauthSendCount((c) => c + 1);
      setReauthPending(pendingAction);
    } finally {
      setIsSendingCode(false);
    }
  };

  const confirmReauth = async (): Promise<boolean> => {
    // Guard against double-submit: one verify request at a time.
    if (isVerifying) return false;
    // Clear stale errors at the start of every attempt.
    setReauthMsg(null);
    if (!reauthToken.trim()) {
      setReauthMsg({ type: 'error', text: 'Please enter the verification code.' });
      return false;
    }
    setIsVerifying(true);
    try {
      // Fresh session first: verifyOtp binds the OTP to the active session JWT.
      // A stale/dropped session makes GoTrue issue-then-reject the challenge.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setReauthMsg({ type: 'error', text: 'No active session found. Please log back in.' });
        return false;
      }
      // NOTE: this OTP was issued by reauthenticate() to the CURRENT email/phone,
      // so it must be verified as type 'reauthentication' against the session email —
      // never as 'email_change' against the new address (that confirmation comes
      // later, via updateUser, to the new inbox).
      const sessionUser = session.user;
      const payload = sessionUser.email
        ? { email: sessionUser.email, token: reauthToken.trim(), type: 'reauthentication' as const }
        : { phone: sessionUser.phone ?? '', token: reauthToken.trim(), type: 'reauthentication' as const };
      const { error } = await supabase.auth.verifyOtp(payload);
      if (error) {
        // Raw metadata for GoTrue diagnosis (see error-codes docs): distinguishes
        // 'reauthentication_not_valid' (token mismatch) from 'otp_expired' (server-side
        // expiry / session-footprint mismatch).
        console.log('Raw Supabase Auth Error Object:', {
          status: (error as { status?: unknown }).status,
          code: (error as { code?: unknown }).code,
          message: error.message,
          elapsedSecSinceCodeSent: reauthSentAt ? Math.round((Date.now() - reauthSentAt) / 1000) : null,
          challengesIssuedThisSession: reauthSendCount,
        });
        setReauthMsg({ type: 'error', text: error.message || 'Invalid verification code.' });
        return false;
      }
      return true;
    } finally {
      setIsVerifying(false);
    }
  };

  const performEmailUpdate = async () => {
    setIsUpdatingEmail(true);
    setEmailMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: 'success', text: 'Verification link sent! Please check your new email to confirm the change.' });
      setNewEmail('');
    } catch (err: unknown) {
      console.error('Email update error:', err);
      setEmailMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update email.' });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      setEmailMsg({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }

    await startReauth('email');
  };

  const performPasswordUpdate = async () => {
    setIsUpdatingPassword(true);
    setPasswordMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error('Password update error:', err);
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    await startReauth('password');
  };

  const handleConfirmReauthAction = async () => {
    const ok = await confirmReauth();
    if (!ok) return;
    setReauthMsg(null);
    setReauthToken('');
    setReauthSentAt(null);
    setReauthSendCount(0);
    setReauthPending(null);
    if (reauthPending === 'email') {
      await performEmailUpdate();
    } else {
      await performPasswordUpdate();
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage('');

    let sanitizedNumber = whatsappInput.replace(/\D/g, '');
    if (sanitizedNumber.startsWith('0')) {
      sanitizedNumber = '233' + sanitizedNumber.slice(1);
    }
    const finalWaLink = sanitizedNumber ? `https://wa.me/${sanitizedNumber}` : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        contact_phone: profile.contact_phone,
        whatsapp_link: finalWaLink
      })
      .eq('id', userId);

    setIsUpdatingProfile(false);
    if (!error) {
      setProfileMessage('Profile updated successfully!');
      setProfile({ ...profile, whatsapp_link: finalWaLink || undefined });
      router.refresh();
    } else {
      console.error("Supabase update error:", error);
      setProfileMessage(`Error updating profile: ${error.message || JSON.stringify(error)}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: '/dashboard?tab=overview' },
    { id: 'listings', label: 'My Listings', path: '/dashboard?tab=listings' },
    { id: 'matching-requests', label: '🤝 Matching Requests', path: '/dashboard?tab=matching-requests' },
    { id: 'notifications', label: 'Notifications', path: '/dashboard?tab=notifications', icon: <Bell className="w-4 h-4 mr-2 inline-block opacity-70" /> },
    { id: 'archived', label: 'Archived Listings', path: '/dashboard?tab=archived' },
    { id: 'safemove', label: 'SafeMove Tracker', path: '/dashboard?tab=safemove' },
    { id: 'space-requests', label: 'My Space Requests', path: '/dashboard?tab=space-requests' },
    { id: 'saved', label: 'Saved Listings', path: '/dashboard/saved', icon: <Heart className="w-4 h-4 mr-2 inline-block opacity-70" /> },
    { id: 'profile', label: 'Profile Settings', path: '/dashboard?tab=profile' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Navigation Rail */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <SidebarProfile
          avatarUrl={profile.avatar_url}
          fullName={profile.full_name}
          userEmail={userEmail}
          isUploading={isUploadingAvatar}
          onAvatarClick={() => fileInputRef.current?.click()}
          tier={initialTier}
          isVerifiedAgent={profile.is_verified_agent}
          creditBalance={creditBalance}
          creditPriceGhs={creditConfig?.credit_price_ghs}
          creditMinQty={creditConfig?.credit_min_qty}
          creditMaxQty={creditConfig?.credit_max_qty}
        />
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = (activeTabOverride || activeTab) === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.path) {
                    router.push(tab.path, { scroll: false });
                  } else {
                    setActiveTab(tab.id as 'overview' | 'listings' | 'archived' | 'safemove' | 'profile' | 'space-requests' | 'matching-requests' | 'notifications');
                    router.push(`/dashboard?tab=${tab.id}`, { scroll: false });
                  }
                }}
                className={`flex items-center text-left px-4 py-3 rounded-md font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-navy-base text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.icon && (
                  <span className={`flex items-center justify-center ${isActive ? 'text-red-400' : 'text-gray-400'}`}>
                    {tab.icon}
                  </span>
                )}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
        
        {/* EXTERNAL INJECTED CONTENT */}
        {activeTabOverride ? children : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header Control Header Grid Layout */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-navy-base">Performance Overview</h2>
                <p className="text-xs text-gray-500">Track and optimize exposure, buyer interest, and conversion response windows.</p>
              </div>
              <TimeframeSelector value={period} onChange={handleTimeframeChange} isPending={isAnalyticsPending} />
            </div>

            {/* Metric Overview Metrics Ribbon */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Views</p>
                <p className="text-3xl font-extrabold text-navy-base">{analyticsData.totalViews.toLocaleString()}</p>
              </div>
              
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp Leads</p>
                <p className="text-3xl font-extrabold text-emerald-600">{analyticsData.totalLeads.toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lead Conversion Rate</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-extrabold text-indigo-600">{analyticsData.conversionRate}%</p>
                  <span className="text-xs font-medium text-slate-400">views to clicks</span>
                </div>
              </div>
            </div>

            {/* Property Breakdown Data Sheet Matrix */}
            <div className={`bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden transition-opacity duration-300 ${isAnalyticsPending ? 'opacity-50' : ''}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-navy-base uppercase tracking-wider">
                      <th className="p-4">Listing Title</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Views</th>
                      <th className="p-4 text-center">WhatsApp Clicks</th>
                      <th className="p-4 text-center">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {analyticsData.listingBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-gray-400 font-medium">
                          No property activities logged within this timeframe selection range.
                        </td>
                      </tr>
                    ) : (
                      analyticsData.listingBreakdown.map((listing) => (
                        <tr key={listing.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 font-semibold text-navy-base max-w-xs truncate">{listing.title}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              listing.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                              listing.status === 'rented' || listing.status === 'sold' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {listing.status}
                            </span>
                          </td>
                          <td className="p-4 text-center font-medium text-slate-600">{listing.views_count.toLocaleString()}</td>
                          <td className="p-4 text-center font-bold text-emerald-600">{listing.whatsapp_leads_count.toLocaleString()}</td>
                          <td className="p-4 text-center font-bold text-indigo-600">{listing.conversion_rate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MY LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-2xl font-bold text-navy-base">My Listings</h2>
              <p className="text-sm text-gray-500">
                {listings.filter(l => l.status === 'active').length} / {tierLimit} active listings
              </p>
            </div>
            {creditBalance !== undefined && (
              <p className="text-xs text-slate-500 mb-4">
                Boost credits: {creditBalance} • 1 credit = 1 {creditConfig?.boost_duration_days ?? 7}-day top placement
              </p>
            )}
            {boostMsg && (
              <div
                role={boostMsg.type === 'success' ? 'status' : 'alert'}
                className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${
                  boostMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {boostMsg.text}
                {boostMsg.type === 'error' && boostMsg.text.includes('Insufficient credits') && (
                  <Link href="/pricing#credits" className="ml-2 font-bold underline">
                    Buy credits
                  </Link>
                )}
              </div>
            )}
            {listings.filter(l => l.status !== 'archived').length === 0 ? (
              <p className="text-gray-500">You don&apos;t have any active listings yet.</p>
            ) : (
              <div className="space-y-4">
                {listings.filter(l => l.status !== 'archived').map((listing) => {
                  const boosted = !!listing.boosted_until && new Date(String(listing.boosted_until)) > new Date();
                  const boostable = listing.status === 'active' && (listing.moderation_status === undefined || listing.moderation_status === 'approved');
                  return (
                  <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-slate-50">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-navy-base text-lg line-clamp-1">{listing.title || 'Untitled Property'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${listing.status === 'active' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-gray-200 text-gray-600'}`}>
                          {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Active'}
                        </span>
                        {boosted && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-accent-gold text-navy-base">
                            <Zap className="w-3 h-3 fill-current" />
                            Boosted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {listing.transaction_type === 'rent' ? 'For Rent' : 'For Sale'} • 
                        <span className="font-semibold text-navy-base ml-1">
                          ₵{listing.transaction_type === 'rent' ? listing.base_rent : listing.outright_price}
                        </span>
                      </p>
                      {boosted && listing.boosted_until && (
                        <p className="text-xs font-semibold text-amber-700 mt-1">
                          Boosted until {new Date(String(listing.boosted_until)).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap">
                      {boostable && (
                        <button
                          onClick={() => handleBoostListing(listing.id)}
                          disabled={boostingId === listing.id}
                          className="inline-flex items-center gap-1 bg-accent-gold hover:brightness-105 text-navy-base text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none disabled:opacity-50"
                        >
                          {boostingId === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 fill-current" />
                          )}
                          {boostingId === listing.id ? 'Boosting...' : 'Boost'}
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusToggle(listing.id, listing.status || 'active', listing.transaction_type)}
                        className={`text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none border ${
                          listing.status === 'active'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-600'
                        }`}
                      >
                        {listing.status === 'active' 
                          ? (listing.transaction_type === 'rent' ? 'Mark as Rented' : 'Mark as Sold') 
                          : 'Relist Property'}
                      </button>
                      <button
                        onClick={() => openEditModal(listing)}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveListing(listing.id)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-amber-200 flex-1 sm:flex-none"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:bg-red-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-red-200 flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ARCHIVED LISTINGS TAB */}
        {activeTab === 'archived' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-6">Archived Listings</h2>
            {restoreError && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Renewal Blocked</p>
                  <p className="text-sm mt-0.5">{restoreError}</p>
                </div>
                <button onClick={() => setRestoreError(null)} className="text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss error">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            )}
            {listings.filter(l => l.status === 'archived' && l.moderation_status !== 'deleted').length === 0 ? (
              <p className="text-gray-500">You don&apos;t have any archived listings.</p>
            ) : (
              <div className="space-y-4">
                {listings.filter(l => l.status === 'archived' && l.moderation_status !== 'deleted').map((listing) => (
                  <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-slate-50 opacity-75 hover:opacity-100">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-navy-base text-lg line-clamp-1">{listing.title || 'Untitled Property'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-gray-200 text-gray-600`}>
                          Archived
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {listing.transaction_type === 'rent' ? 'For Rent' : 'For Sale'} • 
                        <span className="font-semibold text-navy-base ml-1">
                          ₵{listing.transaction_type === 'rent' ? listing.base_rent : listing.outright_price}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button
                        onClick={() => openEditModal(listing)}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRenewListing(listing.id)}
                        className="text-teal-600 hover:bg-teal-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-teal-600 flex-1 sm:flex-none"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:bg-red-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-red-200 flex-1 sm:flex-none"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAFEMOVE TRACKER TAB */}
        {activeTab === 'safemove' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-2">SafeMove Tracker</h2>
            <p className="text-gray-500 mb-8 text-sm">Monitor your ongoing secure escrow transactions.</p>
            
            {initialSafemoveTransactions.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">You don&apos;t have any active SafeMove escrow transactions right now.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {initialSafemoveTransactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-50 rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-navy-base text-lg">Transaction #{tx.id.split('-')[0].toUpperCase()}</h3>
                        <p className="text-sm text-gray-500">{tx.listings?.title || 'Unknown Property'}</p>
                      </div>
                      <div className={`font-bold px-3 py-1 rounded-full text-xs ${tx.status === 'completed' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-gold/10 text-accent-gold'}`}>
                        {tx.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 mt-8">
                      {/* Step 1: Deposit Locked */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? 'bg-accent-emerald' : (tx.status === 'deposit_locked' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h4 className="font-bold text-navy-base">Deposit Locked</h4>
                        <p className="text-sm text-gray-500 mt-1">Funds have been securely held in the Property Hub escrow account.</p>
                      </div>
                      
                      {/* Step 2: GPS Verification Pending */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${['scheduled_handover', 'completed'].includes(tx.status) ? 'bg-accent-emerald' : (tx.status === 'gps_pending' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {['scheduled_handover', 'completed'].includes(tx.status) ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : tx.status === 'gps_pending' ? (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          ) : null}
                        </div>
                        <h4 className={`font-bold ${['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? 'text-navy-base' : 'text-gray-400'}`}>GPS Verification Pending</h4>
                        <p className="text-sm text-gray-500 mt-1">Awaiting physical verification of the property against provided GPS coordinates.</p>
                      </div>

                      {/* Step 3: Handover & Release Scheduled */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${tx.status === 'completed' ? 'bg-accent-emerald' : (tx.status === 'scheduled_handover' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {tx.status === 'completed' ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : tx.status === 'scheduled_handover' ? (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          ) : null}
                        </div>
                        <h4 className={`font-bold ${['scheduled_handover', 'completed'].includes(tx.status) ? 'text-navy-base' : 'text-gray-400'}`}>Handover & Release Scheduled</h4>
                        <p className="text-sm text-gray-500 mt-1">Keys to be handed over and funds released to the landlord.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY SPACE REQUESTS TAB */}
        {activeTab === 'space-requests' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-navy-base">My Space Requests</h2>
              <div className="flex gap-2">
                {(['active', 'archived', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSrFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                      srFilter === f
                        ? 'bg-navy-base text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {srLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : spaceRequests.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 font-medium">No {srFilter !== 'all' ? srFilter : ''} space requests found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {spaceRequests.map((sr) => (
                  <div key={sr.id} className="bg-slate-50 rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-navy-base text-base truncate">
                          {sr.property_type} — {sr.location}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                          sr.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {sr.status.charAt(0).toUpperCase() + sr.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Budget: ₵{sr.budget.toLocaleString()} · {sr.purpose} · {sr.seeker_name}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingSr(sr)}
                        className="text-sm font-bold py-1.5 px-3 rounded-md bg-slate-700 hover:bg-slate-800 text-white transition-colors"
                      >
                        Edit
                      </button>
                      {sr.status === 'active' ? (
                        <button
                          onClick={() => handleArchiveSr(sr.id)}
                          className="text-sm font-bold py-1.5 px-3 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreSr(sr.id)}
                          className="text-sm font-bold py-1.5 px-3 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSr(sr.id)}
                        className="text-sm font-bold py-1.5 px-3 rounded-md text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Space Request Modal */}
            {editingSr && (
              <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => { setEditingSr(null); setSrMsg(null); }}>
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-navy-base mb-4">Edit Space Request</h3>
                  <form onSubmit={handleEditSr} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editingSr.seeker_name}
                        onChange={(e) => setEditingSr({ ...editingSr, seeker_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={editingSr.whatsapp_number}
                        onChange={(e) => setEditingSr({ ...editingSr, whatsapp_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose</label>
                        <select
                          value={editingSr.purpose}
                          onChange={(e) => setEditingSr({ ...editingSr, purpose: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                        >
                          <option>Residential</option>
                          <option>Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
                        <input
                          type="text"
                          value={editingSr.property_type}
                          onChange={(e) => setEditingSr({ ...editingSr, property_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editingSr.location}
                        onChange={(e) => setEditingSr({ ...editingSr, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Budget (GHS)</label>
                      <input
                        type="number"
                        value={editingSr.budget}
                        onChange={(e) => setEditingSr({ ...editingSr, budget: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Details</label>
                      <textarea
                        value={editingSr.additional_details || ''}
                        onChange={(e) => setEditingSr({ ...editingSr, additional_details: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                    </div>
                    {srMsg && (
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${srMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {srMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {srMsg.text}
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-md transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingSr(null); setSrMsg(null); }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATCHING REQUESTS TAB */}
        {activeTab === 'matching-requests' && (
          <MatchingRequestsTab userId={userId} />
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <NotificationsTab />
        )}

        {/* PROFILE SETTINGS TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-navy-base mb-8">Profile Settings</h2>

            {/* ─── Avatar Management ─────────────────────────────────── */}
            <div className="mb-10 flex flex-col items-center sm:items-start sm:flex-row gap-6">
              <div className="relative group flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold border-2 border-emerald-200">
                    {(profile.full_name || userEmail || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Hover overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  ) : (
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </button>

              </div>

              <div className="flex flex-col items-center sm:items-start gap-2">
                {profile.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                )}
                {avatarMsg && (
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${avatarMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {avatarMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {avatarMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Profile Info Form ─────────────────────────────────── */}
            <form onSubmit={handleProfileSubmit} className="space-y-5 mb-10">
              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Agent Display Name</label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                  placeholder="e.g. John Doe Properties"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={profile.contact_phone || ''}
                  onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                  placeholder="e.g. 055 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                  placeholder="e.g., 024 412 3456"
                />
                <p className="text-xs text-gray-500 mt-1">Buyers/Renters will use this number to contact you via WhatsApp directly.</p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-navy-base hover:bg-navy-light text-white font-bold py-2.5 px-6 rounded-md transition-colors disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
                {profileMessage && (
                  <span className={`text-sm font-medium ${profileMessage.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                    {profileMessage}
                  </span>
                )}
              </div>
            </form>

            {/* ─── Account Settings Card ─────────────────────────────── */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-bold text-navy-base">Account Settings</h3>

              {/* Email Section */}
              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Current Email</label>
                <input
                  type="email"
                  value={userEmail || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">New Email Address</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateEmail}
                    disabled={isUpdatingEmail || isSendingCode || reauthPending === 'email' || !newEmail.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isUpdatingEmail || isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isUpdatingEmail ? 'Updating...' : isSendingCode ? 'Sending...' : 'Update Email'}
                  </button>
                </div>
                {emailMsg && (
                  <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium animate-fade-in ${emailMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {emailMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {emailMsg.text}
                  </div>
                )}
                {reauthPending === 'email' && (
                  <div className="mt-3 border border-emerald-200 bg-emerald-50/40 rounded-md p-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-medium text-navy-base">
                      Enter the 6-digit code sent to your email to confirm it&apos;s really you.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={reauthToken}
                      onChange={(e) => setReauthToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      disabled={isVerifying}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow disabled:bg-gray-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmReauthAction}
                        disabled={isUpdatingEmail || isVerifying}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        {isUpdatingEmail || isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isVerifying ? 'Verifying...' : isUpdatingEmail ? 'Updating...' : 'Verify & Update Email'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startReauth('email')}
                        disabled={isSendingCode || isVerifying}
                        className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-bold py-2 px-5 rounded-md transition-colors border border-gray-300 flex items-center justify-center gap-2"
                      >
                        {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSendingCode ? 'Sending...' : 'Resend code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReauthPending(null); setReauthToken(''); setReauthMsg(null); setReauthSentAt(null); setReauthSendCount(0); }}
                        disabled={isVerifying}
                        className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-bold py-2 px-5 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Each resend invalidates the previous code — always use the newest email.
                    </p>
                    {reauthMsg && (
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${reauthMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {reauthMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {reauthMsg.text}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Password Section */}
              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newPassword.length > 0 && newPassword.length < 6 ? (
                    <span className="text-amber-600 font-medium">Password too short — minimum 6 characters.</span>
                  ) : newPassword.length >= 6 ? (
                    <span className="text-emerald-600 font-medium">Secure password</span>
                  ) : (
                    'Must be at least 6 characters.'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow"
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match.</p>
                )}
              </div>

              <div>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword || isSendingCode || reauthPending === 'password' || !newPassword.trim() || !confirmPassword.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2.5 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    {isUpdatingPassword || isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isUpdatingPassword ? 'Updating...' : isSendingCode ? 'Sending...' : 'Update Password'}
                  </button>
                {passwordMsg && (
                  <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium animate-fade-in ${passwordMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {passwordMsg.text}
                  </div>
                )}
                {reauthPending === 'password' && (
                  <div className="mt-3 border border-emerald-200 bg-emerald-50/40 rounded-md p-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-medium text-navy-base">
                      Enter the 6-digit code sent to your email to confirm it&apos;s really you.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={reauthToken}
                      onChange={(e) => setReauthToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      disabled={isVerifying}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-gray-900 transition-shadow disabled:bg-gray-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmReauthAction}
                        disabled={isUpdatingPassword || isVerifying}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        {isUpdatingPassword || isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isVerifying ? 'Verifying...' : isUpdatingPassword ? 'Updating...' : 'Verify & Update Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startReauth('password')}
                        disabled={isSendingCode || isVerifying}
                        className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-bold py-2 px-5 rounded-md transition-colors border border-gray-300 flex items-center justify-center gap-2"
                      >
                        {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSendingCode ? 'Sending...' : 'Resend code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReauthPending(null); setReauthToken(''); setReauthMsg(null); setReauthSentAt(null); setReauthSendCount(0); }}
                        disabled={isVerifying}
                        className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-bold py-2 px-5 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Each resend invalidates the previous code — always use the newest email.
                    </p>
                    {reauthMsg && (
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${reauthMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {reauthMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {reauthMsg.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Editor Modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          userId={userId}
          onClose={closeEditModal}
          onSaved={handleListingSaved}
        />
      )}

    </div>
  );
}
