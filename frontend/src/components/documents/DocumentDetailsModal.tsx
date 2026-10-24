import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Clock,
  UserCheck,
  HardDrive,
  RefreshCw,
  Users,
  Eye,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { IntegrityBadge } from './IntegrityBadge';
import { ShareModal } from './ShareModal';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { DocumentItem } from '../../types';
import { formatBytes, formatDate } from '../../lib/formatters';

interface DocumentDetailsModalProps {
  document: DocumentItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DocumentDetailsModal({ document: doc, open, onClose, onRefresh }: DocumentDetailsModalProps) {
  const { user, isAdmin } = useAuth();
  const { success, error, warning } = useToast();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  if (!doc) return null;

  const isOwner = doc.owner_id === user?.id;
  const canManage = isOwner || isAdmin;
  const permissions = doc.permissions || [];

  const handleCopyHash = () => {
    navigator.clipboard.writeText(doc.sha256_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.documents.verifyIntegrity(doc.id);
      setVerificationResult(res);
      if (res.verified) {
        success('Integrity Verified', res.message);
      } else {
        warning('Cryptographic Mismatch Alert!', res.message);
      }
      onRefresh();
    } catch (err: any) {
      error('Verification Failed', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      await api.documents.download(doc.id, doc.original_filename);
      success('Download Started', `Saved ${doc.original_filename}`);
    } catch (err: any) {
      error('Download Failed', err.message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl bg-white border-[#E8EAF1] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3155D9]/10 text-[#3155D9] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <DialogTitle className="truncate text-[#20263A] text-lg">
                {doc.original_filename}
              </DialogTitle>
            </div>
            <DialogDescription className="text-[#747C90] text-xs">
              Cryptographic provenance, storage metadata, active access grants, and real-time SHA-256 verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] text-xs">
              <div>
                <span className="text-[#747C90] block text-[11px] mb-0.5">File Size</span>
                <span className="font-semibold text-[#20263A]">{formatBytes(doc.size_bytes)}</span>
              </div>
              <div>
                <span className="text-[#747C90] block text-[11px] mb-0.5">Format</span>
                <span className="font-semibold text-[#20263A] truncate block" title={doc.content_type}>
                  {doc.content_type.split('/')[1]?.toUpperCase() || doc.content_type}
                </span>
              </div>
              <div>
                <span className="text-[#747C90] block text-[11px] mb-0.5">Owner</span>
                <span className="font-semibold text-[#20263A] truncate block">
                  {isOwner ? 'You (Owner)' : doc.owner_name || 'Teammate'}
                </span>
              </div>
              <div>
                <span className="text-[#747C90] block text-[11px] mb-0.5">Uploaded</span>
                <span className="font-semibold text-[#20263A]">{formatDate(doc.created_at)}</span>
              </div>
            </div>

            {/* Authoritative SHA-256 Digest Box */}
            <div className="p-3.5 rounded-xl border border-[#E8EAF1] bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#747C90] flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#3155D9]" />
                  Authoritative SHA-256 Hash
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-xs text-[#3155D9] hover:text-[#2544B8] font-medium flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16865B]" /> : <Copy className="w-3.5 h-3.5 text-[#747C90]" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Full Hash'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E8EAF1] font-mono text-[11px] text-[#20263A] break-all select-all">
                {doc.sha256_hash}
              </div>
            </div>

            {/* Real-time Verification Section */}
            <div className="p-4 rounded-xl border border-[#E8EAF1] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#747C90] block">
                    Integrity Status
                  </span>
                  <span className="text-[11px] text-[#747C90]">
                    Verified against the backend storage SHA-256 fingerprint
                  </span>
                </div>
                <IntegrityBadge status={doc.last_verification_status} />
              </div>

              {verificationResult && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    verificationResult.verified
                      ? 'bg-emerald-50 border-emerald-200 text-[#16865B]'
                      : 'bg-rose-50 border-rose-200 text-[#E56D5D]'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    {verificationResult.verified ? (
                      <ShieldCheck className="w-4 h-4 text-[#16865B]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#E56D5D]" />
                    )}
                    {verificationResult.message}
                  </p>
                  {!verificationResult.verified && verificationResult.computed_hash && (
                    <p className="mt-1.5 font-mono text-[10px] break-all bg-white/70 p-2 rounded">
                      Calculated Hash: {verificationResult.computed_hash}
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleVerify}
                loading={verifying}
                className="w-full text-xs gap-1.5 bg-[#3155D9] hover:bg-[#2544B8] text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Run On-Demand SHA-256 Integrity Verification
              </Button>
            </div>

            {/* Active Sharing Grants Section */}
            <div className="p-4 rounded-xl border border-[#E8EAF1] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#747C90] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0F9D91]" />
                  Active Access Grants ({permissions.length})
                </span>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareModalOpen(true)}
                    className="h-7 text-xs gap-1 border-[#E8EAF1] text-[#3155D9]"
                  >
                    <Share2 className="w-3 h-3" />
                    Share Document
                  </Button>
                )}
              </div>

              {permissions.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#747C90] bg-[#F7F8FC] rounded-lg border border-[#E8EAF1]">
                  This document is currently private. No external teammates have active access grants.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="p-2.5 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#20263A] block">{perm.recipient_name}</span>
                        <span className="text-[11px] text-[#747C90] block">{perm.recipient_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            perm.permission_level === 'download'
                              ? 'bg-blue-50 text-[#3155D9] border border-blue-200'
                              : 'bg-slate-100 text-[#747C90]'
                          }`}
                        >
                          {perm.permission_level === 'download' ? 'Download' : 'View Only'}
                        </span>
                        {perm.expires_at && (
                          <span className="text-[10px] text-[#747C90] flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(perm.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-[#E8EAF1] pt-3">
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#E8EAF1]">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 bg-[#3155D9] hover:bg-[#2544B8] text-white"
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embedded Share Modal */}
      {canManage && (
        <ShareModal
          document={doc}
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
