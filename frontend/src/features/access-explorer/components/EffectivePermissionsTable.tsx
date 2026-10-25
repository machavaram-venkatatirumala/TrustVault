import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  KeyRound,
  ShieldAlert,
  ArrowUpDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { EffectivePermissionRecord } from '../../../types';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

interface EffectivePermissionsTableProps {
  records: EffectivePermissionRecord[];
  documentName: string;
  onSelectRecord?: (record: EffectivePermissionRecord) => void;
  selectedUserId?: string;
}

export function EffectivePermissionsTable({
  records,
  documentName,
  onSelectRecord,
  selectedUserId,
}: EffectivePermissionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'inherited'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'manage' | 'download' | 'view'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'permission' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);

      const matchesSource =
        sourceFilter === 'all'
          ? true
          : sourceFilter === 'direct'
          ? !r.is_inherited
          : r.is_inherited;

      const matchesLevel =
        levelFilter === 'all' ? true : r.effective_permission === levelFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? r.status === 'active'
          : r.status === 'revoked' || r.status === 'expired';

      return matchesSearch && matchesSource && matchesLevel && matchesStatus;
    });
  }, [records, searchQuery, sourceFilter, levelFilter, statusFilter]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'permission') {
        cmp = a.effective_permission.localeCompare(b.effective_permission);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredRecords, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'permission' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPermissionBadge = (perm: string) => {
    switch (perm) {
      case 'manage':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'download':
        return 'bg-teal-pale text-teal-deep border-teal/30';
      case 'view':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'denied':
        return 'bg-coral-pale text-coral-deep border-coral/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Document',
      'Identity Name',
      'Email',
      'Access Source',
      'Is Inherited',
      'Effective Permission',
      'Download Authorized',
      'Grant Status',
      'Expiration',
      'Rationale',
    ];

    const rows = sortedRecords.map((r) => [
      `"${documentName.replace(/"/g, '""')}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.access_source.replace(/"/g, '""')}"`,
      r.is_inherited ? 'Yes' : 'No',
      `"${r.effective_permission.toUpperCase()}"`,
      r.can_download ? 'Yes' : 'No',
      `"${r.status.toUpperCase()}"`,
      `"${(r.expiration || 'Never').replace(/"/g, '""')}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `access_permissions_${documentName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs">
      {/* Search, Filters, and Export Bar */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by principal name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Right: Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="text-xs bg-white border border-border rounded-xl px-2.5 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            aria-label="Filter by access source"
          >
            <option value="all">All Sources</option>
            <option value="direct">Direct Grants Only</option>
            <option value="inherited">Inherited Roles Only</option>
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="text-xs bg-white border border-border rounded-xl px-2.5 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            aria-label="Filter by permission level"
          >
            <option value="all">All Levels</option>
            <option value="manage">Manage</option>
            <option value="download">Download</option>
            <option value="view">View Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-white border border-border rounded-xl px-2.5 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Revoked / Expired</option>
          </select>

          {/* Export CSV button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 bg-white shadow-2xs hover:bg-surface-subtle border-border"
            title="Export filtered table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-text-secondary" />
            <span>CSV</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-surface-subtle text-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-border select-none">
            <tr>
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  <span>Identity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Origin / Grant Type</th>
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('permission')}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  <span>Effective Level</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Download Authority</th>
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Expiration</th>
              <th className="py-3 px-4">Authorization Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRecords.map((r, i) => {
              const isSelected = selectedUserId === r.user_id;
              const initials = r.name ? r.name.charAt(0).toUpperCase() : 'U';

              return (
                <tr
                  key={`${r.user_id}-${i}`}
                  onClick={() => onSelectRecord && onSelectRecord(r)}
                  className={cn(
                    'hover:bg-surface-subtle/60 transition-colors cursor-pointer',
                    isSelected && 'bg-primary-soft/50'
                  )}
                >
                  {/* Identity */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{r.name}</div>
                        <div className="text-[11px] font-mono text-text-muted truncate">{r.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Origin */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1',
                        r.is_inherited
                          ? 'bg-teal-pale text-teal-deep border-teal/25'
                          : 'bg-primary-soft text-primary border-primary/20'
                      )}
                    >
                      {r.is_inherited ? <Building2 className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                      <span>{r.access_source}</span>
                    </span>
                  </td>

                  {/* Effective Level */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border uppercase',
                        getPermissionBadge(r.effective_permission)
                      )}
                    >
                      {r.effective_permission}
                    </span>
                  </td>

                  {/* Download Authority */}
                  <td className="py-3 px-4">
                    {r.can_download ? (
                      <span className="inline-flex items-center gap-1 text-emerald font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Prohibited
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                        r.status === 'active'
                          ? 'bg-emerald-pale text-emerald'
                          : 'bg-coral-pale text-coral-deep'
                      )}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Expiration */}
                  <td className="py-3 px-4 text-text-secondary text-[11px]">
                    {r.expiration || 'Never'}
                  </td>

                  {/* Rationale */}
                  <td className="py-3 px-4 text-text-secondary text-[11px] max-w-xs truncate" title={r.reason}>
                    {r.reason || 'Authorized by active workspace role'}
                  </td>
                </tr>
              );
            })}

            {sortedRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-text-muted">
                  <p className="text-xs font-semibold text-text-primary">No identities match current criteria</p>
                  <p className="text-[11px] text-text-muted mt-1">Try resetting the search query or source filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="p-3.5 border-t border-border bg-surface-subtle/30 flex items-center justify-between text-xs text-text-muted">
        <span>
          Showing <strong className="text-text-primary">{sortedRecords.length}</strong> of{' '}
          <strong className="text-text-primary">{records.length}</strong> evaluated identities
        </span>
        <span className="text-[11px]">
          Authoritative server permissions snapshot
        </span>
      </div>
    </div>
  );
}
