import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { VerificationInspectionDrawer } from './InspectionDrawer';
import type { VerificationProfile } from './InspectionDrawer';
import { ClipboardCheck, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Verification Hub | Admin — Property Hub GH',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ghana_card: 'Ghana Card',
  business_registration: 'Business Registration',
  greda_license: 'GREDA License',
  grepa_license: 'GREPA License',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline' }> = {
  pending_review: { label: 'Pending Review', variant: 'secondary' },
  verified:       { label: 'Verified',        variant: 'success' },
  rejected:       { label: 'Rejected',        variant: 'destructive' },
  unverified:     { label: 'Unverified',      variant: 'outline' },
};

export default async function AdminVerificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email?.toLowerCase().endsWith('@propertyhubgh.com')) {
    redirect('/unauthorized');
  }

  const { data: requests, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email, membership_tier, verification_status, document_type, document_url, license_number, verification_submitted_at, rejection_reason, created_at')
    .in('verification_status', ['pending_review', 'rejected', 'verified'])
    .order('verification_submitted_at', { ascending: false });

  const profiles = (requests ?? []) as VerificationProfile[];

  // KPI counts
  const pendingCount = profiles.filter(p => p.verification_status === 'pending_review').length;
  const verifiedCount = profiles.filter(p => p.verification_status === 'verified').length;
  const rejectedCount = profiles.filter(p => p.verification_status === 'rejected').length;

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a] tracking-tight">Developer & Agency Verification Hub</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Vet corporate credentials, Ghana Cards, and manage professional tier escalations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-[#0d1b2a]">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Verified Profiles</p>
            <p className="text-2xl font-bold text-[#0d1b2a]">{verifiedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-[#0d1b2a]">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Failed to load verification queue:</strong> {error.message}</span>
        </div>
      )}

      {/* ── Queue Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Verification Queue</span>
          <span className="ml-auto text-xs text-slate-400 font-medium">{profiles.length} applicant{profiles.length !== 1 ? 's' : ''}</span>
        </div>

        {profiles.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No verification requests</p>
            <p className="text-xs text-slate-300 mt-1">Requests will appear here once agents submit their credentials.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>License / Reg. No.</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const statusCfg = STATUS_CONFIG[profile.verification_status ?? 'unverified'];
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[#0d1b2a] text-sm">{profile.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{profile.phone ?? profile.email ?? '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-md px-2 py-1">
                        {profile.document_type ? DOC_TYPE_LABELS[profile.document_type] : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600">
                        {profile.license_number || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {profile.verification_submitted_at
                          ? new Date(profile.verification_submitted_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm">Inspect Credentials</Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[480px] sm:w-[560px] flex flex-col">
                          <SheetHeader>
                            <SheetTitle>
                              Verify: {profile.full_name ?? 'Unknown'}
                            </SheetTitle>
                            <SheetDescription>
                              Cross-check corporate indices against GREDA/GREPA registers and approve or reject credentials.
                            </SheetDescription>
                          </SheetHeader>
                          <VerificationInspectionDrawer profile={profile} />
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
