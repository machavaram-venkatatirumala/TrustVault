import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Clock,
  History,
  Lock,
  Sparkles,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SecurityPolicy, PolicyExecutionLog } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function PoliciesPage() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [logs, setLogs] = useState<PolicyExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'simulator' | 'logs'>('policies');

  // Simulator State
  const [simAction, setSimAction] = useState('share_external');
  const [simClassification, setSimClassification] = useState('Restricted');
  const [simPermLevel, setSimPermLevel] = useState('view');
  const [simResult, setSimResult] = useState<{
    decision: string;
    reason: string;
    policy_name: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Maintenance runner state
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [polRes, logsRes] = await Promise.all([
        api.policies.list(),
        api.policies.getLogs(50),
      ]);
      setPolicies(polRes.policies || []);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePolicy = async (id: string, currentEnabled: boolean) => {
    try {
      const updated = await api.policies.toggle(id, !currentEnabled);
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_enabled: updated.is_enabled } : p))
      );
      success(updated.is_enabled ? 'Policy enabled successfully.' : 'Policy disabled.');
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle policy.');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await api.policies.simulate({
        action: simAction,
        document_classification: simClassification,
        is_external: simAction === 'share_external',
        permission_level: simPermLevel,
      });
      setSimResult(res);
      success('Policy simulation executed.');
    } catch (err: any) {
      toastError(err.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunMaintenance = async () => {
    setIsCleaning(true);
    setCleanMessage(null);
    try {
      const res = await api.policies.runMaintenance();
      setCleanMessage(
        `Maintenance Completed: ${res.revoked_count} expired access grants were automatically marked as revoked.`
      );
      success(`Maintenance completed: ${res.revoked_count} expired grants revoked.`);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to run maintenance.');
    } finally {
      setIsCleaning(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'allow':
        return 'bg-emerald/15 text-emerald border-emerald/30';
      case 'deny':
        return 'bg-coral/15 text-coral border-coral/30';
      case 'require_approval':
        return 'bg-amber/15 text-amber border-amber/30';
      case 'require_justification':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-medium bg-primary/10 text-primary">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Policy Automation Engine
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Deterministic server-side compliance guardrails for document access, classification, approval enforcement, and automatic grant expiration.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleRunMaintenance}
            disabled={isCleaning}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-border rounded-medium text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-all shadow-xs"
          >
            <RotateCcw className={cn('w-3.5 h-3.5 text-primary', isCleaning && 'animate-spin')} />
            {isCleaning ? 'Running Cleaner...' : 'Run Scheduled Expiration Cleaner'}
          </button>
        )}
      </div>

      {cleanMessage && (
        <div className="p-3 bg-emerald/10 border border-emerald/20 rounded-medium text-emerald text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{cleanMessage}</span>
          </div>
          <button onClick={() => setCleanMessage(null)} className="text-emerald hover:underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('policies')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'policies'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Active Guardrails ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'simulator'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Policy Simulator & Test Bench
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <History className="w-4 h-4" />
          Execution Audit Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: Active Guardrails */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className={cn(
                  'bg-white border rounded-large p-4 shadow-xs flex flex-col justify-between transition-all',
                  pol.is_enabled ? 'border-border' : 'border-border/60 opacity-60'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Priority {pol.priority}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleTogglePolicy(pol.id, pol.is_enabled)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors',
                          pol.is_enabled
                            ? 'bg-emerald/10 text-emerald border-emerald/30'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        )}
                      >
                        {pol.is_enabled ? 'Enforced' : 'Disabled'}
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-text-primary mb-1">{pol.name}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    {pol.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <span>Type: {pol.policy_type}</span>
                  <span>Deterministic: Yes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Policy Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white border border-border rounded-large p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Policy Evaluation Test Bench</h3>
            <p className="text-xs text-text-secondary mt-1">
              Preview the deterministic policy decision for an access or sharing action before submitting it to production.
            </p>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Target Action</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="share_external">External Sharing Grant (Client/Vendor)</option>
                  <option value="share_internal">Internal Workspace Share</option>
                  <option value="document_download">Document Download</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Document Classification</label>
                <select
                  value={simClassification}
                  onChange={(e) => setSimClassification(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">Permission Level</label>
              <select
                value={simPermLevel}
                onChange={(e) => setSimPermLevel(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="view">View Only</option>
                <option value="download">Download</option>
                <option value="manage">Manage (Elevated)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="px-4 py-2 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSimulating ? 'Evaluating...' : 'Simulate Policy Decision'}
            </button>
          </form>

          {simResult && (
            <div className="p-4 bg-surface-subtle border border-border rounded-large space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Evaluation Outcome
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider',
                    getDecisionBadge(simResult.decision)
                  )}
                >
                  {simResult.decision.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-medium text-text-primary">{simResult.reason}</p>
                <p className="text-[11px] text-text-muted">
                  Enforced By: <span className="font-semibold">{simResult.policy_name}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Execution Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-border rounded-large shadow-xs overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <History className="w-8 h-8 mx-auto mb-2 text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">No policy execution logs recorded yet</p>
              <p className="text-xs text-text-secondary mt-1">
                Policy decisions made during sharing and upload operations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Policy</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Enforcement Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-2.5 px-4 text-text-muted text-[11px] font-mono">
                        {new Date(log.executed_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-text-primary">{log.policy_name}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-text-secondary">{log.action}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border uppercase',
                            getDecisionBadge(log.decision)
                          )}
                        >
                          {log.decision}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-text-primary">{log.actor_name}</div>
                        <div className="text-[10px] text-text-muted">{log.actor_email}</div>
                      </td>
                      <td className="py-2.5 px-4 text-text-secondary max-w-xs truncate" title={log.reason || ''}>
                        {log.reason || 'Guardrail validated'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
