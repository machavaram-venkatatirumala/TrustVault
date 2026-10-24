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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { IntegrityBadge } from './IntegrityBadge';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { DocumentItem } from '../../types';
import { formatBytes, formatDate } from '../../lib/formatters';

interface DocumentDetailsModalProps {
  document: DocumentItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DocumentDetailsModal({ document: doc, open, onClose, onRefresh }: DocumentDetailsModalProps) {
  const { success, error, warning } = useToast();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  if (!doc) return null;

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
        warning('Integrity Alert!', res.message);
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="truncate">{doc.original_filename}</DialogTitle>
          </div>
          <DialogDescription>
            Cryptographic provenance, storage metadata, and real-time SHA-256 verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-medium bg-surface-subtle/50 border border-border text-xs">
            <div>
              <span className="text-text-muted block text-[11px]">File Size</span>
              <span className="font-semibold text-text-primary">{formatBytes(doc.size_bytes)}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">MIME Type</span>
              <span className="font-semibold text-text-primary truncate block" title={doc.content_type}>
                {doc.content_type.split('/')[1]?.toUpperCase() || doc.content_type}
              </span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Owner</span>
              <span className="font-semibold text-text-primary truncate block">{doc.owner_name || 'You'}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Uploaded</span>
              <span className="font-semibold text-text-primary">{formatDate(doc.created_at)}</span>
            </div>
          </div>

          {/* Authoritative SHA-256 Digest Box */}
          <div className="p-3.5 rounded-medium border border-border bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                Authoritative SHA-256 Hash
              </span>
              <button
                onClick={handleCopyHash}
                className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Full Hash'}
              </button>
            </div>
            <div className="p-2.5 rounded-small bg-surface-subtle border border-border/80 font-mono text-[11px] text-text-primary break-all select-all">
              {doc.sha256_hash}
            </div>
          </div>

          {/* Real-time Verification Section */}
          <div className="p-4 rounded-medium border border-border bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Integrity Status
              </span>
              <IntegrityBadge status={doc.last_verification_status} />
            </div>

            {verificationResult && (
              <div
                className={`p-3 rounded-small text-xs border ${
                  verificationResult.verified
                    ? 'bg-success-bg border-success/30 text-success'
                    : 'bg-danger-bg border-danger/30 text-danger'
                }`}
              >
                <p className="font-semibold">{verificationResult.message}</p>
                {!verificationResult.verified && verificationResult.computed_hash && (
                  <p className="mt-1 font-mono text-[10px] break-all">
                    Computed Hash: {verificationResult.computed_hash}
                  </p>
                )}
              </div>
            )}

            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerify}
                loading={verifying}
                className="w-full text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Verify Cryptographic Integrity
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
