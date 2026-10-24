import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  History,
  Upload,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { DocumentItem, DocumentVersionItem, VersionDiffResult } from '../../types';
import { formatDate, formatBytes } from '../../lib/formatters';

interface DocumentVersionsModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function DocumentVersionsModal({
  document,
  isOpen,
  onClose,
  isAdmin = false,
}: DocumentVersionsModalProps) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'history' | 'upload' | 'compare'>('history');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [compareV1, setCompareV1] = useState<string>('');
  const [compareV2, setCompareV2] = useState<string>('');
  const [diffResult, setDiffResult] = useState<VersionDiffResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Fetch all versions
  const { data, isLoading } = useQuery({
    queryKey: ['document-versions', document?.id],
    queryFn: () => (document ? api.documents.versions.list(document.id) : null),
    enabled: isOpen && Boolean(document?.id),
  });

  const versions: DocumentVersionItem[] = data?.versions || [];

  // Upload new version mutation
  const uploadVersionMutation = useMutation({
    mutationFn: async () => {
      if (!document || !selectedFile) throw new Error('File required');
      return api.documents.versions.create(document.id, selectedFile, changeSummary.trim() || undefined);
    },
    onSuccess: (newVersion) => {
      success('Version Uploaded', `Version ${newVersion.version_number} created successfully.`);
      setSelectedFile(null);
      setChangeSummary('');
      setActiveTab('history');
      queryClient.invalidateQueries({ queryKey: ['document-versions', document?.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      error('Upload Failed', err.message || 'Could not upload new version.');
    },
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      if (!document) throw new Error('Document required');
      return api.documents.versions.restore(document.id, versionId);
    },
    onSuccess: (restoredVersion) => {
      success(
        'Version Restored',
        `Restored historical content as Version ${restoredVersion.version_number}. Previous history preserved.`
      );
      queryClient.invalidateQueries({ queryKey: ['document-versions', document?.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      error('Restore Failed', err.message || 'Could not restore version.');
    },
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRunCompare = async () => {
    if (!document || !compareV1 || !compareV2) return;
    setIsComparing(true);
    try {
      const res = await api.documents.versions.compare(document.id, compareV1, compareV2);
      setDiffResult(res);
    } catch (err: any) {
      error('Comparison Failed', err.message || 'Unable to compare versions.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white border-[#E8EAF1] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[#E8EAF1] bg-[#F7F8FC]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#3155D9]/10 text-[#3155D9] flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#20263A]">
                  Version Lifecycle: {document?.original_filename}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#747C90]">
                  Immutable version lineage with SHA-256 integrity hashes, non-destructive restoration, and differential comparison.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#3155D9] shadow-sm border border-[#E8EAF1]'
                  : 'text-[#747C90] hover:text-[#20263A]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Version History ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-[#3155D9] shadow-sm border border-[#E8EAF1]'
                  : 'text-[#747C90] hover:text-[#20263A]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload New Version
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                if (versions.length >= 2 && !compareV1 && !compareV2) {
                  setCompareV1(versions[1].id);
                  setCompareV2(versions[0].id);
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-white text-[#3155D9] shadow-sm border border-[#E8EAF1]'
                  : 'text-[#747C90] hover:text-[#20263A]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Versions
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#747C90]">Loading versions...</div>
          ) : activeTab === 'history' ? (
            <div className="space-y-3">
              {versions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#747C90]">
                  No versions recorded for this document.
                </div>
              ) : (
                versions.map((ver) => {
                  const isCurrent = ver.version_number === (document?.current_version_number || 1);
                  return (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-[#3155D9]/40 bg-[#3155D9]/5 shadow-sm'
                          : 'border-[#E8EAF1] bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#20263A]">
                              Version {ver.version_number}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-[#3155D9] text-white text-[10px] font-semibold">
                                Current Head
                              </Badge>
                            )}
                            <Badge
                              className={`text-[10px] font-medium ${
                                ver.scan_status === 'clean'
                                  ? 'bg-emerald-50 text-[#16865B] border border-emerald-200'
                                  : 'bg-rose-50 text-[#E56D5D] border border-rose-200'
                              }`}
                            >
                              {ver.scan_status === 'clean' ? 'Scan Clean' : ver.scan_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#20263A] font-medium">
                            {ver.change_summary || 'Standard version update'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#747C90] pt-1">
                            <span>{formatBytes(ver.size_bytes)}</span>
                            <span>•</span>
                            <span>{ver.creator_name || 'System'}</span>
                            <span>•</span>
                            <span>{formatDate(ver.created_at)}</span>
                          </div>
                        </div>

                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoreVersionMutation.isPending}
                            onClick={() => restoreVersionMutation.mutate(ver.id)}
                            className="text-xs border-[#E8EAF1] hover:bg-slate-50 gap-1.5 shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#3155D9]" />
                            Restore as New
                          </Button>
                        )}
                      </div>

                      {/* Hash pill */}
                      <div className="mt-2.5 pt-2.5 border-t border-[#E8EAF1]/70 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[#747C90] truncate max-w-[80%]">
                          SHA-256: {ver.sha256_hash}
                        </span>
                        <button
                          onClick={() => handleCopyHash(ver.sha256_hash)}
                          className="text-[#3155D9] hover:underline flex items-center gap-1 font-medium"
                        >
                          {copiedHash === ver.sha256_hash ? (
                            <>
                              <Check className="w-3 h-3 text-[#16865B]" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-[#3155D9]/40 bg-[#3155D9]/5 text-center">
                <input
                  type="file"
                  id="version-file-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
                <label
                  htmlFor="version-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-[#3155D9] flex items-center justify-center shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[#3155D9]">
                      Click to choose replacement file
                    </span>
                    <p className="text-[11px] text-[#747C90] mt-0.5">
                      Uploaded content will be assigned Version {(document?.current_version_number || 1) + 1}.
                    </p>
                  </div>
                </label>
                {selectedFile && (
                  <div className="mt-2 p-2 rounded-lg bg-white border border-[#E8EAF1] inline-flex items-center gap-2 text-xs font-semibold text-[#20263A]">
                    <FileText className="w-4 h-4 text-[#3155D9]" />
                    {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20263A] mb-1">
                  Change Summary / Version Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Updated indemnification clauses in Section 4.2"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E8EAF1] px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className="border-[#E8EAF1]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile || uploadVersionMutation.isPending}
                  onClick={() => uploadVersionMutation.mutate()}
                  className="bg-[#3155D9] hover:bg-[#3155D9]/90 text-white font-semibold"
                >
                  {uploadVersionMutation.isPending ? 'Uploading & Hashing...' : 'Create New Version'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-[#747C90] mb-1">
                    Base Version
                  </label>
                  <select
                    value={compareV1}
                    onChange={(e) => setCompareV1(e.target.value)}
                    className="w-full h-8 rounded-md border border-[#E8EAF1] bg-white px-2 text-xs text-[#20263A]"
                  >
                    <option value="">Select Base</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        Version {v.version_number} ({formatBytes(v.size_bytes)})
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-4 h-4 text-[#747C90] shrink-0 mt-4" />

                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-[#747C90] mb-1">
                    Target Version
                  </label>
                  <select
                    value={compareV2}
                    onChange={(e) => setCompareV2(e.target.value)}
                    className="w-full h-8 rounded-md border border-[#E8EAF1] bg-white px-2 text-xs text-[#20263A]"
                  >
                    <option value="">Select Target</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        Version {v.version_number} ({formatBytes(v.size_bytes)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="shrink-0 mt-4">
                  <Button
                    size="sm"
                    disabled={!compareV1 || !compareV2 || compareV1 === compareV2 || isComparing}
                    onClick={handleRunCompare}
                    className="h-8 text-xs bg-[#3155D9] text-white"
                  >
                    {isComparing ? 'Comparing...' : 'Run Diff'}
                  </Button>
                </div>
              </div>

              {diffResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-3 rounded-lg bg-white border border-[#E8EAF1]">
                      <span className="text-[#747C90] text-[11px] block">Cryptographic Match</span>
                      <span
                        className={`font-bold ${
                          diffResult.hash_identical ? 'text-[#16865B]' : 'text-[#D99022]'
                        }`}
                      >
                        {diffResult.hash_identical ? 'Identical Hashes' : 'Hashes Differ'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E8EAF1]">
                      <span className="text-[#747C90] text-[11px] block">Size Delta</span>
                      <span className="font-bold text-[#20263A]">
                        {diffResult.size_delta_bytes >= 0 ? `+` : ''}
                        {formatBytes(diffResult.size_delta_bytes)}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E8EAF1]">
                      <span className="text-[#747C90] text-[11px] block">Comparison Mode</span>
                      <span className="font-bold text-[#3155D9]">
                        {diffResult.is_text_comparable ? 'Unified Text Diff' : 'Metadata Hash Diff'}
                      </span>
                    </div>
                  </div>

                  {diffResult.unified_diff ? (
                    <div>
                      <span className="text-[11px] font-semibold text-[#747C90] block mb-1">
                        Unified Diff Output
                      </span>
                      <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed whitespace-pre">
                        {diffResult.unified_diff}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E8EAF1] text-xs space-y-2">
                      <p className="font-semibold text-[#20263A]">
                        Binary File Comparison Summary
                      </p>
                      <div className="font-mono text-[11px] space-y-1">
                        <div>
                          Base v{diffResult.base_version}: {diffResult.base_info.sha256_hash} (
                          {formatBytes(diffResult.base_info.size_bytes)})
                        </div>
                        <div>
                          Target v{diffResult.target_version}: {diffResult.target_info.sha256_hash} (
                          {formatBytes(diffResult.target_info.size_bytes)})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-[#E8EAF1] bg-[#F7F8FC]/50">
          <Button variant="outline" size="sm" onClick={onClose} className="border-[#E8EAF1]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
