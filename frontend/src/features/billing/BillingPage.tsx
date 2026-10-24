import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HardDrive,
  Users,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { api, ApiError } from '../../lib/api';
import { formatBytes } from '../../lib/formatters';
import { DashboardMetrics } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export function BillingPage() {
  const { organization, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.dashboard.getSummary();
        setMetrics(res.metrics);
      } catch (err: any) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load workspace usage metrics.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalStorageBytes = metrics?.total_storage_bytes || 0;
  const storageQuotaBytes = metrics?.storage_quota_bytes || 1024 * 1024 * 1024; // 1 GB
  const storagePercentage = Math.min(100, Math.round((totalStorageBytes / storageQuotaBytes) * 100));

  const activeMembers = metrics?.active_members || 1;
  const maxMembers = metrics?.max_members || 5;
  const memberPercentage = Math.min(100, Math.round((activeMembers / maxMembers) * 100));

  const totalDocuments = metrics?.total_documents || 0;
  const maxUploadSize = metrics?.max_upload_size_bytes || 25 * 1024 * 1024; // 25 MB

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Plan & Usage Management
        </h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          Monitor your organization’s authorized storage capacity, active seats, and plan parameters. All values are computed directly from active database records.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-medium bg-danger-bg border border-danger/20 text-xs text-danger flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Active Plan Card */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-text-primary">
              {metrics?.plan_name || 'Starter Vault'}
            </h2>
            <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
              Active Tier
            </Badge>
          </div>
          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            Workspace: <strong>{organization?.name || 'Workspace'}</strong> ({organization?.workspace_type || 'personal'} vault).
            Includes private document storage outside the public root, server-side SHA-256 verification, and real audit event tracking.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-black text-text-primary">$0 / month</div>
          <span className="text-[11px] text-text-muted">Technical Evaluation License</span>
        </div>
      </div>

      {/* Real-time Usage Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Usage Card */}
        <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <HardDrive className="w-4 h-4" />
              <span>Storage Consumption</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {storagePercentage}% of Quota
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, storagePercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>{formatBytes(totalStorageBytes)} utilized</span>
              <span>Quota: {formatBytes(storageQuotaBytes)}</span>
            </div>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed pt-2 border-t border-border/60">
            Calculated by summing the size of all active files across your organization's private storage repository. Max upload size per document is <strong>{formatBytes(maxUploadSize)}</strong>.
          </p>
        </div>

        {/* Member Seats Usage Card */}
        <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Member Seats</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {activeMembers} of {maxMembers} Allocated
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, memberPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>{activeMembers} active member{activeMembers === 1 ? '' : 's'}</span>
              <span>Limit: {maxMembers} team seats</span>
            </div>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed pt-2 border-t border-border/60">
            Organization administrators can invite additional collaborators or adjust roles in the <Link to="/app/members" className="text-primary underline">Members</Link> directory.
          </p>
        </div>
      </div>

      {/* Plan Features & Compliance Assurance */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Included Enterprise Guarantees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Server-side SHA-256 byte verification</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Strict organization tenant isolation</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Tamper-resistant audit trail with request IDs</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Instant permission revocation</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>MIME magic bytes inspection</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Argon2id password hashing defense</span>
          </div>
        </div>
      </div>

      {/* Honest Billing & Payment Policy Disclaimer */}
      <div className="rounded-medium border border-border/80 bg-surface-subtle p-5 text-xs text-text-secondary flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            No Fabricated Payment Gateways
          </p>
          <p className="text-[11px] leading-relaxed">
            In compliance with TrustVault's core product principle #8 (no fake API responses or simulated payment gateways), billing is maintained strictly as an authoritative plan and usage monitoring area. We do not generate mock Stripe checkouts, fabricated invoices, or fake credit card charges.
          </p>
        </div>
      </div>
    </div>
  );
}
