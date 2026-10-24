import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  LogOut,
  Clock,
  Terminal,
  ExternalLink,
  RefreshCw,
  HardDrive,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { formatDate, formatBytes } from '../../lib/formatters';
import { DocumentItem } from '../../types';

export function SecurityControlsPage() {
  const { user, organization, role, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved'>('all');
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<import('../../types').SecurityAlertItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Fetch real security summary from backend
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.dashboard.getSummary(),
  });

  // Fetch real documents for the integrity verifier tool
  const { data: docsData } = useQuery({
    queryKey: ['documents', 'list-for-verifier'],
    queryFn: () => api.documents.list({ per_page: 50 }),
  });

  // Fetch real backend security anomaly alerts
  const { data: alertsData, isLoading: isAlertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['security-alerts', alertFilter],
    queryFn: () => api.security.alerts.list(alertFilter !== 'all' ? alertFilter : undefined),
    enabled: role === 'admin',
  });

  // Fetch real operational diagnostics
  const { data: diagnosticsData, isLoading: isDiagLoading, refetch: refetchDiagnostics } = useQuery({
    queryKey: ['observability-diagnostics'],
    queryFn: () => api.observability.getDiagnostics(),
  });

  const alerts = alertsData?.alerts || [];
  const openAlertsCount = alerts.filter((a) => a.status === 'open').length;

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.security.alerts.acknowledge(alertId);
      success('Alert Acknowledged', 'Security alert moved to acknowledged state.');
      refetchAlerts();
    } catch (err: any) {
      error('Action Failed', err.message || 'Could not acknowledge alert.');
    }
  };

  const handleConfirmResolveAlert = async () => {
    if (!selectedAlertForResolve) return;
    setIsResolving(true);
    try {
      await api.security.alerts.resolve(selectedAlertForResolve.id, resolutionNotes.trim() || undefined);
      success('Alert Resolved', 'Security event successfully resolved with audit verification.');
      setSelectedAlertForResolve(null);
      setResolutionNotes('');
      refetchAlerts();
    } catch (err: any) {
      error('Resolution Failed', err.message || 'Could not resolve alert.');
    } finally {
      setIsResolving(false);
    }
  };

  const metrics = summaryData?.metrics;
  const documents = docsData?.documents || [];

  const handleTerminateSession = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleRunVerification = async () => {
    if (!selectedDocId) return;
    setVerifying(true);
    try {
      const res = await api.documents.verifyIntegrity(selectedDocId);
      setVerificationResult(res);
      if (res.verified) {
        success('Integrity Verified', res.message);
      } else {
        warning('Cryptographic Mismatch Alert!', res.message);
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err: any) {
      error('Verification Error', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const securityControls = [
    {
      title: 'Password Hashing & Key Derivation',
      status: 'Active (Argon2id)',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'Passwords hashed with memory-hard Argon2id parameters preventing offline GPU cracking attacks.',
    },
    {
      title: 'Session & Cookie Security',
      status: 'Enforced (HttpOnly, SameSite=Lax)',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'Credentials and session identifiers are never exposed to browser JavaScript or localStorage.',
    },
    {
      title: 'Multi-Tenant Data Isolation',
      status: 'Enforced (Foreign-Key Scoped)',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'Every database query and API operation strictly validates membership and organization boundary before accessing records.',
    },
    {
      title: 'File Upload Sanitization & Magic Bytes',
      status: 'Active (Allowlist Enforced)',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'MIME types inspected via magic byte headers. Filenames sanitized against directory traversal (../).',
    },
    {
      title: 'Rate Limiting Defense',
      status: '5/min Auth, 60/min General',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'Flask-Limiter throttles brute-force authentication attacks and repeated automated resource calls.',
    },
    {
      title: 'Cryptographic SHA-256 Digest',
      status: 'Authoritative Server Hash',
      statusColor: 'bg-emerald-50 text-[#16865B] border border-emerald-200',
      description: 'Streamed byte hashing on upload with on-demand tamper verification.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-[#20263A] tracking-tight">
          Security Center & Operational Verification
        </h1>
        <p className="text-xs text-[#747C90] leading-relaxed">
          Inspect workspace security health, run on-demand SHA-256 cryptographic verifications, and monitor defensive controls.
        </p>
      </div>

      {/* Real Security Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Integrity Status Card */}
        <div className="p-4 rounded-xl border border-[#E8EAF1] bg-white shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#747C90] uppercase tracking-wider">
              Cryptographic Integrity
            </span>
            <ShieldCheck className="w-4 h-4 text-[#16865B]" />
          </div>
          <div>
            {metrics?.mismatch_count && metrics.mismatch_count > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E56D5D]"></span>
                <span className="text-sm font-bold text-[#E56D5D]">
                  {metrics.mismatch_count} Integrity {metrics.mismatch_count === 1 ? 'Alert' : 'Alerts'}
                </span>
              </div>
            ) : metrics?.verified_count && metrics.verified_count > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16865B]"></span>
                <span className="text-sm font-bold text-[#16865B]">
                  {metrics.verified_count} Verified Healthy
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="text-sm font-semibold text-[#747C90]">
                  No checks run yet
                </span>
              </div>
            )}
            <p className="text-[11px] text-[#747C90] mt-1">
              Verified against private server SHA-256 storage
            </p>
          </div>
        </div>

        {/* Sharing Surface Card */}
        <div className="p-4 rounded-xl border border-[#E8EAF1] bg-white shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#747C90] uppercase tracking-wider">
              Sharing Exposure
            </span>
            <KeyRound className="w-4 h-4 text-[#0F9D91]" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#20263A]">
              {metrics?.active_permissions ?? 0}
            </span>
            <span className="text-xs text-[#747C90] ml-1.5">Active External Grants</span>
            <p className="text-[11px] text-[#747C90] mt-1">
              {metrics?.shared_documents ?? 0} shared documents in workspace
            </p>
          </div>
        </div>

        {/* Recent Security Events Card */}
        <div className="p-4 rounded-xl border border-[#E8EAF1] bg-white shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#747C90] uppercase tracking-wider">
              Security Log Events
            </span>
            <ShieldAlert className="w-4 h-4 text-[#D99022]" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#20263A]">
              {metrics?.recent_security_events ?? 0}
            </span>
            <span className="text-xs text-[#747C90] ml-1.5">Logged Actions (24h)</span>
            <div className="mt-1">
              <Link to="/app/audit" className="text-[11px] font-medium text-[#3155D9] hover:underline flex items-center gap-1">
                View in Audit Explorer <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* On-Demand File Integrity Verification Widget */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#20263A] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#3155D9]" />
            <span>On-Demand Cryptographic Integrity Verifier</span>
          </h2>
          <p className="text-xs text-[#747C90]">
            Select any file in your workspace to stream its stored bytes through the backend SHA-256 digest engine and verify against the authoritative provenance record.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setVerificationResult(null);
            }}
            className="flex-1 h-10 rounded-lg border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="">Select a document to verify...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.original_filename} ({formatBytes(doc.size_bytes)})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={handleRunVerification}
            disabled={!selectedDocId}
            loading={verifying}
            className="h-10 text-xs gap-1.5 bg-[#3155D9] hover:bg-[#2544B8] text-white shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify SHA-256 Digest
          </Button>
        </div>

        {selectedDoc && (
          <div className="p-3.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#747C90]">Authoritative Expected Hash</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedDoc.sha256_hash);
                  setCopiedHash(true);
                  setTimeout(() => setCopiedHash(false), 2000);
                }}
                className="text-[#3155D9] hover:underline flex items-center gap-1 font-mono text-[10px]"
              >
                {copiedHash ? <Check className="w-3 h-3 text-[#16865B]" /> : <Copy className="w-3 h-3" />}
                {copiedHash ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="font-mono text-[11px] text-[#20263A] break-all select-all">
              {selectedDoc.sha256_hash}
            </div>
          </div>
        )}

        {verificationResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              verificationResult.verified
                ? 'bg-emerald-50 border-emerald-200 text-[#16865B]'
                : 'bg-rose-50 border-rose-200 text-[#E56D5D]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                {verificationResult.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16865B]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#E56D5D]" />
                )}
                {verificationResult.verified ? 'Verification Passed: No Tampering Detected' : 'Cryptographic Mismatch Alert!'}
              </span>
              <span className="text-[10px] opacity-80">{formatDate(verificationResult.verified_at)}</span>
            </div>
            <p className="text-xs leading-relaxed">{verificationResult.message}</p>
            <div className="font-mono text-[10px] bg-white/70 p-2.5 rounded border border-current/20 space-y-1">
              <div>Expected: {verificationResult.expected_hash}</div>
              {verificationResult.computed_hash && <div>Calculated: {verificationResult.computed_hash}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Active Session Card */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8EAF1]">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#20263A] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#3155D9]" />
              <span>Active Authentication Session</span>
            </h2>
            <p className="text-xs text-[#747C90]">
              Authenticated user: <strong>{user?.email}</strong> in <strong>{organization?.name}</strong>.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTerminateSession}
            disabled={loggingOut}
            className="text-xs border-rose-200 text-[#E56D5D] hover:bg-rose-50 gap-1.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Terminating...' : 'Terminate Session'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747C90] block">
              Cookie Security
            </span>
            <p className="font-semibold text-[#20263A]">HttpOnly; SameSite=Lax</p>
            <span className="text-[10px] text-[#747C90]">Protected against XSS credential theft</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747C90] block">
              Session Expiry
            </span>
            <p className="font-semibold text-[#20263A]">24 Hours (Rolling)</p>
            <span className="text-[10px] text-[#747C90]">Invalidated on explicit logout</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747C90] block">
              Organization Role
            </span>
            <p className="font-semibold text-[#20263A] capitalize">{role} Privileges</p>
            <span className="text-[10px] text-[#747C90]">Scoped to tenant: {organization?.name}</span>
          </div>
        </div>
      </div>

      {/* Phase 4: Real Security Event & Anomaly Monitoring */}
      {role === 'admin' && (
        <div className="rounded-xl border border-[#E8EAF1] bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E56D5D]" />
                <h3 className="text-base font-bold text-[#20263A]">
                  Security Event & Anomaly Monitoring
                </h3>
                {openAlertsCount > 0 && (
                  <Badge className="bg-[#E56D5D] text-white text-[10px] font-bold">
                    {openAlertsCount} Open
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#747C90]">
                Backend threat detector monitoring repeated access denials, cryptographic mismatches, download bursts, and expiring grants.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-[#F7F8FC] p-1 rounded-lg border border-[#E8EAF1] self-start sm:self-auto">
              {(['all', 'open', 'acknowledged', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAlertFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all ${
                    alertFilter === st
                      ? 'bg-white text-[#3155D9] shadow-sm'
                      : 'text-[#747C90] hover:text-[#20263A]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {isAlertsLoading ? (
              <div className="py-8 text-center text-xs text-[#747C90]">Analyzing security signals...</div>
            ) : alerts.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#16865B] mx-auto" />
                <p className="font-semibold text-xs text-[#16865B]">
                  No Active Security Anomalies Detected
                </p>
                <p className="text-[11px] text-[#747C90]">
                  All authorization requests, file integrity checks, and authentication telemetry within normal parameters.
                </p>
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border transition-all ${
                    al.status === 'open'
                      ? 'border-[#E56D5D]/40 bg-rose-50/20 shadow-sm'
                      : 'border-[#E8EAF1] bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#20263A]">{al.title}</span>
                        <Badge
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            al.severity === 'critical'
                              ? 'bg-rose-50 text-[#E56D5D] border border-rose-200'
                              : al.severity === 'warning'
                              ? 'bg-amber-50 text-[#D99022] border border-amber-200'
                              : 'bg-teal-50 text-[#0F9D91] border border-teal-200'
                          }`}
                        >
                          {al.severity}
                        </Badge>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-[#747C90] capitalize">
                          {al.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#20263A]">{al.description}</p>
                      <p className="text-[11px] text-[#747C90]">
                        Detected at: {formatDate(al.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                      {al.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(al.id)}
                          className="h-7 text-xs border-[#E8EAF1] text-[#20263A] hover:bg-slate-50"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {al.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedAlertForResolve(al)}
                          className="h-7 text-xs bg-[#16865B] hover:bg-[#16865B]/90 text-white font-medium"
                        >
                          Resolve Incident
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Evidence Payload */}
                  {al.evidence && Object.keys(al.evidence).length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#E8EAF1]/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#747C90] block mb-1">
                        Correlated Forensic Evidence
                      </span>
                      <pre className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] font-mono text-[10px] text-[#20263A] overflow-x-auto leading-relaxed">
                        {JSON.stringify(al.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Phase 6: Operational Observability & Health Diagnostics */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-[#20263A] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#3155D9]" />
              <span>Operational Observability & Infrastructure Diagnostics</span>
            </h3>
            <p className="text-xs text-[#747C90]">
              Real backend health probes, storage mounts, and cryptographic subsystem telemetry.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchDiagnostics()}
            className="text-xs text-[#3155D9] gap-1 hover:bg-[#3155D9]/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Diagnostics
          </Button>
        </div>

        {isDiagLoading ? (
          <div className="py-6 text-center text-xs text-[#747C90]">Probing system health...</div>
        ) : diagnosticsData ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Database Health Card */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#747C90] text-[11px] uppercase tracking-wider">
                  Database Probe
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16865B] border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {diagnosticsData.database.status}
                </span>
              </div>
              <p className="text-sm font-bold text-[#20263A] capitalize">
                {diagnosticsData.database.dialect} Dialect
              </p>
              <div className="text-[11px] text-[#747C90] flex items-center justify-between pt-1 border-t border-[#E8EAF1]">
                <span>Query Latency</span>
                <span className="font-mono font-semibold text-[#20263A]">
                  {diagnosticsData.database.latency_ms !== undefined
                    ? `${diagnosticsData.database.latency_ms} ms`
                    : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Storage Backend Card */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#747C90] text-[11px] uppercase tracking-wider">
                  Private Storage
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16865B] border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {diagnosticsData.storage.status}
                </span>
              </div>
              <p className="text-sm font-bold text-[#20263A] capitalize">
                {diagnosticsData.storage.provider} Storage
              </p>
              <div className="text-[11px] text-[#747C90] flex items-center justify-between pt-1 border-t border-[#E8EAF1]">
                <span>Mount Writable</span>
                <span className="font-semibold text-[#16865B]">
                  {diagnosticsData.storage.writable ? 'Verified' : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Subsystem Health Card */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#747C90] text-[11px] uppercase tracking-wider">
                  Security Subsystems
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#3155D9] border border-blue-200">
                  Live
                </span>
              </div>
              <div className="text-[11px] space-y-1 font-medium text-[#20263A]">
                <div className="flex justify-between">
                  <span className="text-[#747C90]">Hash Chain</span>
                  <span className="text-[#16865B]">{diagnosticsData.security_subsystems.hash_chaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747C90]">Scanner</span>
                  <span className="text-[#3155D9]">{diagnosticsData.security_subsystems.malware_scanner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747C90]">Webhooks</span>
                  <span className="text-[#16865B]">{diagnosticsData.security_subsystems.webhook_dispatcher}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#747C90]">Operational diagnostics unavailable.</div>
        )}
      </div>

      {/* Backend Security Architecture Status */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#20263A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16865B]" />
              <span>Defensive Architecture Checklist</span>
            </h3>
            <p className="text-xs text-[#747C90]">
              Operational status of core security subsystems across the application stack.
            </p>
          </div>

          <Link to="/security" target="_blank">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#3155D9]">
              <span>Architecture Spec</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-[#E8EAF1] border border-[#E8EAF1] rounded-lg overflow-hidden">
          {securityControls.map((ctrl, idx) => (
            <div
              key={idx}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F8FC] transition-colors"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#20263A]">{ctrl.title}</p>
                <p className="text-[11px] text-[#747C90]">{ctrl.description}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold shrink-0 self-start sm:self-center ${ctrl.statusColor}`}>
                {ctrl.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resolve Alert Dialog */}
      <Dialog open={Boolean(selectedAlertForResolve)} onOpenChange={(open: boolean) => !open && setSelectedAlertForResolve(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <DialogTitle className="text-[#20263A]">Resolve Security Incident</DialogTitle>
            <DialogDescription className="text-xs text-[#747C90]">
              Marking <strong>{selectedAlertForResolve?.title}</strong> as resolved. This will record an authoritative resolution audit entry.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="block text-xs font-semibold text-[#20263A]">
              Resolution Notes / Corrective Actions (Optional)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g., Reviewed originating IP, confirmed legitimate burst, firewall rules updated."
              className="w-full h-24 rounded-lg border border-[#E8EAF1] p-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAlertForResolve(null)}
              className="border-[#E8EAF1]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isResolving}
              onClick={handleConfirmResolveAlert}
              className="bg-[#16865B] hover:bg-[#16865B]/90 text-white font-semibold"
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
