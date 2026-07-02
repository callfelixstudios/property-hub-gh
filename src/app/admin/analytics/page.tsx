import { redirect } from 'next/navigation';
import { assertAdmin } from '@/utils/adminHelpers';
import { fetchMacroKPIs, fetchActiveAlerts } from '@/app/actions/analyticsActions';
import AlertCards from './AlertCards';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Network,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
} from 'lucide-react';

// Force dynamic so realtime metrics aren't statically cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsPage() {
  // Guard
  try {
    await assertAdmin();
  } catch {
    redirect('/');
  }

  const [kpis, alerts] = await Promise.all([
    fetchMacroKPIs(),
    fetchActiveAlerts(),
  ]);

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">System Nerve Center</h1>
        <p className="text-slate-400 mt-2">
          Real-time Macro KPIs and actionable alerts for platform operations.
        </p>
      </div>

      {/* KPI Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pillar 1: Infrastructure */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Network className="w-4 h-4" /> Infrastructure
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">System Uptime</p>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.systemUptime}%</p>
            <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Nominal
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">API Latency (avg)</p>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.apiLatencyMs}ms</p>
            <p className="text-slate-500 text-xs font-bold mt-2 flex items-center gap-1">
              Optimal response
            </p>
          </div>
        </div>

        {/* Pillar 2: Financial Ops */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Financial Ops
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">Gross Tx Vol (GTV)</p>
              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                MoMo + Card
              </span>
            </div>
            <p className="text-3xl font-black text-white">₵{kpis.gtv.toLocaleString()}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-slate-500 text-xs font-medium">
                Failure Rate: <span className="text-red-400 font-bold">{kpis.transactionFailureRate.toFixed(1)}%</span>
              </p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">Sub Retention</p>
              <UserCheck className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.subscriptionRetention.toFixed(1)}%</p>
            <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Healthy
            </p>
          </div>
        </div>

        {/* Pillar 3: Trust & Safety */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Trust & Safety
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">Verification Velocity</p>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.verificationVelocityHours}h</p>
            <p className="text-slate-500 text-xs font-bold mt-2 flex items-center gap-1">
              Avg queue time
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-400 text-sm font-medium">Fraud Escalations</p>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.fraudEscalationRate.toFixed(1)}%</p>
            <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Flagged listings
            </p>
          </div>
        </div>

      </div>

      <hr className="border-slate-800 my-8" />

      {/* Actionable Alerts System */}
      <AlertCards alerts={alerts} />
      
    </div>
  );
}
