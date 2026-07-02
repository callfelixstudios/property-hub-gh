'use client';

import { useState, useTransition } from 'react';
import { approveVerification, rejectVerification, getSecureDocumentUrl } from '@/app/actions/verificationActions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export interface VerificationProfile {
  id: string;
  full_name: string | null;
  contact_phone: string | null;
  email: string | null;
  company_name?: string | null;
  membership_tier: string | null;
  verification_status: 'unverified' | 'pending_review' | 'verified' | 'rejected' | null;
  document_type: 'ghana_card' | 'business_registration' | 'greda_license' | 'grepa_license' | null;
  document_url: string | null;
  license_number: string | null;
  verification_submitted_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ghana_card: 'Ghana Card',
  business_registration: 'Business Registration',
  greda_license: 'GREDA License',
  grepa_license: 'GREPA License',
};

export function VerificationInspectionDrawer({ profile }: { profile: VerificationProfile }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isFetchingDoc, setIsFetchingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleViewDocument = async () => {
    if (!profile.document_url) return;
    setIsFetchingDoc(true);
    setDocError(null);
    try {
      const url = await getSecureDocumentUrl(profile.document_url);
      setSignedUrl(url);
    } catch (e) {
      setDocError((e as Error).message);
    } finally {
      setIsFetchingDoc(false);
    }
  };

  const handleApprove = () => {
    setActionError(null);
    startTransition(async () => {
      try {
        await approveVerification(profile.id);
        setActionSuccess('Profile approved and tier escalated to Developer.');
      } catch (e) {
        setActionError((e as Error).message);
      }
    });
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) return;
    setActionError(null);
    startTransition(async () => {
      try {
        await rejectVerification(profile.id, rejectionNote.trim());
        setActionSuccess('Verification rejected and applicant notified.');
        setShowRejectForm(false);
      } catch (e) {
        setActionError((e as Error).message);
      }
    });
  };

  const isAlreadyProcessed =
    profile.verification_status === 'verified' || profile.verification_status === 'rejected';

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

      {/* ── Applicant Profile Card ── */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-bold text-[#0d1b2a]">
              {profile.company_name || profile.full_name || 'Unknown Applicant'}
            </p>
            {profile.company_name && profile.full_name && (
              <p className="text-sm text-slate-500 mt-0.5">{profile.full_name}</p>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
            {profile.membership_tier || 'free'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
            <p className="text-slate-700 font-medium">{profile.contact_phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
            <p className="text-slate-700 font-medium break-all">{profile.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Document Type</p>
            <p className="text-slate-700 font-medium">
              {profile.document_type ? DOC_TYPE_LABELS[profile.document_type] : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">License / Reg. No.</p>
            <p className="font-mono text-slate-700 font-medium">{profile.license_number || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Submitted</p>
            <p className="text-slate-700 font-medium">
              {profile.verification_submitted_at
                ? new Date(profile.verification_submitted_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Rejection Reason (if previously rejected) ── */}
      {profile.verification_status === 'rejected' && profile.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Previous Rejection Reason
          </p>
          <p className="text-sm text-red-700">{profile.rejection_reason}</p>
        </div>
      )}

      {/* ── Secure Document Viewer ── */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Verification Document
        </p>

        {!profile.document_url ? (
          <div className="bg-slate-100 rounded-xl p-6 text-center text-slate-400 text-sm">
            No document uploaded by applicant.
          </div>
        ) : signedUrl ? (
          <div className="space-y-2">
            {/* Inline preview for images */}
            {signedUrl.includes('.pdf') ? (
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                <ExternalLink className="w-4 h-4" /> Open PDF Document
              </a>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signedUrl}
                  alt="Verification document"
                  className="w-full object-contain max-h-80"
                />
              </div>
            )}
            <p className="text-xs text-slate-400">⏱ This link expires in 15 minutes.</p>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDocument}
            disabled={isFetchingDoc}
          >
            {isFetchingDoc ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating secure link…</>
            ) : (
              <><FileText className="w-3.5 h-3.5" /> View Secure Document</>
            )}
          </Button>
        )}

        {docError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {docError}
          </p>
        )}
      </div>

      {/* ── Success / Error Banners ── */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {actionError}
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!isAlreadyProcessed && !actionSuccess && (
        <div className="border-t border-slate-100 pt-5 space-y-3">
          {!showRejectForm ? (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Approve & Escalate</>
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 mb-1 block">Rejection Reason *</span>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g., Expired GREDA membership license number. Please re-upload a current certificate."
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d1b2a]/20 focus:border-[#0d1b2a] resize-none transition-all"
                />
              </label>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="md"
                  onClick={handleReject}
                  disabled={isPending || !rejectionNote.trim()}
                  className="flex-1"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Confirm Rejection</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => { setShowRejectForm(false); setRejectionNote(''); }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already processed — show read-only status */}
      {isAlreadyProcessed && !actionSuccess && (
        <div className="border-t border-slate-100 pt-5">
          <div className={`rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${
            profile.verification_status === 'verified'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {profile.verification_status === 'verified' ? (
              <><CheckCircle2 className="w-4 h-4" /> This profile has already been verified.</>
            ) : (
              <><XCircle className="w-4 h-4" /> This profile was previously rejected.</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
