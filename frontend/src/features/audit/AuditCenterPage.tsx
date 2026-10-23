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
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { AuditLogItem } from '../../types';
import { formatDate } from '../../lib/formatters';

export function AuditCenterPage() {
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogItem | null>(null);

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

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('failure') || action.includes('mismatch') || action.includes('denied')) return 'danger';
    if (action.includes('revoke') || action.includes('delete') || action.includes('deactivate')) return 'warning';
    if (action.includes('verify')) return 'success';
    if (action.includes('grant') || action.includes('upload')) return 'default';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Security Audit Center
        </h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Immutable event ledger recording all authentication, file operations, permission grants, and integrity verifications.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search audit actions, resources, metadata..."
            leftIcon={<Search className="w-4 h-4" />}
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
            className="h-9 rounded-small border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            className="h-9 rounded-small border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              className="text-xs text-text-muted hover:text-text-primary gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-medium border border-border bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading audit ledger...</div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={search || actionFilter ? 'No matching audit records' : 'No audit records found'}
            description="All platform interactions are automatically serialized and stored in this immutable audit log."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <TableCell className="text-xs text-text-muted whitespace-nowrap">
                    {formatDate(event.created_at)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={getActionBadgeVariant(event.action)} className="font-mono text-[11px]">
                      {event.action}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs">
                    <span className="font-semibold text-text-primary block">{event.actor_name}</span>
                    {event.actor_email && (
                      <span className="text-[11px] text-text-muted block">{event.actor_email}</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs capitalize text-text-secondary">
                    {event.resource_type}
                  </TableCell>

                  <TableCell>
                    <Badge variant={event.outcome === 'success' ? 'success' : 'danger'}>
                      {event.outcome}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-text-muted font-mono">
                    {event.ip_address || 'internal'}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className="h-7 text-xs gap-1"
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
          <div className="h-12 border-t border-border px-4 flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing {events.length} of {total} audit records
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <Dialog open={Boolean(selectedEvent)} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              {selectedEvent?.action}
            </DialogTitle>
            <DialogDescription>
              Detailed security record with forensic context and request identifiers.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-medium bg-surface-subtle border border-border text-xs">
                <div>
                  <span className="text-text-muted block text-[11px]">Actor</span>
                  <span className="font-semibold text-text-primary">{selectedEvent.actor_name}</span>
                  {selectedEvent.actor_email && (
                    <span className="text-[10px] text-text-muted block">{selectedEvent.actor_email}</span>
                  )}
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Timestamp</span>
                  <span className="font-semibold text-text-primary">{formatDate(selectedEvent.created_at)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Outcome</span>
                  <Badge variant={selectedEvent.outcome === 'success' ? 'success' : 'danger'}>
                    {selectedEvent.outcome}
                  </Badge>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Request ID</span>
                  <span className="font-mono text-text-primary text-[11px]">
                    {selectedEvent.request_id || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-1.5">
                  Sanitized Metadata Payload (JSON)
                </span>
                <pre className="p-3 rounded-medium bg-surface-subtle border border-border font-mono text-[11px] text-text-primary overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
