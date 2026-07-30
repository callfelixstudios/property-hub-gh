'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';

// Types
export interface MacroKPIs {
  webhookSuccessRate: number;
  apiLatencyMs: number;
  systemUptime: number;
  gtv: number;
  transactionFailureRate: number;
  subscriptionRetention: number;
  verificationVelocityHours: number;
  fraudEscalationRate: number;
  reporterToActionRatio: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  category: 'payment_gateway' | 'fraud_anomaly' | 'verification_bottleneck' | 'audit_log_drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  action_taken?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

// In a real system, these would be complex aggregations across multiple tables.
// For Phase 5, we mix real queries with intelligent stubs where the sub-systems (like user reports) aren't built yet.
export async function fetchMacroKPIs(): Promise<MacroKPIs> {
  const { supabase } = await assertAdmin();

// 1. Financial Operations (Real data from payment_transactions)
  // Get all transactions
  const { data: txs } = await supabase.from('payment_transactions').select('amount_ghs, status');

  const gtv = txs?.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + Number(tx.amount_ghs || 0), 0) || 0;
  const txFailures = txs?.filter((tx) => tx.status === 'failed').length || 0;
  const totalTxs = txs?.length || 0;

  const transactionFailureRate = totalTxs > 0 ? (txFailures / totalTxs) * 100 : 0;

  // Webhook success rate (Derived from transaction states as a proxy)
  const webhookSuccessRate = totalTxs > 0 ? ((totalTxs - txFailures) / totalTxs) * 100 : 100;

  // Subscription Retention
  const { count: activeSubs } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
    
  const { count: allSubs } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true });

  const subscriptionRetention = allSubs && allSubs > 0 ? ((activeSubs || 0) / allSubs) * 100 : 100;

  // 2. Trust, Safety & Verification
  // Velocity: check how many are pending vs total
  const { count: pendingProfiles } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending_review');

  const { count: flaggedListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'flagged');

  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  const fraudEscalationRate = totalListings && totalListings > 0 ? ((flaggedListings || 0) / totalListings) * 100 : 0;

  // Simulated metrics for systems not yet built
  const apiLatencyMs = 245; // Simulated ping
  const systemUptime = 99.99;
  const verificationVelocityHours = pendingProfiles && pendingProfiles > 50 ? 48 : 12; // Spike if queue is long
  const reporterToActionRatio = 85.5;

  return {
    webhookSuccessRate,
    apiLatencyMs,
    systemUptime,
    gtv,
    transactionFailureRate,
    subscriptionRetention,
    verificationVelocityHours,
    fraudEscalationRate,
    reporterToActionRatio,
  };
}

export async function fetchActiveAlerts(): Promise<SystemAlert[]> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }

  return data as SystemAlert[];
}

export async function resolveAlert(alertId: string, actionTaken: string) {
  const { supabase, user } = await assertAdmin();

  // Get alert details for audit log
  const { data: alert } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (!alert) throw new Error('Alert not found');

  const { data: resolvedAlert, error } = await supabase
    .from('system_alerts')
    .update({
      status: 'resolved',
      action_taken: actionTaken,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw new Error(`Failed to resolve alert: ${error.message}`);

  // Log to immutable audit logs
  await logAdminAction(
    supabase,
    user.id,
    'SYSTEM_ALERT_RESOLVED',
    alertId,
    { status: 'active' },
    { status: 'resolved', action_taken: actionTaken }
  );

  revalidatePath('/admin/analytics');
  return { success: true, data: resolvedAlert };
}

export async function triggerSimulatedAlert(category: 'payment_gateway' | 'fraud_anomaly' | 'verification_bottleneck' | 'audit_log_drift') {
  const { supabase } = await assertAdmin();

  const templates = {
    payment_gateway: {
      title: 'Payment Gateway Anomaly Detected',
      message: 'MoMo webhook failure rate exceeded 5% within the last 10 minutes. 14 transactions dropped.',
      severity: 'critical' as const,
    },
    fraud_anomaly: {
      title: 'Suspicious Listing Velocity',
      message: 'Developer account "DevPrime" uploaded 8 listings in under 3 minutes.',
      severity: 'high' as const,
    },
    verification_bottleneck: {
      title: 'Verification Queue Overflow',
      message: 'There are currently 54 profiles pending review. Wait time exceeds 24 hours.',
      severity: 'medium' as const,
    },
    audit_log_drift: {
      title: 'Unauthorized Schema Modification Attempt',
      message: 'Detected unrecognized alter table command targeting admin_audit_logs from IP 192.168.1.45',
      severity: 'critical' as const,
    },
  };

  const template = templates[category];

  const { error } = await supabase.from('system_alerts').insert({
    category,
    title: template.title,
    message: template.message,
    severity: template.severity,
    status: 'active',
  });

  if (error) throw new Error(`Failed to simulate alert: ${error.message}`);

  revalidatePath('/admin/analytics');
  return { success: true };
}
