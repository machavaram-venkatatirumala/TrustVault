import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Download,
  Trash2,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  HardDrive,
  User,
  Fingerprint,
  RefreshCw,
  Clock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { api, ApiError } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/formatters';
import { DocumentItem, DocumentPermissionItem, IntegrityVerificationResult } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [permissions, setPermissions] = useState<DocumentPermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Integrity & verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchDoc = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const doc = await api.documents.get(id);
      setDocument(doc);
      try {
        const perms = await api.permissions.listForDoc(id);
        setPermissions(perms.permissions || []);
      } catch {
        // Non-owner might not be permitted to view full permission table
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load document details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const handleCopyHash = () => {
    if (!document?.sha256_hash) return;
    navigator.clipboard.writeText(document.sha256_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await api.documents.verifyIntegrity(id);
      setVerificationResult(res);
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              last_verification_status: res.status,
              last_verified_at: res.verified_at,
            }
          : null
      );
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    setDownloading(true);
    try {
      await api.documents.download(document.id, document.original_filename);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleRevokePermission = async (permId: string) => {
    if (!confirm('Are you sure you want to immediately revoke access for this user?')) return;
    try {
      await api.permissions.revoke(permId);
      setPermissions((prev) => prev.filter((p) => p.id !== permId));
    } catch (err: any) {
      alert(err.message || 'Failed to revoke permission');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-6 w-32 bg-surface-subtle animate-pulse rounded" />
        <div className="h-48 bg-surface-subtle animate-pulse rounded-large" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link
          to="/app/documents"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>
        <div className="p-6 rounded-large bg-danger-bg border border-danger/20 text-xs text-danger space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Document Unavailable</span>
          </div>
          <p>{error || 'The requested document does not exist or you lack authorization to access it.'}</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === document.owner_id;
  const canManage = isOwner || isAdmin;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/documents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Document Library</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="text-xs gap-1.5 shadow-subtle"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Decrypting...' : 'Download Secure Copy'}</span>
          </Button>
        </div>
      </div>

      {/* Main Document Header Card */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-medium bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {document.original_filename}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-text-muted">
                <span>{document.content_type}</span>
                <span>•</span>
                <span>{formatBytes(document.size_bytes)}</span>
                <span>•</span>
                <span>Uploaded {formatDate(document.created_at)}</span>
              </div>
            </div>
          </div>

          <div>
            {document.last_verification_status === 'verified' ? (
              <Badge variant="success" className="text-xs gap-1 py-1 px-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SHA-256 Verified</span>
              </Badge>
            ) : document.last_verification_status === 'mismatch' ? (
              <Badge variant="danger" className="text-xs gap-1 py-1 px-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Integrity Mismatch</span>
              </Badge>
            ) : (
              <Badge variant="neutral" className="text-xs py-1 px-2.5">
                <span>Verification Ready</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Cryptographic SHA-256 Digest Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                SHA-256 Cryptographic Digest
              </span>
            </div>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'Copied to Clipboard' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 font-mono text-xs text-text-primary break-all select-all">
            {document.sha256_hash}
          </div>
        </div>

        {/* Integrity Verification Action Panel */}
        <div className="p-4 rounded-medium bg-surface-blue/30 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-text-primary">
              On-Demand Server-Side Byte Verification
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Streams raw bytes from the private storage volume, re-computes the SHA-256 digest on the server, and validates against the original receipt.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleVerify}
            disabled={verifying}
            className="text-xs gap-1.5 shrink-0 bg-white dark:bg-elevated"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin text-primary' : ''}`} />
            <span>{verifying ? 'Verifying Stream...' : 'Verify Content Now'}</span>
          </Button>
        </div>

        {/* Verification Result Feedback */}
        {verificationResult && (
          <div
            className={`p-4 rounded-medium border text-xs ${
              verificationResult.verified
                ? 'bg-surface-green border-success/20 text-success-text'
                : 'bg-danger-bg border-danger/20 text-danger'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-1">
              {verificationResult.verified ? (
                <ShieldCheck className="w-4 h-4 text-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-danger" />
              )}
              <span>{verificationResult.message}</span>
            </div>
            <p className="text-[11px] font-mono break-all mt-1">
              Computed: {verificationResult.computed_hash || 'Unavailable'}
            </p>
          </div>
        )}
      </div>

      {/* Permissions & Sharing Management Section */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-secondary" />
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Document Access & Permissions
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Members with granted permissions can access this document according to their specified privilege level.
            </p>
          </div>
          {canManage && (
            <Link to="/app/sharing">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Manage in Sharing Center</span>
              </Button>
            </Link>
          )}
        </div>

        {permissions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-medium text-xs text-text-muted">
            <p>No external permissions currently granted for this document.</p>
            <p className="text-[11px] mt-1 text-text-secondary">Only the document owner and organization administrators have access.</p>
          </div>
        ) : (
          <div className="border border-border rounded-medium overflow-hidden divide-y divide-border text-xs">
            {permissions.map((perm) => (
              <div key={perm.id} className="p-4 flex items-center justify-between hover:bg-surface-subtle transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{perm.recipient_name || 'Member'}</span>
                    <span className="text-text-muted text-[11px]">({perm.recipient_email})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <Badge variant={perm.permission_level === 'download' ? 'success' : 'neutral'} className="text-[10px] uppercase">
                      {perm.permission_level}
                    </Badge>
                    <span>•</span>
                    <span>Granted {formatDate(perm.created_at)}</span>
                    {perm.expires_at && (
                      <>
                        <span>•</span>
                        <span className="text-warm font-medium">Expires {formatDate(perm.expires_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokePermission(perm.id)}
                    className="text-xs text-danger hover:text-danger hover:bg-danger-bg"
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
