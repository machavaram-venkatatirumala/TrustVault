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
  Network,
  CheckCircle2,
  Shield,
  Link as LinkIcon,
  Tag
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { api, ApiError } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/formatters';
import type { DocumentItem, DocumentPermissionItem, IntegrityVerificationResult, ClassificationLevel } from '../../types';
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

  // Enterprise features state
  const [classificationModal, setClassificationModal] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<ClassificationLevel>('Internal');
  const [classificationReason, setClassificationReason] = useState('');
  const [updatingClassification, setUpdatingClassification] = useState(false);
  const [classificationSuccess, setClassificationSuccess] = useState<string | null>(null);

  // Signed URL State
  const [signedUrlModal, setSignedUrlModal] = useState(false);
  const [signedUrlExpiresIn, setSignedUrlExpiresIn] = useState(900); // 15 mins default
  const [generatedSignedUrl, setGeneratedSignedUrl] = useState<string | null>(null);
  const [signedUrlExpiresAt, setSignedUrlExpiresAt] = useState<string | null>(null);
  const [generatingSignedUrl, setGeneratingSignedUrl] = useState(false);
  const [copiedSignedUrl, setCopiedSignedUrl] = useState(false);

  const fetchDoc = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const doc = await api.documents.get(id);
      setDocument(doc);
      setSelectedClassification((doc.classification as ClassificationLevel) || 'Internal');
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

  const handleUpdateClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setUpdatingClassification(true);
      const res = await api.classification.update(
        id,
        selectedClassification,
        classificationReason.trim() || undefined
      );
      setDocument((prev) => (prev ? { ...prev, classification: res.classification } : null));
      setClassificationSuccess(`Classification updated to ${res.classification}`);
      setTimeout(() => setClassificationSuccess(null), 3000);
      setClassificationModal(false);
      setClassificationReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to update classification');
    } finally {
      setUpdatingClassification(false);
    }
  };

  const handleGenerateSignedUrl = async () => {
    if (!id) return;
    try {
      setGeneratingSignedUrl(true);
      const res = await api.enterprise.generateSignedUrl(id, signedUrlExpiresIn);
      setGeneratedSignedUrl(res.signed_url);
      setSignedUrlExpiresAt(res.expires_at);
    } catch (err: any) {
      alert(err.message || 'Failed to generate signed download link');
    } finally {
      setGeneratingSignedUrl(false);
    }
  };

  const handleCopySignedUrl = () => {
    if (!generatedSignedUrl) return;
    navigator.clipboard.writeText(generatedSignedUrl);
    setCopiedSignedUrl(true);
    setTimeout(() => setCopiedSignedUrl(false), 2000);
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
        <div className="h-6 w-32 bg-slate-100 animate-pulse rounded" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link
          to="/app/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
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

  const getClassificationBadge = (cls?: string) => {
    const level = (cls || 'Internal').toLowerCase();
    switch (level) {
      case 'restricted':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Restricted</span>;
      case 'confidential':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Confidential</span>;
      case 'public':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Public</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Internal</span>;
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/app/documents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Document Library</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/app/access-explorer?document_id=${document.id}`}>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 bg-white shadow-xs">
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>Access Explorer</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSignedUrlModal(true);
              handleGenerateSignedUrl();
            }}
            className="text-xs gap-1.5 bg-white shadow-xs"
          >
            <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Signed URL</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="text-xs gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Decrypting...' : 'Download Secure Copy'}</span>
          </Button>
        </div>
      </div>

      {classificationSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {classificationSuccess}
        </div>
      )}

      {/* Main Document Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {document.original_filename}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                <span>{document.content_type}</span>
                <span>•</span>
                <span>{formatBytes(document.size_bytes)}</span>
                <span>•</span>
                <span>Uploaded {formatDate(document.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Classification Badge with Edit Option */}
            <div className="flex items-center gap-1.5">
              {getClassificationBadge(document.classification)}
              {canManage && (
                <button
                  onClick={() => setClassificationModal(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Modify Document Classification"
                >
                  <Tag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Verification Status */}
            {document.last_verification_status === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                SHA-256 Verified
              </span>
            ) : document.last_verification_status === 'mismatch' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Integrity Mismatch
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                Ready to Verify
              </span>
            )}
          </div>
        </div>

        {/* Cryptographic SHA-256 Digest Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                SHA-256 Cryptographic Digest
              </span>
            </div>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'Copied to Clipboard' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 break-all select-all">
            {document.sha256_hash}
          </div>
        </div>

        {/* Integrity Verification Action Panel */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900">
              On-Demand Server-Side Byte Verification
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Streams raw bytes from the private storage volume, re-computes the SHA-256 digest on the server, and validates against the original receipt.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleVerify}
            disabled={verifying}
            className="text-xs gap-1.5 shrink-0 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin text-blue-600' : ''}`} />
            <span>{verifying ? 'Verifying Stream...' : 'Verify Content Now'}</span>
          </Button>
        </div>

        {/* Verification Result Feedback */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border text-xs ${
              verificationResult.verified
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-1">
              {verificationResult.verified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Document Access & Permissions
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Authorized users and collaborators with active access grants.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/app/access-explorer?document_id=${document.id}`}>
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <Network className="w-3.5 h-3.5 text-blue-600" />
                <span>Access Explorer</span>
              </Button>
            </Link>
            {canManage && (
              <Link to="/app/sharing">
                <Button size="sm" variant="outline" className="text-xs gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Document</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {permissions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            <p>No external permissions currently granted for this document.</p>
            <p className="text-[11px] mt-1 text-slate-500">Only the document owner and organization administrators have access.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            {permissions.map((perm) => (
              <div key={perm.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{perm.recipient_name || 'Member'}</span>
                    <span className="text-slate-400 text-[11px]">({perm.recipient_email})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Badge variant={perm.permission_level === 'download' ? 'success' : 'neutral'} className="text-[10px] uppercase">
                      {perm.permission_level}
                    </Badge>
                    <span>•</span>
                    <span>Granted {formatDate(perm.created_at)}</span>
                    {perm.expires_at && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">Expires {formatDate(perm.expires_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokePermission(perm.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classification Edit Modal */}
      {classificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Change Document Classification</h3>
            <p className="text-xs text-slate-500">
              Updating sensitivity level activates security policies and download restrictions.
            </p>

            <form onSubmit={handleUpdateClassification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Classification Level *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Public', 'Internal', 'Confidential', 'Restricted'] as ClassificationLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedClassification(lvl)}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        selectedClassification === lvl
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Justification / Audit Reason {selectedClassification === 'Public' || selectedClassification === 'Internal' ? '(Required for Downgrade)' : ''}
                </label>
                <textarea
                  value={classificationReason}
                  onChange={(e) => setClassificationReason(e.target.value)}
                  placeholder="e.g., Reviewed by compliance lead; information is approved for internal release."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClassificationModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingClassification}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingClassification ? 'Updating...' : 'Save Classification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signed URL Modal */}
      {signedUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-teal-600" />
              Temporary Signed Download URL
            </h3>
            <p className="text-xs text-slate-500">
              Generates a time-bound, cryptographically signed URL allowing direct download without exposing user credentials.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Lifetime
                </label>
                <select
                  value={signedUrlExpiresIn}
                  onChange={(e) => {
                    setSignedUrlExpiresIn(Number(e.target.value));
                    handleGenerateSignedUrl();
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={900}>15 Minutes</option>
                  <option value={3600}>1 Hour</option>
                  <option value={14400}>4 Hours</option>
                  <option value={86400}>24 Hours</option>
                </select>
              </div>

              {generatingSignedUrl ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                  Issuing signed storage token...
                </div>
              ) : generatedSignedUrl ? (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-all">
                    {generatedSignedUrl}
                  </div>
                  {signedUrlExpiresAt && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Expires at: {new Date(signedUrlExpiresAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleCopySignedUrl}
                disabled={!generatedSignedUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-50"
              >
                {copiedSignedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSignedUrl ? 'Copied' : 'Copy Signed URL'}
              </button>

              <button
                type="button"
                onClick={() => setSignedUrlModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
