import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LayoutGrid,
  List,
  ArrowUpDown,
  Lock,
  Users,
  Copy,
  Check,
  Calendar,
  History,
  RotateCcw,
  Network,
  CheckSquare,
  Tag,
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
import { DocumentVersionsModal } from '../../components/documents/DocumentVersionsModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { DocumentItem } from '../../types';
import { formatBytes, formatDate, truncateHash } from '../../lib/formatters';

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
  if (['txt', 'log', 'md'].includes(ext)) {
    return { label: 'TEXT', bg: 'bg-amber-50 text-[#D99022] border border-amber-200' };
  }
  return { label: ext.toUpperCase() || 'FILE', bg: 'bg-teal-50 text-[#0F9D91] border border-teal-200' };
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<'active' | 'trash'>('active');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [sharingStatus, setSharingStatus] = useState<'all' | 'shared' | 'private'>('all');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);

  const getClassificationBadge = (cls?: string) => {
    const level = (cls || 'Internal').toLowerCase();
    switch (level) {
      case 'restricted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Restricted</span>;
      case 'confidential':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Confidential</span>;
      case 'public':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Public</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Internal</span>;
    }
  };

  // Modals state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<DocumentItem | null>(null);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<DocumentItem | null>(null);
  const [selectedDocForVersions, setSelectedDocForVersions] = useState<DocumentItem | null>(null);
  const [selectedDocForRename, setSelectedDocForRename] = useState<DocumentItem | null>(null);
  const [selectedDocForDelete, setSelectedDocForDelete] = useState<DocumentItem | null>(null);
  const [selectedDocForPurge, setSelectedDocForPurge] = useState<DocumentItem | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

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
        per_page: 24,
      }),
  });

  // Fetch trash list
  const { data: trashData, isLoading: isTrashLoading, refetch: refetchTrash } = useQuery({
    queryKey: ['documents-trash'],
    queryFn: () => api.documents.trash.list(),
  });

  const trashDocuments: DocumentItem[] = (trashData as any)?.trash || (trashData as any)?.documents || [];

  const handleRestoreFromTrash = async (doc: DocumentItem) => {
    try {
      await api.documents.trash.restore(doc.id);
      success('Document Restored', `${doc.original_filename} restored to active repository.`);
      refetch();
      refetchTrash();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Restore Failed', err.message || 'Could not restore document.');
    }
  };

  const confirmPurge = async () => {
    if (!selectedDocForPurge) return;
    setPurging(true);
    try {
      await api.documents.trash.purge(selectedDocForPurge.id);
      success('Purged Permanently', `${selectedDocForPurge.original_filename} purged from storage and records.`);
      setSelectedDocForPurge(null);
      refetchTrash();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Purge Failed', err.message || 'Could not purge document.');
    } finally {
      setPurging(false);
    }
  };

  const rawDocuments = data?.documents || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  // Filter and sort client-side on the page results
  const filteredAndSortedDocs = useMemo(() => {
    let result = [...rawDocuments];

    // Filter by sharing status
    if (sharingStatus === 'shared') {
      result = result.filter((d) => (d.permissions?.length || 0) > 0);
    } else if (sharingStatus === 'private') {
      result = result.filter((d) => (d.permissions?.length || 0) === 0);
    }

    // Filter by classification
    if (classificationFilter) {
      result = result.filter(
        (d) => (d.classification || 'Internal').toLowerCase() === classificationFilter.toLowerCase()
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return a.original_filename.localeCompare(b.original_filename);
        case 'name_desc':
          return b.original_filename.localeCompare(a.original_filename);
        case 'size_desc':
          return (b.size_bytes || 0) - (a.size_bytes || 0);
        case 'size_asc':
          return (a.size_bytes || 0) - (b.size_bytes || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [rawDocuments, sharingStatus, classificationFilter, sortBy]);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await api.documents.download(doc.id, doc.original_filename);
      success('Download Started', `Downloaded ${doc.original_filename}`);
    } catch (err: any) {
      error('Download Denied', err.message);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDocForDelete) return;
    setDeleting(true);
    try {
      await api.documents.delete(selectedDocForDelete.id);
      success('Document Deleted', `${selectedDocForDelete.original_filename} has been securely removed.`);
      setSelectedDocForDelete(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    } catch (err: any) {
      error('Delete Failed', err.message);
    } finally {
      setDeleting(false);
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

  const handleCopyHash = (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.sha256_hash);
    setCopiedHashId(doc.id);
    setTimeout(() => setCopiedHashId(null), 1800);
  };

  const hasActiveFilters = Boolean(
    search || fileType || sharingStatus !== 'all' || classificationFilter || sortBy !== 'newest'
  );

  const handleResetFilters = () => {
    setSearch('');
    setFileType('');
    setSharingStatus('all');
    setClassificationFilter('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Upload Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20263A]">
            Document Repository
          </h2>
          <p className="mt-0.5 text-xs text-[#747C90]">
            Manage confidential organization files, granular access grants, version lifecycle, and cryptographic SHA-256 integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSection === 'active' && (
            <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5 text-xs bg-[#3155D9] hover:bg-[#2544B8] text-white">
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Switcher: Active Repository vs Trash & Recovery */}
      <div className="flex items-center gap-2 border-b border-[#E8EAF1] pb-3">
        <button
          onClick={() => setActiveSection('active')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeSection === 'active'
              ? 'bg-[#3155D9] text-white shadow-sm'
              : 'bg-white border border-[#E8EAF1] text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Active Repository
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSection === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#747C90]'}`}>
            {total}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('trash')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeSection === 'trash'
              ? 'bg-[#D99022] text-white shadow-sm'
              : 'bg-white border border-[#E8EAF1] text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Trash & Recovery
          {trashDocuments.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSection === 'trash' ? 'bg-white/20 text-white' : 'bg-amber-100 text-[#D99022]'}`}>
              {trashDocuments.length}
            </span>
          )}
        </button>
      </div>

      {activeSection === 'trash' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-[#D99022] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-[#20263A]">
                Document Retention & Recovery Zone
              </p>
              <p className="text-[11px] text-[#747C90] mt-0.5 leading-relaxed">
                Soft-deleted files are held in this recovery area. Restoring a file immediately re-enables it in the active library while preserving historical version snapshots. Permanent purge cryptographically purges private storage objects and records irreversible deletion in the audit chain.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
            {isTrashLoading ? (
              <div className="p-12 text-center text-xs text-[#747C90]">Loading recovery area...</div>
            ) : trashDocuments.length === 0 ? (
              <EmptyState
                icon={Trash2}
                title="Trash is empty"
                description="No soft-deleted documents found in your workspace retention queue."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                    <TableHead className="text-[#20263A] font-semibold">Document</TableHead>
                    <TableHead className="text-[#20263A] font-semibold">Deleted Date</TableHead>
                    <TableHead className="text-[#20263A] font-semibold">Size</TableHead>
                    <TableHead className="text-[#20263A] font-semibold">SHA-256 Digest</TableHead>
                    <TableHead className="text-right text-[#20263A] font-semibold">Recovery Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-semibold text-xs text-[#20263A]">
                        {doc.original_filename}
                      </TableCell>
                      <TableCell className="text-xs text-[#747C90]">
                        {formatDate(doc.deleted_at || doc.updated_at)}
                      </TableCell>
                      <TableCell className="text-xs text-[#20263A]">
                        {formatBytes(doc.size_bytes)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-[#747C90]">
                        {truncateHash(doc.sha256_hash, 8, 8)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreFromTrash(doc)}
                            className="h-7 text-xs border-[#E8EAF1] text-[#16865B] hover:bg-emerald-50 gap-1.5 font-medium"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedDocForPurge(doc)}
                              className="h-7 text-xs text-[#E56D5D] hover:bg-rose-50 gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Purge
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter, Search & View Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            placeholder="Search documents by filename..."
            leftIcon={<Search className="w-4 h-4 text-[#747C90]" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Type Filter */}
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="">All Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="wordprocessingml">Word Documents (.docx)</option>
            <option value="spreadsheetml">Excel Sheets (.xlsx)</option>
            <option value="text">Plain Text (.txt)</option>
          </select>

          {/* Sharing Status Filter */}
          <select
            value={sharingStatus}
            onChange={(e) => setSharingStatus(e.target.value as any)}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="all">All Sharing States</option>
            <option value="shared">Shared with Others</option>
            <option value="private">Private Only</option>
          </select>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="">All Classifications</option>
            <option value="Public">Public</option>
            <option value="Internal">Internal</option>
            <option value="Confidential">Confidential</option>
            <option value="Restricted">Restricted</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
            <option value="size_desc">Size: Largest</option>
            <option value="size_asc">Size: Smallest</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-[#747C90] hover:text-[#20263A] gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-[#E8EAF1] bg-white p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#3155D9]/10 text-[#3155D9] font-medium'
                  : 'text-[#747C90] hover:text-[#20263A]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#3155D9]/10 text-[#3155D9] font-medium'
                  : 'text-[#747C90] hover:text-[#20263A]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table vs Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#747C90] bg-white border border-[#E8EAF1] rounded-xl shadow-sm">
          Loading documents...
        </div>
      ) : filteredAndSortedDocs.length === 0 ? (
        <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
          <EmptyState
            icon={FileText}
            title={hasActiveFilters ? 'No matching documents' : 'No documents in repository'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search query, format filters, or sharing status.'
                : 'Your secure document library starts here. Upload your first document to calculate its cryptographic SHA-256 fingerprint.'
            }
            actionLabel="Upload Document"
            onAction={() => setUploadOpen(true)}
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedDocs.map((doc) => {
            const isOwner = doc.owner_id === user?.id;
            const canManage = isOwner || isAdmin;
            const activePermCount = doc.permissions?.length || 0;
            const theme = getFileTypeTheme(doc.original_filename);

            return (
              <div
                key={doc.id}
                className="group relative rounded-xl border border-[#E8EAF1] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#3155D9]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Type Badge & Actions Menu */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${theme.bg}`}>
                      {theme.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded text-[#747C90] hover:text-[#20263A] hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedDocForDetails(doc)}>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect & Verify</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedDocForVersions(doc)}>
                          <History className="w-3.5 h-3.5 text-[#3155D9]" />
                          <span>Version History & Diff</span>
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
                            <DropdownMenuItem destructive onClick={() => setSelectedDocForDelete(doc)}>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Document</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title & Hash */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <button
                      onClick={() => setSelectedDocForDetails(doc)}
                      className="font-semibold text-sm text-[#20263A] hover:text-[#3155D9] transition-colors line-clamp-1 text-left block flex-1"
                      title={doc.original_filename}
                    >
                      {doc.original_filename}
                    </button>
                    {getClassificationBadge(doc.classification)}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#747C90] bg-[#F7F8FC] px-2 py-1 rounded border border-[#E8EAF1] mb-3">
                    <span className="truncate">{truncateHash(doc.sha256_hash, 6, 6)}</span>
                    <button
                      onClick={(e) => handleCopyHash(doc, e)}
                      title="Copy SHA-256 Hash"
                      className="ml-auto text-[#747C90] hover:text-[#3155D9]"
                    >
                      {copiedHashId === doc.id ? (
                        <Check className="w-3 h-3 text-[#16865B]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Meta stats */}
                  <div className="space-y-1.5 text-xs text-[#747C90] pt-1">
                    <div className="flex items-center justify-between">
                      <span>Size</span>
                      <span className="font-medium text-[#20263A]">{formatBytes(doc.size_bytes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[#20263A]">
                        {isOwner ? 'You' : doc.owner_name || 'Teammate'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Uploaded</span>
                      <span className="text-[#747C90]">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Integrity & Share Badges */}
                <div className="mt-4 pt-3 border-t border-[#E8EAF1] flex items-center justify-between">
                  <IntegrityBadge
                    status={doc.last_verification_status}
                    onClick={() => setSelectedDocForDetails(doc)}
                  />
                  {activePermCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0F9D91]/10 text-[#0F9D91]">
                      <Users className="w-3 h-3" />
                      {activePermCount} {activePermCount === 1 ? 'Share' : 'Shares'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-[#747C90]">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                <TableHead className="text-[#20263A] font-semibold">Document</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Classification</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Owner</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Size</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Uploaded</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Integrity</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Sharing</TableHead>
                <TableHead className="text-right text-[#20263A] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDocs.map((doc) => {
                const isOwner = doc.owner_id === user?.id;
                const canManage = isOwner || isAdmin;
                const activePermCount = doc.permissions?.length || 0;
                const theme = getFileTypeTheme(doc.original_filename);

                return (
                  <TableRow key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Document Name & Type Badge */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${theme.bg}`}
                        >
                          {theme.label}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedDocForDetails(doc)}
                              className="font-semibold text-xs text-[#20263A] hover:text-[#3155D9] transition-colors truncate block text-left"
                            >
                              {doc.original_filename}
                            </button>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[#3155D9] border border-blue-200 text-[10px] font-mono font-bold shrink-0">
                              v{doc.current_version_number || 1}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#747C90] block truncate max-w-[220px]">
                            {doc.sha256_hash}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Classification */}
                    <TableCell>
                      {getClassificationBadge(doc.classification)}
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="text-xs text-[#747C90]">
                      {isOwner ? (
                        <span className="font-semibold text-[#20263A]">You</span>
                      ) : (
                        doc.owner_name || 'Team member'
                      )}
                    </TableCell>

                    {/* Size */}
                    <TableCell className="text-xs text-[#20263A] whitespace-nowrap">
                      {formatBytes(doc.size_bytes)}
                    </TableCell>

                    {/* Uploaded */}
                    <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0F9D91]/10 text-[#0F9D91]">
                          <Users className="w-3 h-3" />
                          {activePermCount} {activePermCount === 1 ? 'Grant' : 'Grants'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#747C90]">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      )}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4 text-[#747C90]" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDocForDetails(doc)}>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect & Verify</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => setSelectedDocForVersions(doc)}>
                            <History className="w-3.5 h-3.5 text-[#3155D9]" />
                            <span>Version History & Diff</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate(`/app/access-explorer?document_id=${doc.id}`)}>
                            <Network className="w-3.5 h-3.5 text-blue-600" />
                            <span>Access Explorer</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate('/app/approvals')}>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approval Workflows</span>
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
                              <DropdownMenuItem destructive onClick={() => setSelectedDocForDelete(doc)}>
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
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="h-12 border border-[#E8EAF1] bg-white rounded-xl px-4 flex items-center justify-between text-xs text-[#747C90]">
          <span>
            Showing {filteredAndSortedDocs.length} of {total} documents
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs border-[#E8EAF1]"
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-[#20263A]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs border-[#E8EAF1]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Share Modal */}
      <ShareModal
        document={selectedDocForShare}
        open={Boolean(selectedDocForShare)}
        onClose={() => setSelectedDocForShare(null)}
      />

      {/* Document Details Modal / Drawer */}
      <DocumentDetailsModal
        document={selectedDocForDetails}
        open={Boolean(selectedDocForDetails)}
        onClose={() => setSelectedDocForDetails(null)}
        onRefresh={() => refetch()}
      />

      {/* Document Versions Modal / Lifecycle Drawer */}
      <DocumentVersionsModal
        document={selectedDocForVersions}
        isOpen={Boolean(selectedDocForVersions)}
        onClose={() => setSelectedDocForVersions(null)}
        isAdmin={isAdmin}
      />

      {/* Rename Document Dialog */}
      <Dialog open={Boolean(selectedDocForRename)} onOpenChange={(open) => !open && setSelectedDocForRename(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <form onSubmit={handleSaveRename}>
            <DialogHeader>
              <DialogTitle className="text-[#20263A]">Rename Document</DialogTitle>
              <DialogDescription className="text-[#747C90]">
                Update the display filename. The underlying private storage key and cryptographic SHA-256 hash will remain unchanged.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#20263A] tracking-tight">
                  New Filename
                </label>
                <Input
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="confidential-report.pdf"
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
                className="border-[#E8EAF1]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={renaming}
                disabled={!newFilename.trim()}
                className="bg-[#3155D9] hover:bg-[#2544B8] text-white"
              >
                Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accessible Delete Confirmation Dialog */}
      <Dialog open={Boolean(selectedDocForDelete)} onOpenChange={(open) => !open && setSelectedDocForDelete(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E56D5D] flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-[#20263A]">Delete Document</DialogTitle>
            <DialogDescription className="text-[#747C90] space-y-2">
              <p>
                Are you sure you want to permanently delete <strong className="text-[#20263A]">{selectedDocForDelete?.original_filename}</strong>?
              </p>
              <p className="text-xs text-[#E56D5D] bg-rose-50/70 p-2.5 rounded border border-rose-200">
                This action is irreversible. All active sharing permissions will be revoked immediately and the audit trail will record this deletion.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDocForDelete(null)}
              disabled={deleting}
              className="border-[#E8EAF1]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={confirmDelete}
              className="bg-[#E56D5D] hover:bg-[#D4594A] text-white"
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Purge Confirmation Dialog */}
      <Dialog open={Boolean(selectedDocForPurge)} onOpenChange={(open) => !open && setSelectedDocForPurge(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E56D5D] flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-[#20263A]">Permanently Purge Document</DialogTitle>
            <DialogDescription className="text-[#747C90] space-y-2">
              <p>
                Are you sure you want to permanently erase <strong className="text-[#20263A]">{selectedDocForPurge?.original_filename}</strong> from storage and database records?
              </p>
              <p className="text-xs text-[#E56D5D] bg-rose-50/70 p-2.5 rounded border border-rose-200">
                This operation is irreversible. All historical version snapshots and cryptographic blobs will be deleted.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDocForPurge(null)}
              disabled={purging}
              className="border-[#E8EAF1]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={purging}
              onClick={confirmPurge}
              className="bg-[#E56D5D] hover:bg-[#D4594A] text-white"
            >
              Permanently Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
