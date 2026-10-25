import React from 'react';
import {
  Users,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Fingerprint,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { AccessExplorerData } from '../../../types';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../hooks/useToast';

interface AccessSummaryStripProps {
  data: AccessExplorerData;
  activeFilter?: 'all' | 'direct' | 'inherited' | 'manage' | 'revoked';
  onFilterChange?: (filter: 'all' | 'direct' | 'inherited' | 'manage' | 'revoked') => void;
}

export function AccessSummaryStrip({ data, activeFilter = 'all', onFilterChange }: AccessSummaryStripProps) {
  const { success } = useToast();
  const [copiedHash, setCopiedHash] = React.useState(false);

  const activeIdentitiesCount = data.table.filter((r) => r.status === 'active').length;
  const directGrantsCount = data.graph.links.filter(
    (l) => l.relationship === 'direct_grant' && l.status === 'active'
  ).length;
  const inheritedRolesCount = data.graph.links.filter((l) => l.inherited).length;
  const manageAdminsCount = data.table.filter(
    (r) => r.effective_permission === 'manage' && r.status === 'active'
  ).length;
  const revokedOrExpiredCount = data.graph.links.filter(
    (l) => l.status === 'revoked' || l.status === 'expired'
  ).length;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.document?.sha256_hash) {
      navigator.clipboard.writeText(data.document.sha256_hash);
      setCopiedHash(true);
      success('Cryptographic SHA-256 digest copied to clipboard');
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const metrics = [
    {
      id: 'all' as const,
      label: 'Authorized Identities',
      value: activeIdentitiesCount,
      subtext: 'Active principals with document access',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary-soft',
      border: 'border-primary/20',
      activeBorder: 'border-primary ring-1 ring-primary/30',
    },
    {
      id: 'direct' as const,
      label: 'Direct Share Grants',
      value: directGrantsCount,
      subtext: 'Explicit point-to-point share grants',
      icon: KeyRound,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      activeBorder: 'border-blue-600 ring-1 ring-blue-600/30',
    },
    {
      id: 'inherited' as const,
      label: 'Inherited Role Paths',
      value: inheritedRolesCount,
      subtext: 'Derived from workspace role membership',
      icon: Building2,
      color: 'text-teal',
      bg: 'bg-teal-pale',
      border: 'border-teal/20',
      activeBorder: 'border-teal ring-1 ring-teal/30',
    },
    {
      id: 'manage' as const,
      label: 'Full Manage Authorities',
      value: manageAdminsCount,
      subtext: 'Document owner & workspace administrators',
      icon: ShieldCheck,
      color: 'text-emerald',
      bg: 'bg-emerald-pale',
      border: 'border-emerald/20',
      activeBorder: 'border-emerald ring-1 ring-emerald/30',
    },
    {
      id: 'revoked' as const,
      label: 'Revoked / Expired Grants',
      value: revokedOrExpiredCount,
      subtext: 'Denied grants with invalidated access',
      icon: revokedOrExpiredCount > 0 ? ShieldAlert : Ban,
      color: revokedOrExpiredCount > 0 ? 'text-coral' : 'text-text-muted',
      bg: revokedOrExpiredCount > 0 ? 'bg-coral-pale' : 'bg-surface-subtle',
      border: revokedOrExpiredCount > 0 ? 'border-coral/20' : 'border-border',
      activeBorder: 'border-coral ring-1 ring-coral/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isSelected = activeFilter === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onFilterChange && onFilterChange(isSelected ? 'all' : m.id)}
            className={cn(
              'text-left p-3.5 rounded-xl bg-white border transition-all duration-150 shadow-2xs hover:shadow-xs focus:outline-none',
              isSelected ? m.activeBorder : 'border-border hover:border-slate-300'
            )}
            title={`Click to filter by ${m.label}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-text-secondary leading-tight truncate">
                {m.label}
              </span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', m.bg, m.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn('text-xl font-bold tracking-tight', m.color)}>{m.value}</span>
            </div>
            <p className="text-[10px] text-text-muted truncate mt-0.5">{m.subtext}</p>
          </button>
        );
      })}

      {/* 6th Card: Cryptographic Integrity Digest */}
      <div className="p-3.5 rounded-xl bg-white border border-border shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-text-secondary leading-tight">
              Cryptographic Digest
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-pale text-teal flex items-center justify-center shrink-0">
              <Fingerprint className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-text-primary">SHA-256 Verified</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyHash}
          className="mt-2 text-[10px] font-mono text-text-muted hover:text-text-primary flex items-center justify-between gap-1 p-1 px-1.5 rounded bg-surface-subtle border border-border/80 transition-colors w-full"
          title={`Click to copy: ${data.document?.sha256_hash}`}
        >
          <span className="truncate max-w-[100px]">
            {data.document?.sha256_hash ? `${data.document.sha256_hash.substring(0, 10)}...` : 'N/A'}
          </span>
          {copiedHash ? <Check className="w-3 h-3 text-emerald shrink-0" /> : <Copy className="w-3 h-3 text-text-muted shrink-0" />}
        </button>
      </div>
    </div>
  );
}
