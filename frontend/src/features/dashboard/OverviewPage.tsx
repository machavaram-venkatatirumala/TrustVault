import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Files,
  Users,
  Share2,
  KeyRound,
  ShieldAlert,
  Upload,
  UserPlus,
  ShieldCheck,
  ArrowUpRight,
  FolderOpen,
  Search,
  HardDrive,
  Lock,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Image,
  FileCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { ActivityChart } from '../../components/dashboard/ActivityChart';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { formatDate, formatRelativeTime, formatBytes } from '../../lib/formatters';
import { AppShellContext } from '../../components/layout/AppShell';

export function OverviewPage() {
  const { user, organization, role, isAdmin } = useAuth();
  const context = useOutletContext<AppShellContext>();
  const [days, setDays] = useState(7);

  // Fetch real summary metrics
  const { data: summaryData, refetch: refetchSummary, isFetching: isFetchingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.dashboard.getSummary(),
  });

  // Fetch real activity telemetry with days parameter
  const { data: activityData, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboard', 'activity', days],
    queryFn: () => api.dashboard.getActivity(days),
  });

  // Fetch recent audit logs for recent activity table
  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => (isAdmin ? api.audit.list({ page: 1, per_page: 6 }) : Promise.resolve(null)),
    enabled: isAdmin,
  });

  const metrics = summaryData?.metrics || {
    total_documents: 0,
    active_members: 0,
    shared_documents: 0,
    active_permissions: 0,
    recent_security_events: 0,
    verified_count: 0,
    mismatch_count: 0,
    total_storage_bytes: 0,
    storage_quota_bytes: 1024 * 1024 * 1024,
    remaining_storage_bytes: 1024 * 1024 * 1024,
    storage_by_type: {},
  };

  const activity = activityData?.activity || [];
  const recentEvents = auditData?.events || [];

  const handleRefreshAll = () => {
    refetchSummary();
    refetchActivity();
    if (isAdmin) refetchAudit();
  };

  const usedStorageBytes = metrics.total_storage_bytes || 0;
  const quotaBytes = metrics.storage_quota_bytes || 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((usedStorageBytes / quotaBytes) * 100));

  const storageByType = metrics.storage_by_type || {};

  return (
    <div className="space-y-6">
      {/* 1. Personalized Greeting Banner with Real Security Posture Status */}
      <div className="rounded-large border border-border bg-white shadow-card p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral" className="bg-surface-subtle text-text-secondary border-border font-medium">
                {organization?.name || 'Workspace'}
              </Badge>
              <Badge variant="neutral" className="capitalize text-text-muted text-[10px] font-bold">
                {role} Access
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
              Welcome back, {user?.full_name || 'Member'}
            </h2>

            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              Real-time operational dashboard backed by genuine database records. Monitor document inventory, cryptographic integrity fingerprints, and access grants.
            </p>

            {/* Real Security Posture Status Pill */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              {metrics.mismatch_count > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/15 text-coral border border-coral/30 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-coral" />
                  <span>Security Attention Required: {metrics.mismatch_count} Integrity Mismatch(es)</span>
                </div>
              ) : metrics.total_documents > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/15 text-emerald border border-emerald/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                  <span>Cryptographic Posture Secure: All {metrics.verified_count} Active Documents Intact</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle text-text-muted border border-border text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Zero Documents Uploaded • Vault Storage Initialized</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => context?.openUploadModal?.()}
              className="gap-1.5 text-xs bg-primary hover:bg-primary-hover text-white shadow-subtle font-bold"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Button>

            {isAdmin && (
              <Link to="/app/members">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                  <UserPlus className="w-3.5 h-3.5 text-teal" />
                  <span>Invite Member</span>
                </Button>
              </Link>
            )}

            <button
              onClick={() => context?.openCommandPalette?.()}
              className="p-2 rounded-medium border border-border bg-surface-subtle hover:bg-white text-text-secondary hover:text-text-primary transition-colors text-xs flex items-center gap-1.5"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline font-mono text-[10px]">Ctrl+K</span>
            </button>

            <button
              onClick={handleRefreshAll}
              disabled={isFetchingSummary}
              className="p-2 rounded-medium border border-border bg-surface-subtle hover:bg-white text-text-secondary hover:text-text-primary transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSummary ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Metric Cards with Distinct Accent Colors & Click-through Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Documents"
          value={metrics.total_documents}
          description="Confidential files in vault"
          icon={Files}
          iconColor="text-lavender"
          iconBg="bg-lavender/15"
          to="/app/documents"
          trendText="Not enough historical data"
        />

        <MetricCard
          label="Shared Documents"
          value={`${metrics.shared_documents} (${metrics.active_permissions} grants)`}
          description="Files with active grants"
          icon={Share2}
          iconColor="text-teal"
          iconBg="bg-teal/15"
          to="/app/sharing"
          trendText="Not enough historical data"
        />

        <MetricCard
          label="Workspace Members"
          value={`${metrics.active_members} active`}
          description="Authorized collaborators"
          icon={Users}
          iconColor="text-amber"
          iconBg="bg-amber/15"
          to="/app/members"
          trendText="Not enough historical data"
        />

        <MetricCard
          label="Security Events (24h)"
          value={metrics.recent_security_events}
          description="Immutable audit trail logs"
          icon={ShieldAlert}
          iconColor={metrics.mismatch_count > 0 ? 'text-coral' : 'text-emerald'}
          iconBg={metrics.mismatch_count > 0 ? 'bg-coral/15' : 'bg-emerald/15'}
          to="/app/audit"
          trendText="Not enough historical data"
        />
      </div>

      {/* Empty Vault State Notice if 0 files */}
      {metrics.total_documents === 0 && (
        <div className="p-6 rounded-large bg-white border border-primary/20 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-text-primary">No documents yet</h3>
              <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                Your secure document library starts here. Upload your first document to calculate its cryptographic SHA-256 fingerprint and manage authorized permissions.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => context?.openUploadModal?.()}
            className="gap-1.5 text-xs shrink-0 shadow-subtle bg-primary text-white font-bold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your First File</span>
          </Button>
        </div>
      )}

      {/* 3. Interactive Telemetry Chart & Real Storage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityChart
          data={activity}
          days={days}
          onDaysChange={(newDays) => setDays(newDays)}
        />

        {/* Real Storage Breakdown Panel */}
        <Card className="lg:col-span-1 flex flex-col justify-between border-border bg-white shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-lavender" />
              <span>Storage Overview</span>
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Real storage consumption calculated from stored document bytes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">
                  {formatBytes(usedStorageBytes)} used
                </span>
                <span className="text-text-muted">
                  of {formatBytes(quotaBytes)} quota
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden flex border border-border">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(usedStorageBytes > 0 ? 3 : 0, storagePercent)}%` }}
                />
              </div>

              <p className="text-[11px] text-text-muted flex items-center justify-between">
                <span>{storagePercent}% capacity utilized</span>
                <span>{formatBytes(metrics.remaining_storage_bytes || 0)} available</span>
              </p>
            </div>

            {/* Storage Distribution by Document Type */}
            <div className="space-y-2.5 pt-3 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Document Type Breakdown
              </p>

              {Object.keys(storageByType).length === 0 || usedStorageBytes === 0 ? (
                <p className="text-xs text-text-muted py-2">
                  No storage distribution data available yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(storageByType).map(([key, item]) => {
                    if (item.count === 0) return null;
                    const getIcon = () => {
                      if (key === 'pdf') return <FileText className="w-3.5 h-3.5 text-coral" />;
                      if (key === 'spreadsheets') return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald" />;
                      if (key === 'images') return <Image className="w-3.5 h-3.5 text-lavender" />;
                      return <FileCode className="w-3.5 h-3.5 text-primary" />;
                    };

                    return (
                      <div key={key} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          {getIcon()}
                          <span className="text-text-primary font-medium">{item.label}</span>
                          <span className="text-[10px] text-text-muted font-mono">({item.count})</span>
                        </div>
                        <span className="font-bold text-text-primary font-mono">
                          {formatBytes(item.bytes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 rounded-medium bg-surface-subtle border border-border text-[11px] text-text-secondary flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
              <span>
                Files are stored in private isolated storage with opaque UUID keys outside the web root.
              </span>
            </div>
          </CardContent>

          <div className="p-5 pt-0">
            <Link to="/app/documents" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                Explore All Documents
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 4. Recent Activity Panel (Admin Authorized) */}
      {isAdmin && (
        <Card className="border-border bg-white shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">Recent Security & Activity Trail</CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Verifiable audit events recorded in real-time.
              </CardDescription>
            </div>
            <Link
              to="/app/audit"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Explore Audit Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentEvents.length === 0 ? (
              <p className="p-8 text-center text-xs text-text-muted">
                No activity recorded yet — Security events will appear here as actions occur in your workspace.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Action</TableHead>
                    <TableHead className="text-xs font-bold">Actor</TableHead>
                    <TableHead className="text-xs font-bold">Resource</TableHead>
                    <TableHead className="text-xs font-bold">Outcome</TableHead>
                    <TableHead className="text-xs font-bold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-text-primary">
                        {event.action}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-text-primary">
                        {event.actor_name || 'System / Automated'}
                      </TableCell>
                      <TableCell className="text-xs capitalize text-text-secondary">
                        {event.resource_type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.outcome === 'success' ? 'success' : 'danger'}
                          className="text-[10px] font-bold"
                        >
                          {event.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">
                        {formatRelativeTime(event.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
