import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileText,
  User,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Hash,
  Download,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import {
  AccessExplorerData,
  AccessGraphNode,
  AccessGraphLink,
  EffectivePermissionRecord,
  ClassificationLevel,
} from '../../../types';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/button';

interface RelationshipInspectorProps {
  data: AccessExplorerData;
  selectedNode: AccessGraphNode | null;
  selectedLink: AccessGraphLink | null;
  onClearSelection: () => void;
}

export function RelationshipInspector({
  data,
  selectedNode,
  selectedLink,
  onClearSelection,
}: RelationshipInspectorProps) {
  const { success } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getClassificationBadge = (cls?: ClassificationLevel | string) => {
    switch (cls) {
      case 'Restricted':
        return 'bg-coral-pale text-coral-deep border-coral/30';
      case 'Confidential':
        return 'bg-amber-pale text-amber-deep border-amber/30';
      case 'Internal':
        return 'bg-primary-soft text-primary border-primary/25';
      case 'Public':
        return 'bg-emerald-pale text-emerald-fresh border-emerald/30';
      default:
        return 'bg-surface-subtle text-text-secondary border-border';
    }
  };

  const getPermissionBadge = (perm?: string) => {
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Find table record corresponding to selected node if available
  const matchingRecord: EffectivePermissionRecord | undefined = selectedNode?.email
    ? data.table.find((r) => r.email === selectedNode.email)
    : undefined;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col justify-between shadow-2xs h-full min-h-[500px]">
      <div className="space-y-5">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {selectedLink
                ? 'Relationship Edge Details'
                : selectedNode
                ? 'Identity & Node Inspector'
                : 'Access Inspector'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-pale text-emerald border border-emerald/20">
              <ShieldCheck className="w-3 h-3" />
              Verified State
            </span>
            {(selectedNode || selectedLink) && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[11px] text-text-muted hover:text-text-primary transition-colors underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 1. RELATIONSHIP EDGE SELECTED */}
        {selectedLink ? (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {/* Visual Path Diagram */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
                Authorization Pathway
              </div>
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="font-mono text-text-primary truncate max-w-[120px]">
                  {selectedLink.source}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono text-text-primary truncate max-w-[120px]">
                  {selectedLink.target}
                </span>
              </div>
            </div>

            {/* Relationship Category */}
            <div className="space-y-1">
              <span className="text-[11px] text-text-muted font-medium">Relationship Category</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border uppercase',
                    selectedLink.inherited
                      ? 'bg-teal-pale text-teal-deep border-teal/30'
                      : 'bg-primary-soft text-primary border-primary/25'
                  )}
                >
                  {selectedLink.inherited ? 'Inherited Workspace Role' : 'Direct Document Grant'}
                </span>
              </div>
            </div>

            {/* Effective Permission Level */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block">
                  Effective Level
                </span>
                <span
                  className={cn(
                    'inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase border',
                    getPermissionBadge(selectedLink.permission_level)
                  )}
                >
                  {selectedLink.permission_level || 'View'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block">
                  Download Right
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                  {selectedLink.permission_level === 'manage' || selectedLink.permission_level === 'download' ? (
                    <span className="flex items-center gap-1 text-emerald">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-text-muted">
                      <XCircle className="w-3.5 h-3.5" /> Prohibited
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Server Provided Details / Rationale */}
            {selectedLink.details && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-text-muted font-medium">Evaluation Rationale</span>
                <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle/50 p-2.5 rounded-xl border border-border">
                  {selectedLink.details}
                </p>
              </div>
            )}
          </div>
        ) : selectedNode ? (
          /* 2. NODE SELECTED */
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {/* Identity or Document Header */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border',
                  selectedNode.type === 'document'
                    ? 'bg-primary-soft text-primary border-primary/20'
                    : selectedNode.type === 'workspace'
                    ? 'bg-teal-pale text-teal border-teal/20'
                    : 'bg-surface-subtle text-text-primary border-border'
                )}
              >
                {selectedNode.type === 'document' ? (
                  <FileText className="w-5 h-5" />
                ) : selectedNode.type === 'workspace' ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  selectedNode.label.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-text-primary truncate" title={selectedNode.label}>
                  {selectedNode.label}
                </h3>
                {selectedNode.email && (
                  <p className="text-xs font-mono text-text-muted truncate mt-0.5">
                    {selectedNode.email}
                  </p>
                )}
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {selectedNode.type} {selectedNode.role ? `• ${selectedNode.role}` : ''}
                </span>
              </div>
            </div>

            {/* Document Node Specific Fields */}
            {selectedNode.type === 'document' && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-surface-subtle rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Classification:</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border uppercase',
                        getClassificationBadge(data.document.classification)
                      )}
                    >
                      {data.document.classification || 'Internal'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">File Size:</span>
                    <span className="font-semibold text-text-primary">
                      {formatFileSize(data.document.size_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Owner Identity:</span>
                    <span className="font-semibold text-text-primary">
                      {selectedNode.owner_name || 'Organization'}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Digest with single-click copy */}
                <div className="p-3 bg-surface-subtle rounded-xl border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-text-primary">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-teal" />
                      SHA-256 Content Digest
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(data.document.sha256_hash, 'Digest')}
                      className="text-primary hover:text-primary-hover flex items-center gap-1 text-[10px] font-semibold"
                    >
                      {copiedField === 'Digest' ? (
                        <Check className="w-3 h-3 text-emerald" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary bg-white p-2 rounded-lg border border-border/80 break-all select-all">
                    {data.document.sha256_hash}
                  </div>
                </div>

                {/* Action Link to Document Details */}
                <Link to={`/app/documents/${data.document.id}`} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 bg-white shadow-2xs hover:bg-surface-subtle border-border"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-primary" />
                    <span>View in Document Repository</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-text-muted" />
                  </Button>
                </Link>
              </div>
            )}

            {/* User Node Specific Fields */}
            {selectedNode.type === 'user' && matchingRecord && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-surface-subtle rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Access Origin:</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        matchingRecord.is_inherited
                          ? 'bg-teal-pale text-teal-deep border-teal/30'
                          : 'bg-primary-soft text-primary border-primary/25'
                      )}
                    >
                      {matchingRecord.access_source}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Effective Permission:</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                        getPermissionBadge(matchingRecord.effective_permission)
                      )}
                    >
                      {matchingRecord.effective_permission}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Download Right:</span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold flex items-center gap-1',
                        matchingRecord.can_download ? 'text-emerald' : 'text-text-muted'
                      )}
                    >
                      {matchingRecord.can_download ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Prohibited
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Grant Expiration:</span>
                    <span className="text-text-secondary font-medium">
                      {matchingRecord.expiration || 'Never'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-text-muted font-medium">
                    Authorization Rationale
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle/50 p-2.5 rounded-xl border border-border">
                    {matchingRecord.reason || 'Authorized by active workspace role membership'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 3. DEFAULT STATE (NOTHING SELECTED) */
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-primary mx-auto flex items-center justify-center border border-border shadow-2xs">
              <KeyRound className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Select Node or Edge
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-xs mx-auto">
                Click any identity node or relationship link on the graph to inspect the verified authorization chain and effective privileges.
              </p>
            </div>

            {/* Target Document Quick Snapshot */}
            <div className="p-3 bg-surface-subtle/70 rounded-xl border border-border text-left space-y-2 mt-4 text-xs">
              <div className="text-[10px] uppercase font-bold text-text-muted">Target Document</div>
              <p className="font-bold text-text-primary truncate" title={data.document.name}>
                {data.document.name}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-border/80 text-[11px] text-text-muted">
                <span>Authorized Identities:</span>
                <span className="font-bold text-text-primary">{data.total_authorized_identities}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Assurance Notice */}
      <div className="pt-4 border-t border-border mt-6">
        <div className="p-3 rounded-xl bg-primary-soft/50 border border-primary/15 text-[11px] text-text-secondary flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="leading-snug">
            Permissions evaluated deterministically via central access-control engine. Revoked or expired grants do not authorize document operations.
          </span>
        </div>
      </div>
    </div>
  );
}
