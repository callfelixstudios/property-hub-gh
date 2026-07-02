'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  UserX,
  FileSearch,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
} from 'lucide-react';
import { SystemAlert, resolveAlert, triggerSimulatedAlert } from '@/app/actions/analyticsActions';
import { createClient } from '@/utils/supabase/client';
import { useEffect } from 'react';

interface AlertCardsProps {
  alerts: SystemAlert[];
}

export default function AlertCards({ alerts }: AlertCardsProps) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to any changes on the system_alerts table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_alerts' },
        (payload) => {
          // Force a router refresh to fetch the latest alerts server-side
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_alerts' },
        (payload) => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleResolve = async (alertId: string, action: string) => {
    try {
      setResolvingId(alertId);
      await resolveAlert(alertId, action);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  const handleSimulate = async (category: SystemAlert['category']) => {
    try {
      setSimulating(category);
      await triggerSimulatedAlert(category);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to simulate alert');
    } finally {
      setSimulating(null);
    }
  };

  const getAlertStyles = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/5';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/5';
      default:
        return 'border-slate-700 bg-slate-800/50';
    }
  };

  const getAlertIcon = (category: SystemAlert['category'], severity: SystemAlert['severity']) => {
    const color =
      severity === 'critical'
        ? 'text-red-500'
        : severity === 'high'
        ? 'text-orange-500'
        : severity === 'medium'
        ? 'text-yellow-500'
        : 'text-blue-500';

    switch (category) {
      case 'payment_gateway':
        return <CreditCard className={`w-6 h-6 ${color}`} />;
      case 'fraud_anomaly':
        return <UserX className={`w-6 h-6 ${color}`} />;
      case 'verification_bottleneck':
        return <Activity className={`w-6 h-6 ${color}`} />;
      case 'audit_log_drift':
        return <ShieldAlert className={`w-6 h-6 ${color}`} />;
      default:
        return <AlertTriangle className={`w-6 h-6 ${color}`} />;
    }
  };

  const renderActionButtons = (alert: SystemAlert) => {
    const isResolving = resolvingId === alert.id;

    if (alert.category === 'payment_gateway') {
      return (
        <button
          onClick={() => handleResolve(alert.id, 'Rerouted payments to backup gateway')}
          disabled={isResolving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
        >
          {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Reroute Payments
        </button>
      );
    }
    
    if (alert.category === 'fraud_anomaly') {
      return (
        <button
          onClick={() => handleResolve(alert.id, 'Froze developer account & quarantined listings')}
          disabled={isResolving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 rounded-md transition-colors"
        >
          {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
          Freeze Account
        </button>
      );
    }

    if (alert.category === 'audit_log_drift') {
      return (
        <button
          onClick={() => handleResolve(alert.id, 'Locked compromised admin account & notified CTO')}
          disabled={isResolving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
        >
          {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          View Audit Trail & Lock
        </button>
      );
    }

    return (
      <button
        onClick={() => handleResolve(alert.id, 'Acknowledged and addressed manually')}
        disabled={isResolving}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-md transition-colors"
      >
        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Acknowledge
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Simulation Controls */}
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          Test Automated Protocols
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulate('payment_gateway')}
            disabled={!!simulating}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex items-center gap-2"
          >
            {simulating === 'payment_gateway' && <Loader2 className="w-3 h-3 animate-spin" />}
            Simulate Gateway Failure
          </button>
          <button
            onClick={() => handleSimulate('fraud_anomaly')}
            disabled={!!simulating}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex items-center gap-2"
          >
            {simulating === 'fraud_anomaly' && <Loader2 className="w-3 h-3 animate-spin" />}
            Simulate Fraud Spike
          </button>
          <button
            onClick={() => handleSimulate('audit_log_drift')}
            disabled={!!simulating}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex items-center gap-2"
          >
            {simulating === 'audit_log_drift' && <Loader2 className="w-3 h-3 animate-spin" />}
            Simulate Audit Drift
          </button>
        </div>
      </div>

      {/* Active Alerts List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Active Actionable Alerts</span>
          <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-700">
            {alerts.length} Pending
          </span>
        </h3>

        {alerts.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-slate-300 font-medium">All Systems Nominal</p>
            <p className="text-slate-500 text-sm mt-1">No active alerts require mitigation.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${getAlertStyles(
                  alert.severity
                )} flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden`}
              >
                {alert.severity === 'critical' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />
                )}
                {alert.severity === 'high' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                )}

                <div className="flex gap-4 items-start pl-2">
                  <div className="mt-1">{getAlertIcon(alert.category, alert.severity)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-bold text-base">{alert.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          alert.severity === 'critical'
                            ? 'bg-red-500/20 text-red-500'
                            : alert.severity === 'high'
                            ? 'bg-orange-500/20 text-orange-500'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{alert.message}</p>
                    <p className="text-slate-500 text-xs mt-2 font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 pl-2 md:pl-0">
                  {renderActionButtons(alert)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
