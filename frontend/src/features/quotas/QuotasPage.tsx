import React, { useEffect, useState } from 'react';
import { 
  Database, 
  HardDrive, 
  Users, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Settings2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import type { TenantQuota } from '../../types';

export const QuotasPage: React.FC = () => {
  const [quotas, setQuotas] = useState<TenantQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [maxStorageGB, setMaxStorageGB] = useState<number>(10);
  const [maxUploadMB, setMaxUploadMB] = useState<number>(100);
  const [maxMembers, setMaxMembers] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.enterprise.getQuotas();
      setQuotas(res);
      setMaxStorageGB(Math.round(res.max_storage_bytes / (1024 * 1024 * 1024)));
      setMaxUploadMB(Math.round(res.max_upload_size_bytes / (1024 * 1024)));
      setMaxMembers(res.max_members);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenant quotas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.enterprise.updateQuotas({
        max_storage_bytes: maxStorageGB * 1024 * 1024 * 1024,
        max_upload_size_bytes: maxUploadMB * 1024 * 1024,
        max_members: maxMembers,
      });
      setQuotas(res);
      setIsEditing(false);
      setSuccessMsg('Tenant resource limits updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update quotas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateUsagePercent = (used: number, max: number): number => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const storagePercent = quotas 
    ? calculateUsagePercent(quotas.used_storage_bytes, quotas.max_storage_bytes) 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Usage & Quotas</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Enforcement
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time storage metering, upload caps, and organizational capacity safeguards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuotas}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
            {isEditing ? 'Cancel Edit' : 'Adjust Quotas'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">{successMsg}</div>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSaveQuotas} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Configure Tenant Resource Limits</h2>
          <p className="text-xs text-slate-500">
            Changes apply immediately to transactional uploads and tenant invitations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Total Storage (GB)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={maxStorageGB}
                onChange={(e) => setMaxStorageGB(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={maxUploadMB}
                onChange={(e) => setMaxUploadMB(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Members
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Apply Limits'}
            </button>
          </div>
        </form>
      )}

      {/* Meter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Storage Meter */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vault Storage</div>
                <div className="text-lg font-bold text-slate-900">
                  {quotas ? formatBytes(quotas.used_storage_bytes) : '...'}
                </div>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              storagePercent > 90 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              storagePercent > 75 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {storagePercent}% Used
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  storagePercent > 90 ? 'bg-rose-500' :
                  storagePercent > 75 ? 'bg-amber-500' :
                  'bg-blue-600'
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Used: {quotas ? formatBytes(quotas.used_storage_bytes) : '0 B'}</span>
              <span>Quota: {quotas ? formatBytes(quotas.max_storage_bytes) : '0 B'}</span>
            </div>
          </div>
        </div>

        {/* Upload File Cap */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max Upload Cap</div>
                <div className="text-lg font-bold text-slate-900">
                  {quotas ? formatBytes(quotas.max_upload_size_bytes) : '...'}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
              Per File
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Transactional gateway prevents oversized multipart or direct uploads from saturating network or storage pipelines.
          </p>
        </div>

        {/* Member Quota */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace Members</div>
                <div className="text-lg font-bold text-slate-900">
                  {quotas?.max_members || '...'} Seats
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Provisioning via invitation or SCIM 2.0 validates available seat capacity before activating tenant accounts.
          </p>
        </div>
      </div>

      {/* Storage Enforcement Architecture Box */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Pre-Upload Transactional Reservation Safeguard
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          TrustVault evaluates incoming document byte lengths against current tenant storage prior to file streaming.
          If an upload would breach the tenant limit, the request is rejected with HTTP 413 (Quota Exceeded) before
          storage resources are consumed. On aborted or failed uploads, reserved quotas are automatically rolled back.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-semibold text-slate-800 mb-0.5">Zero Silent Discard</div>
            <div>No data is silently purged or truncated when quota limits are met.</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-semibold text-slate-800 mb-0.5">Isolated Metering</div>
            <div>Tenant storage calculations are scoped strictly to authorized documents.</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-semibold text-slate-800 mb-0.5">Immediate Reconciliation</div>
            <div>Deleting a document version immediately releases storage capacity back to the tenant.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
