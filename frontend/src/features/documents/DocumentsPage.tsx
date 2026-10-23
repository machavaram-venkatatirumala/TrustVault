import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Search,
  FileText,
  MoreVertical,
  Download,
  Share2,
  ShieldCheck,
  Trash2,
  Eye,
  Filter,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { EmptyState } from '../../components/ui/empty-state';
import { IntegrityBadge } from '../../components/documents/IntegrityBadge';
import { UploadModal } from '../../components/documents/UploadModal';
import { ShareModal } from '../../components/documents/ShareModal';
import { DocumentDetailsModal } from '../../components/documents/DocumentDetailsModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { DocumentItem } from '../../types';
import { formatBytes, formatDate, getFileExtension } from '../../lib/formatters';

export function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<DocumentItem | null>(null);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<DocumentItem | null>(null);
  const [selectedDocForRename, setSelectedDocForRename] = useState<DocumentItem | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [renaming, setRenaming] = useState(false);

  const handleStartRename = (doc: DocumentItem) => {
    setSelectedDocForRename(doc);
    setNewFilename(doc.original_filename);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForRename || !newFilename.trim()) return;

    setRenaming(true);
    try {
      await api.documents.rename(selectedDocForRename.id, newFilename.trim());
      success('Document Renamed', 'Filename updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocForRename(null);
    } catch (err: any) {
      error('Rename Failed', err.message);
    } finally {
      setRenaming(false);
    }
  };

  // Fetch document list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents', { search, fileType, page }],
    queryFn: () =>
      api.documents.list({
        search: search.trim() || undefined,
        file_type: fileType || undefined,
        page,
        per_page: 20,
      }),
  });

  const documents = data?.documents || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await api.documents.download(doc.id, doc.original_filename);
      success('Download Started', `Downloaded ${doc.original_filename}`);
    } catch (err: any) {
      error('Download Denied', err.message);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.original_filename}? Access grants will be revoked.`)) {
      return;
    }
    try {
      await api.documents.delete(doc.id);
      success('Document Deleted', `${doc.original_filename} has been removed.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  const handleVerify = async (doc: DocumentItem) => {
    try {
      const res = await api.documents.verifyIntegrity(doc.id);
      if (res.verified) {
        success('Integrity Verified', res.message);
      } else {
        error('Cryptographic Mismatch!', res.message);
      }
      refetch();
    } catch (err: any) {
      error('Verification Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Upload Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Document Repository
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Manage your organization's confidential files, access grants, and cryptographic integrity.
          </p>
        </div>

        <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by filename..."
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
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-small border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="wordprocessingml">Word Documents (.docx)</option>
            <option value="spreadsheetml">Excel Spreadsheets (.xlsx)</option>
            <option value="text">Plain Text (.txt)</option>
          </select>

          {(search || fileType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFileType('');
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

      {/* Document Table Card */}
      <div className="rounded-medium border border-border bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading documents...</div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search || fileType ? 'No matching documents' : 'No documents yet'}
            description={
              search || fileType
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Upload your first document to begin managing access and verifying integrity.'
            }
            actionLabel="Upload document"
            onAction={() => setUploadOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Integrity</TableHead>
                <TableHead>Sharing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const isOwner = doc.owner_id === user?.id;
                const canManage = isOwner || isAdmin;
                const activePermCount = doc.permissions?.length || 0;

                return (
                  <TableRow key={doc.id}>
                    {/* Document Name & Type Badge */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-small bg-primary-soft text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {getFileExtension(doc.original_filename)}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedDocForDetails(doc)}
                            className="font-semibold text-xs text-text-primary hover:text-primary transition-colors truncate block text-left"
                          >
                            {doc.original_filename}
                          </button>
                          <span className="text-[11px] font-mono text-text-muted block truncate max-w-[200px]">
                            {doc.sha256_hash}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="text-xs text-text-secondary">
                      {isOwner ? (
                        <span className="font-semibold text-text-primary">You</span>
                      ) : (
                        doc.owner_name || 'Team member'
                      )}
                    </TableCell>

                    {/* Size */}
                    <TableCell className="text-xs text-text-secondary whitespace-nowrap">
                      {formatBytes(doc.size_bytes)}
                    </TableCell>

                    {/* Uploaded */}
                    <TableCell className="text-xs text-text-muted whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </TableCell>

                    {/* Integrity Badge */}
                    <TableCell>
                      <IntegrityBadge
                        status={doc.last_verification_status}
                        onClick={() => setSelectedDocForDetails(doc)}
                      />
                    </TableCell>

                    {/* Sharing State */}
                    <TableCell>
                      {activePermCount > 0 ? (
                        <Badge variant="info" className="text-[11px]">
                          {activePermCount} {activePermCount === 1 ? 'Grant' : 'Grants'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-muted">Private</span>
                      )}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-text-secondary" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDocForDetails(doc)}>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect & Verify</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </DropdownMenuItem>

                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => setSelectedDocForShare(doc)}>
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Manage Access</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartRename(doc)}>
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Rename Document</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuItem onClick={() => handleVerify(doc)}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Quick SHA-256 Check</span>
                          </DropdownMenuItem>

                          {canManage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem destructive onClick={() => handleDelete(doc)}>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Document</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="h-12 border-t border-border px-4 flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing {documents.length} of {total} documents
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

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      <ShareModal
        document={selectedDocForShare}
        open={Boolean(selectedDocForShare)}
        onClose={() => setSelectedDocForShare(null)}
      />

      <DocumentDetailsModal
        document={selectedDocForDetails}
        open={Boolean(selectedDocForDetails)}
        onClose={() => setSelectedDocForDetails(null)}
        onRefresh={() => refetch()}
      />

      {/* Rename Document Dialog */}
      <Dialog open={Boolean(selectedDocForRename)} onOpenChange={(open) => !open && setSelectedDocForRename(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveRename}>
            <DialogHeader>
              <DialogTitle>Rename Document</DialogTitle>
              <DialogDescription>
                Update the display filename. The underlying private storage key and cryptographic hash will remain unchanged.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary tracking-tight">
                  New Filename
                </label>
                <Input
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="Filename.pdf"
                  required
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDocForRename(null)}
                disabled={renaming}
              >
                Cancel
              </Button>
              <Button type="submit" loading={renaming} disabled={!newFilename.trim()}>
                Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
