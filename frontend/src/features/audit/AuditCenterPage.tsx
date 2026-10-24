import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  Filter,
  X,
  FileCode,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  Copy,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { AuditLogItem } from '../../types';
import { formatDate } from '../../lib/formatters';

export function AuditCenterPage() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Hash Chain Verification state
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState<import('../../types').AuditChainVerificationResult | null>(null);
  const [showChainModal, setShowChainModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-events', { search, actionFilter, outcomeFilter, page }],
    queryFn: () =>
      api.audit.list({
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        outcome: outcomeFilter || undefined,
        page,
        per_page: 25,
      }),
    enabled: isAdmin,
  });

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const res = await api.audit.verifyChain();
      setChainResult(res);
      setShowChainModal(true);
      if (res.chain_valid) {
        success('Ledger Intact', `Cryptographically verified ${res.total_events} audit events without gaps or tampering.`);
      } else {
        error('Integrity Violation', res.error_message || 'Hash chain integrity violation detected.');
      }
    } catch (err: any) {
      error('Verification Error', err.message || 'Failed to verify audit hash chain.');
    } finally {
      setIsVerifyingChain(false);
    }
  };

  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Administrative Access Required"
        description="The Security Audit Center is restricted to organization administrators under zero-trust governance."
      />
    );
  }

  const events = data?.events || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const getActionBadge = (action: string) => {
    if (action.includes('failure') || action.includes('mismatch') || action.includes('denied')) {
      return 'bg-rose-50 text-[#E56D5D] border border-rose-200';
    }
    if (action.includes('revoke') || action.includes('delete') || action.includes('deactivate')) {
      return 'bg-amber-50 text-[#D99022] border border-amber-200';
    }
    if (action.includes('verify')) {
      return 'bg-emerald-50 text-[#16865B] border border-emerald-200';
    }
    if (action.includes('grant') || action.includes('upload')) {
      return 'bg-blue-50 text-[#3155D9] border border-blue-200';
    }
    return 'bg-slate-100 text-[#747C90] border border-slate-200';
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportAsJSON = () => {
    if (events.length === 0) return;
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustvault-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Export Completed', 'Audit records exported as JSON.');
  };

  const exportAsCSV = () => {
    if (events.length === 0) return;
    const headers = ['Sequence', 'Timestamp', 'Action', 'Actor Name', 'Actor Email', 'Resource Type', 'Resource ID', 'Outcome', 'Event Hash', 'Prev Hash'];
    const rows = events.map((e) => [
      `"${e.sequence_number || ''}"`,
      `"${e.created_at}"`,
      `"${e.action}"`,
      `"${e.actor_name || ''}"`,
      `"${e.actor_email || ''}"`,
      `"${e.resource_type || ''}"`,
      `"${e.resource_id || ''}"`,
      `"${e.outcome}"`,
      `"${e.event_hash || ''}"`,
      `"${e.prev_event_hash || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustvault-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Export Completed', 'Audit records exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20263A]">
            Security Audit Center
          </h2>
          <p className="mt-0.5 text-xs text-[#747C90]">
            Cryptographically hash-chained operational ledger recording authorization checks, file uploads, permission grants, and SHA-256 verifications.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleVerifyChain}
            disabled={isVerifyingChain}
            className="text-xs bg-[#16865B] hover:bg-[#16865B]/90 text-white gap-1.5 shadow-sm font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isVerifyingChain ? 'Verifying Chain...' : 'Verify Hash Chain'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportAsCSV}
            disabled={events.length === 0}
            className="text-xs border-[#E8EAF1] text-[#20263A] hover:bg-slate-50 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsJSON}
            disabled={events.length === 0}
            className="text-xs border-[#E8EAF1] text-[#20263A] hover:bg-slate-50 gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-[#3155D9]" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search audit actions, resources, metadata..."
            leftIcon={<Search className="w-4 h-4 text-[#747C90]" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-2.5 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="">All Actions</option>
            <option value="document.upload">document.upload</option>
            <option value="document.download">document.download</option>
            <option value="document.delete">document.delete</option>
            <option value="permission.grant">permission.grant</option>
            <option value="permission.revoke">permission.revoke</option>
            <option value="integrity.verify_success">integrity.verify_success</option>
            <option value="integrity.verify_mismatch">integrity.verify_mismatch</option>
            <option value="auth.login_success">auth.login_success</option>
            <option value="auth.login_failure">auth.login_failure</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-2.5 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="">All Outcomes</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failure">Failure</option>
          </select>

          {(search || actionFilter || outcomeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setOutcomeFilter('');
                setPage(1);
              }}
              className="text-xs text-[#747C90] hover:text-[#20263A] gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#747C90]">Loading audit ledger...</div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={search || actionFilter || outcomeFilter ? 'No matching audit records' : 'No activity recorded yet'}
            description={
              search || actionFilter || outcomeFilter
                ? 'Try clearing or modifying your filter criteria.'
                : 'Security events will appear here as actions occur in your workspace.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                <TableHead className="text-[#20263A] font-semibold w-16">Seq #</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Timestamp</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Event Action</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Actor</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Resource</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Outcome</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Event Hash</TableHead>
                <TableHead className="text-right text-[#20263A] font-semibold">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <TableCell className="text-xs font-mono font-semibold text-[#747C90]">
                    #{event.sequence_number ?? '-'}
                  </TableCell>

                  <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
                    {formatDate(event.created_at)}
                  </TableCell>

                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${getActionBadge(event.action)}`}>
                      {event.action}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs">
                    <span className="font-semibold text-[#20263A] block">{event.actor_name}</span>
                    {event.actor_email && (
                      <span className="text-[11px] text-[#747C90] block">{event.actor_email}</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs capitalize text-[#747C90]">
                    {event.resource_type}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        event.outcome === 'success'
                          ? 'bg-emerald-50 text-[#16865B]'
                          : 'bg-rose-50 text-[#E56D5D]'
                      }`}
                    >
                      {event.outcome === 'success' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {event.outcome}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-[#747C90]">
                    {event.event_hash ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[#20263A] text-[10px]" title={event.event_hash}>
                        {event.event_hash.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">legacy</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className="h-7 text-xs gap-1 text-[#3155D9] hover:bg-[#3155D9]/10"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="h-12 border-t border-[#E8EAF1] px-4 flex items-center justify-between text-xs text-[#747C90]">
            <span>
              Showing {events.length} of {total} audit records
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 text-xs border-[#E8EAF1]"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-[#20263A]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 text-xs border-[#E8EAF1]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <Dialog open={Boolean(selectedEvent)} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
        <DialogContent className="max-w-xl bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3155D9]/10 text-[#3155D9] flex items-center justify-center shrink-0">
                <FileCode className="w-4 h-4" />
              </div>
              <DialogTitle className="font-mono text-base text-[#20263A]">
                {selectedEvent?.action}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#747C90]">
              Forensic audit record with cryptographic hash linkage, sequence number, and verified payload.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] text-xs">
                <div>
                  <span className="text-[#747C90] block text-[11px] mb-0.5">Sequence Number</span>
                  <span className="font-mono font-bold text-[#3155D9]">#{selectedEvent.sequence_number ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#747C90] block text-[11px] mb-0.5">Timestamp</span>
                  <span className="font-semibold text-[#20263A]">{formatDate(selectedEvent.created_at)}</span>
                </div>

                <div>
                  <span className="text-[#747C90] block text-[11px] mb-0.5">Actor</span>
                  <span className="font-semibold text-[#20263A]">{selectedEvent.actor_name}</span>
                  {selectedEvent.actor_email && (
                    <span className="text-[10px] text-[#747C90] block">{selectedEvent.actor_email}</span>
                  )}
                </div>

                <div>
                  <span className="text-[#747C90] block text-[11px] mb-0.5">Outcome</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedEvent.outcome === 'success'
                        ? 'bg-emerald-50 text-[#16865B]'
                        : 'bg-rose-50 text-[#E56D5D]'
                    }`}
                  >
                    {selectedEvent.outcome}
                  </span>
                </div>

                {selectedEvent.event_hash && (
                  <div className="col-span-2 pt-1 border-t border-[#E8EAF1]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[#747C90] text-[11px]">Cryptographic Event Hash (SHA-256)</span>
                      <button
                        onClick={() => handleCopy(selectedEvent.event_hash!, 'evHash')}
                        className="text-[10px] text-[#3155D9] hover:underline"
                      >
                        {copiedField === 'evHash' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="font-mono text-[#20263A] text-[11px] block break-all bg-white p-2 rounded border border-[#E8EAF1]">
                      {selectedEvent.event_hash}
                    </span>
                  </div>
                )}

                {selectedEvent.prev_event_hash && (
                  <div className="col-span-2 pt-1 border-t border-[#E8EAF1]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[#747C90] text-[11px]">Preceding Event Hash (Chain Link)</span>
                      <button
                        onClick={() => handleCopy(selectedEvent.prev_event_hash!, 'prevHash')}
                        className="text-[10px] text-[#3155D9] hover:underline"
                      >
                        {copiedField === 'prevHash' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="font-mono text-[#747C90] text-[11px] block break-all bg-white p-2 rounded border border-[#E8EAF1]">
                      {selectedEvent.prev_event_hash}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#747C90] text-[11px] mb-0.5">Request ID</span>
                    {selectedEvent.request_id && (
                      <button
                        onClick={() => handleCopy(selectedEvent.request_id!, 'reqId')}
                        className="text-[10px] text-[#3155D9] hover:underline"
                      >
                        {copiedField === 'reqId' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-[#20263A] text-[11px] block truncate">
                    {selectedEvent.request_id || 'internal-dispatch'}
                  </span>
                </div>

                <div>
                  <span className="text-[#747C90] block text-[11px] mb-0.5">IP Address</span>
                  <span className="font-mono text-[#20263A] text-[11px] block">
                    {selectedEvent.ip_address || 'internal'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#747C90] block mb-1.5">
                  Sanitized Metadata Payload (JSON)
                </span>
                <pre className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] font-mono text-[11px] text-[#20263A] overflow-x-auto max-h-56 leading-relaxed select-all">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEvent(null)}
              className="border-[#E8EAF1]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tamper-Evident Hash Chain Verification Dialog */}
      <Dialog open={showChainModal} onOpenChange={setShowChainModal}>
        <DialogContent className="max-w-xl bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  chainResult?.chain_valid
                    ? 'bg-emerald-50 text-[#16865B]'
                    : 'bg-rose-50 text-[#E56D5D]'
                }`}
              >
                {chainResult?.chain_valid ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base text-[#20263A] font-bold">
                  {chainResult?.chain_valid
                    ? 'Audit Trail Cryptographically Verified'
                    : 'Audit Trail Integrity Violation Detected'}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#747C90]">
                  Mathematical verification of sequence continuity, canonical payloads, and backward hash linkages.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {chainResult && (
            <div className="space-y-4 py-2 text-xs">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  chainResult.chain_valid
                    ? 'bg-emerald-50/60 border-emerald-200 text-[#16865B]'
                    : 'bg-rose-50/60 border-rose-200 text-[#E56D5D]'
                }`}
              >
                {chainResult.chain_valid ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-sm">
                    {chainResult.chain_valid
                      ? `All ${chainResult.total_events} events passed cryptographic audit verification.`
                      : chainResult.error_message}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Verified at: {formatDate(chainResult.verified_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1]">
                <div>
                  <span className="text-[#747C90] text-[11px] block mb-0.5">Total Verified Records</span>
                  <span className="text-base font-bold text-[#20263A]">{chainResult.total_events}</span>
                </div>
                <div>
                  <span className="text-[#747C90] text-[11px] block mb-0.5">Genesis Sequence</span>
                  <span className="text-base font-bold text-[#16865B]">#1 (Verified)</span>
                </div>

                {chainResult.head_hash && (
                  <div className="col-span-2 pt-2 border-t border-[#E8EAF1]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[#747C90] text-[11px]">Current Ledger Head Hash (SHA-256)</span>
                      <button
                        onClick={() => handleCopy(chainResult.head_hash!, 'headHash')}
                        className="text-[10px] text-[#3155D9] hover:underline"
                      >
                        {copiedField === 'headHash' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="font-mono text-[#20263A] text-[10px] block break-all bg-white p-2 rounded border border-[#E8EAF1]">
                      {chainResult.head_hash}
                    </span>
                  </div>
                )}
              </div>

              {/* Honest Cryptographic Limitations Notice */}
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-0.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Cryptographic Integrity Model & Limitations Notice
                </div>
                <p>
                  {chainResult.limitations_notice ||
                    'Tamper-evident hash chaining detects unauthorized deletions, reorderings, and modifications by application users. Privileged attackers with direct database write access could rewrite the chain unless periodically anchored to external immutable checkpoints.'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChainModal(false)}
              className="border-[#E8EAF1]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
