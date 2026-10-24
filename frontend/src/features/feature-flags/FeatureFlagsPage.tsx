import React, { useEffect, useState } from 'react';
import { 
  ToggleLeft, 
  ToggleRight, 
  Flag, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Info
} from 'lucide-react';
import { api } from '../../lib/api';
import type { FeatureFlag } from '../../types';

export const FeatureFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.enterprise.getFeatureFlags();
      setFlags(res.flags || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load feature flags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flagKey: string, currentStatus: boolean) => {
    try {
      setUpdatingKey(flagKey);
      setError(null);
      const updated = await api.enterprise.toggleFeatureFlag(flagKey, !currentStatus);
      setFlags((prev) =>
        prev.map((f) => (f.flag_key === flagKey ? { ...f, is_enabled: updated.is_enabled } : f))
      );
      setSuccessMsg(`Feature flag "${flagKey}" is now ${!currentStatus ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || `Failed to update flag ${flagKey}`);
    } finally {
      setUpdatingKey(null);
    }
  };

  const getCategoryBadge = (key: string) => {
    if (key.includes('approval') || key.includes('policy')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">Governance</span>;
    }
    if (key.includes('explorer') || key.includes('evidence')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">Security</span>;
    }
    if (key.includes('scim') || key.includes('oidc')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">Integrations</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-50 text-slate-700 border border-slate-200">Core</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Feature Flags & Rollouts</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Managed
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gradual release controls and emergency circuit breakers across enterprise governance modules.
          </p>
        </div>
        <button
          onClick={fetchFlags}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">{successMsg}</div>
        </div>
      )}

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Backend Fail-Closed Guarantee: </strong>
          Disabling a feature flag here immediately cuts off both frontend UI availability and server-side API execution routes.
          All flag adjustments generate immutable audit trail entries with administrative actor context.
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
        {flags.length === 0 && !isLoading && (
          <div className="p-8 text-center text-sm text-slate-500">
            No feature flags registered in the system.
          </div>
        )}

        {flags.map((flag) => {
          const isPending = updatingKey === flag.flag_key;
          return (
            <div key={flag.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-slate-900 font-mono text-sm">{flag.flag_key}</span>
                  {getCategoryBadge(flag.flag_key)}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    flag.is_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {flag.is_enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {flag.description || 'Enterprise platform module feature toggle.'}
                </p>
                <div className="text-[11px] text-slate-400">
                  Last evaluated: {flag.updated_at ? new Date(flag.updated_at).toLocaleString() : 'System default'}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(flag.flag_key, flag.is_enabled)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    flag.is_enabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  } disabled:opacity-50`}
                >
                  {isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : flag.is_enabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
