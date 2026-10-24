import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { ActivityChart } from '../../components/dashboard/ActivityChart';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { UploadModal } from '../../components/documents/UploadModal';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { formatDate, formatRelativeTime } from '../../lib/formatters';

export function OverviewPage() {
  const { organization, isAdmin } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch real summary metrics
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.dashboard.getSummary(),
  });

  // Fetch real 7-day activity telemetry
  const { data: activityData, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.dashboard.getActivity(),
  });

  // Fetch recent audit logs for recent activity table
  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => (isAdmin ? api.audit.list({ page: 1, per_page: 5 }) : Promise.resolve(null)),
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
  };

  const activity = activityData?.activity || [];
  const recentEvents = auditData?.events || [];

  const handleRefreshAll = () => {
    refetchSummary();
    refetchActivity();
    if (isAdmin) refetchAudit();
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Workspace Overview
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Operational telemetry, cryptographic integrity status, and active access grants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5 text-xs shadow-subtle">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </Button>
          {isAdmin && (
            <Link to="/app/members">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* When genuinely empty library, show intentional empty state card */}
      {metrics.total_documents === 0 && (
        <div className="p-6 rounded-large bg-white dark:bg-elevated border border-primary/20 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-text-primary">No documents yet</h3>
              <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                Your secure document library starts here. Upload your first document to calculate its integrity fingerprint and manage access.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5 text-xs shrink-0 shadow-subtle">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your First File</span>
          </Button>
        </div>
      )}

      {/* 5 Real DB-Calculated Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Documents"
          value={metrics.total_documents}
          description="Active confidential records"
          icon={Files}
          iconColor="text-primary"
          iconBg="bg-primary-soft"
        />

        <MetricCard
          label="Active Members"
          value={metrics.active_members}
          description="Workspace collaborators"
          icon={Users}
          iconColor="text-accent-ink"
          iconBg="bg-surface-blue"
        />

        <MetricCard
          label="Shared Documents"
          value={metrics.shared_documents}
          description="Files with active grants"
          icon={Share2}
          iconColor="text-info"
          iconBg="bg-info-bg"
        />

        <MetricCard
          label="Active Grants"
          value={metrics.active_permissions}
          description="Enforced access permissions"
          icon={KeyRound}
          iconColor="text-accent-blue"
          iconBg="bg-accent-periwinkle/30"
        />

        <MetricCard
          label="24h Security Events"
          value={metrics.recent_security_events}
          description="Audit trail events logged"
          icon={ShieldAlert}
          iconColor={metrics.mismatch_count > 0 ? 'text-danger' : 'text-success'}
          iconBg={metrics.mismatch_count > 0 ? 'bg-danger-bg' : 'bg-success-bg'}
        />
      </div>

      {/* Telemetry Chart & Workspace Security Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityChart data={activity} />

        {/* Security Health Summary Panel */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Integrity Health</CardTitle>
            <CardDescription>Cryptographic verification status across stored files.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-medium border border-border bg-surface-subtle/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  Verified SHA-256
                </span>
                <span className="font-bold text-text-primary">{metrics.verified_count}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger"></span>
                  Integrity Mismatches
                </span>
                <span className={`font-bold ${metrics.mismatch_count > 0 ? 'text-danger' : 'text-text-primary'}`}>
                  {metrics.mismatch_count}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-text-muted">Storage Engine</span>
                <span className="font-semibold text-text-primary capitalize">Private File Storage</span>
              </div>
            </div>

            <div className="p-3 rounded-small bg-primary-soft/40 border border-primary/20 text-xs text-text-secondary space-y-1">
              <p className="font-semibold text-primary">Tamper Detection</p>
              <p className="text-[11px] leading-relaxed text-text-muted">
                TrustVault re-hashes actual stored bytes on demand. Try our simulation tool on any document to test alert handling.
              </p>
            </div>
          </CardContent>

          <div className="p-5 pt-0">
            <Link to="/app/documents" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Manage All Documents
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table (Admin) */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Recent Audit Trail</CardTitle>
              <CardDescription>Latest security events captured in real-time.</CardDescription>
            </div>
            <Link to="/app/audit" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View Audit Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentEvents.length === 0 ? (
              <p className="p-6 text-center text-xs text-text-muted">No audit events recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs font-semibold text-text-primary">
                        {event.action}
                      </TableCell>
                      <TableCell className="text-xs">{event.actor_name}</TableCell>
                      <TableCell className="text-xs capitalize text-text-secondary">
                        {event.resource_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.outcome === 'success' ? 'success' : 'danger'}>
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

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
}
