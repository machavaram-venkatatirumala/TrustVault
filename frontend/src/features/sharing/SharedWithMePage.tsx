import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, Download, Eye, FileText, Lock, Search, Copy, Check, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { SharedDocumentItem } from '../../types';
import { formatBytes, formatDate } from '../../lib/formatters';

function getFileTypeTheme(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) {
    return { label: 'PDF', bg: 'bg-rose-50 text-rose-600 border border-rose-200' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { label: 'DOC', bg: 'bg-blue-50 text-[#3155D9] border border-blue-200' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { label: 'SHEET', bg: 'bg-emerald-50 text-[#16865B] border border-emerald-200' };
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return { label: 'IMG', bg: 'bg-purple-50 text-[#8B72D9] border border-purple-200' };
  }
  return { label: ext.toUpperCase() || 'FILE', bg: 'bg-teal-50 text-[#0F9D91] border border-teal-200' };
}

export function SharedWithMePage() {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: () => api.permissions.sharedWithMe(),
  });

  const rawDocs = data?.documents || [];

  const documents = useMemo(() => {
    if (!search.trim()) return rawDocs;
    const q = search.trim().toLowerCase();
    return rawDocs.filter(
      (d) =>
        d.document_name.toLowerCase().includes(q) ||
        d.owner_name.toLowerCase().includes(q) ||
        d.owner_email?.toLowerCase().includes(q)
    );
  }, [rawDocs, search]);

  const handleDownload = async (doc: SharedDocumentItem) => {
    try {
      await api.documents.download(doc.document_id, doc.document_name);
      success('Download Complete', `Saved ${doc.document_name}`);
    } catch (err: any) {
      error('Download Denied', err.message);
    }
  };

  const handleCopyHash = (doc: SharedDocumentItem) => {
    navigator.clipboard.writeText(doc.sha256_hash);
    setCopiedId(doc.permission_id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20263A]">
            Shared With Me
          </h2>
          <p className="mt-0.5 text-xs text-[#747C90]">
            Documents you have been explicitly granted permission to view or download by teammates.
          </p>
        </div>
      </div>

      {/* Search Input */}
      {rawDocs.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search shared files by name or owner..."
              leftIcon={<Search className="w-4 h-4 text-[#747C90]" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
              className="text-xs text-[#747C90] hover:text-[#20263A] gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#747C90]">Loading shared documents...</div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={Share2}
            title={search ? 'No matching shared documents' : 'No documents shared with you'}
            description={
              search
                ? 'Try adjusting your search query.'
                : 'When colleagues grant you view or download access to confidential files, they will appear in this verified list.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                <TableHead className="text-[#20263A] font-semibold">Document</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Owner</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Size</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Permission Level</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Date Shared</TableHead>
                <TableHead className="text-right text-[#20263A] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const theme = getFileTypeTheme(doc.document_name);

                return (
                  <TableRow key={doc.permission_id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${theme.bg}`}
                        >
                          {theme.label}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[#20263A] block truncate max-w-[220px]">
                            {doc.document_name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#747C90]">
                            <span className="truncate max-w-[160px]">{doc.sha256_hash}</span>
                            <button
                              onClick={() => handleCopyHash(doc)}
                              className="text-[#747C90] hover:text-[#3155D9]"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedId === doc.permission_id ? (
                                <Check className="w-3 h-3 text-[#16865B]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-semibold text-[#20263A] block">{doc.owner_name}</span>
                      {doc.owner_email && (
                        <span className="text-[11px] text-[#747C90] block">{doc.owner_email}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-[#20263A] whitespace-nowrap">
                      {formatBytes(doc.size_bytes)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          doc.can_download
                            ? 'bg-blue-50 text-[#3155D9] border border-blue-200'
                            : 'bg-slate-100 text-[#747C90]'
                        }`}
                      >
                        {doc.can_download ? (
                          <>
                            <Download className="w-3 h-3" />
                            Download
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            View Only
                          </>
                        )}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
                      {formatDate(doc.shared_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      {doc.can_download ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="h-8 text-xs gap-1.5 border-[#E8EAF1] text-[#3155D9] hover:bg-slate-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-xs text-[#747C90] inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#747C90]" />
                          View Only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
