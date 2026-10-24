import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  ShieldAlert,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  Ban,
  Mail,
  Search,
  Filter,
  UserCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/formatters';
import { DocumentPermissionItem } from '../../types';

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'expired' | 'revoked'>('active');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'view' | 'download'>('all');
  const [selectedPermForRevoke, setSelectedPermForRevoke] = useState<DocumentPermissionItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Fetch real sharing overview from backend
  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['permissions', 'overview'],
    queryFn: () => api.permissions.getOverview(),
  });

  const activeShares = overview?.active_shares || [];
  const expiredShares = overview?.expired_shares || [];
  const revokedShares = overview?.revoked_shares || [];
  const pendingInvitations = overview?.pending_invitations || [];
  const counts = overview?.counts || { active: 0, expired: 0, revoked: 0, pending: 0, total: 0 };

  // Current tab items
  const currentItems = useMemo(() => {
    let items: DocumentPermissionItem[] = [];
    if (activeTab === 'active') items = activeShares;
    else if (activeTab === 'expired') items = expiredShares;
    else if (activeTab === 'revoked') items = revokedShares;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.document_name?.toLowerCase().includes(q) ||
          item.recipient_name?.toLowerCase().includes(q) ||
          item.recipient_email?.toLowerCase().includes(q) ||
          item.grantor_name?.toLowerCase().includes(q)
      );
    }

    if (levelFilter !== 'all') {
      items = items.filter((item) => item.permission_level === levelFilter);
    }

    return items;
  }, [activeTab, activeShares, expiredShares, revokedShares, search, levelFilter]);

  const filteredInvitations = useMemo(() => {
    if (activeTab !== 'pending') return [];
    let items = pendingInvitations;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (inv) =>
          inv.user_name?.toLowerCase().includes(q) ||
          inv.user_email?.toLowerCase().includes(q) ||
          inv.role?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeTab, pendingInvitations, search]);

  const handleRevokeConfirm = async () => {
    if (!selectedPermForRevoke) return;
    setRevoking(true);
    try {
      await api.permissions.revoke(selectedPermForRevoke.id);
      success('Permission Revoked', 'Access has been revoked immediately.');
      setSelectedPermForRevoke(null);
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Revocation Error', err.message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20263A]">
          Sharing & Access Control Center
        </h2>
        <p className="mt-0.5 text-xs text-[#747C90]">
          Monitor and manage active sharing grants, pending invitations, expiration policies, and revoked credentials.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#E8EAF1] gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-[#3155D9] text-[#3155D9] font-semibold'
              : 'border-transparent text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <span>Active Shares</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              activeTab === 'active' ? 'bg-[#3155D9]/10 text-[#3155D9]' : 'bg-slate-100 text-[#747C90]'
            }`}
          >
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-[#3155D9] text-[#3155D9] font-semibold'
              : 'border-transparent text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <span>Pending Invitations</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              activeTab === 'pending' ? 'bg-[#3155D9]/10 text-[#3155D9]' : 'bg-slate-100 text-[#747C90]'
            }`}
          >
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'expired'
              ? 'border-[#3155D9] text-[#3155D9] font-semibold'
              : 'border-transparent text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <span>Expired Shares</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              activeTab === 'expired' ? 'bg-[#D99022]/10 text-[#D99022]' : 'bg-slate-100 text-[#747C90]'
            }`}
          >
            {counts.expired}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('revoked')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'revoked'
              ? 'border-[#3155D9] text-[#3155D9] font-semibold'
              : 'border-transparent text-[#747C90] hover:text-[#20263A]'
          }`}
        >
          <span>Revoked Shares</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              activeTab === 'revoked' ? 'bg-[#E56D5D]/10 text-[#E56D5D]' : 'bg-slate-100 text-[#747C90]'
            }`}
          >
            {counts.revoked}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by recipient email, member name, or document..."
            leftIcon={<Search className="w-4 h-4 text-[#747C90]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab !== 'pending' && (
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="all">All Access Levels</option>
            <option value="download">Download Access</option>
            <option value="view">View Only</option>
          </select>
        )}

        {(search || levelFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setLevelFilter('all');
            }}
            className="text-xs text-[#747C90] hover:text-[#20263A] gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#747C90]">Loading sharing records...</div>
        ) : activeTab === 'pending' ? (
          filteredInvitations.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No pending invitations"
              description="All workspace membership invitations have been accepted or no invitations are currently pending."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                  <TableHead className="text-[#20263A] font-semibold">Invited User</TableHead>
                  <TableHead className="text-[#20263A] font-semibold">Email Address</TableHead>
                  <TableHead className="text-[#20263A] font-semibold">Assigned Role</TableHead>
                  <TableHead className="text-[#20263A] font-semibold">Status</TableHead>
                  <TableHead className="text-[#20263A] font-semibold">Invited Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-semibold text-xs text-[#20263A]">{inv.user_name}</TableCell>
                    <TableCell className="text-xs text-[#747C90]">{inv.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={inv.role === 'admin' ? 'info' : 'neutral'} className="text-[11px] capitalize">
                        {inv.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-[#D99022] font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pending Acceptance
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
                      {formatDate(inv.joined_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : currentItems.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title={
              activeTab === 'active'
                ? 'No active sharing grants'
                : activeTab === 'expired'
                ? 'No expired sharing grants'
                : 'No revoked sharing grants'
            }
            description={
              activeTab === 'active'
                ? 'You have not shared any documents with teammates yet. Select a document from your library and click "Manage Access".'
                : activeTab === 'expired'
                ? 'No document shares have reached their expiration date.'
                : 'No permission grants have been revoked in this workspace.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                <TableHead className="text-[#20263A] font-semibold">Document</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Recipient</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Granted By</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Access Level</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Created</TableHead>
                <TableHead className="text-[#20263A] font-semibold">
                  {activeTab === 'revoked' ? 'Revocation Date' : 'Expiration'}
                </TableHead>
                {activeTab === 'active' && <TableHead className="text-right text-[#20263A] font-semibold">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((perm) => (
                <TableRow key={perm.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-semibold text-xs text-[#20263A]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#3155D9] shrink-0" />
                      <span className="truncate max-w-[200px]" title={perm.document_name || 'Document'}>
                        {perm.document_name || 'Document'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-semibold text-[#20263A] block">{perm.recipient_name}</span>
                    <span className="text-[11px] text-[#747C90] block">{perm.recipient_email}</span>
                  </TableCell>
                  <TableCell className="text-xs text-[#747C90]">
                    {perm.grantor_name || 'Owner'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        perm.permission_level === 'download'
                          ? 'bg-blue-50 text-[#3155D9] border border-blue-200'
                          : 'bg-slate-100 text-[#747C90]'
                      }`}
                    >
                      {perm.permission_level === 'download' ? (
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
                    {formatDate(perm.created_at)}
                  </TableCell>
                  <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
                    {activeTab === 'revoked' ? (
                      <span className="text-[#E56D5D] font-medium flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        {formatDate(perm.revoked_at)}
                      </span>
                    ) : perm.expires_at ? (
                      <span
                        className={`flex items-center gap-1 ${
                          activeTab === 'expired' ? 'text-[#D99022] font-medium' : 'text-[#747C90]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatDate(perm.expires_at)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Never expires</span>
                    )}
                  </TableCell>
                  {activeTab === 'active' && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPermForRevoke(perm)}
                        className="h-7 text-xs gap-1 border-rose-200 text-[#E56D5D] hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke Access
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Accessible Revocation Confirmation Dialog */}
      <Dialog open={Boolean(selectedPermForRevoke)} onOpenChange={(open) => !open && setSelectedPermForRevoke(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E56D5D] flex items-center justify-center mb-2">
              <Ban className="w-5 h-5" />
            </div>
            <DialogTitle className="text-[#20263A]">Revoke Access Grant</DialogTitle>
            <DialogDescription className="text-[#747C90] space-y-2">
              <p>
                Are you sure you want to revoke access for{' '}
                <strong className="text-[#20263A]">{selectedPermForRevoke?.recipient_email}</strong> to{' '}
                <strong className="text-[#20263A]">{selectedPermForRevoke?.document_name}</strong>?
              </p>
              <p className="text-xs text-[#E56D5D] bg-rose-50/70 p-2.5 rounded border border-rose-200">
                This revocation is enforced immediately on the server. The user will be unable to view or download this document on their next request.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedPermForRevoke(null)}
              disabled={revoking}
              className="border-[#E8EAF1]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={revoking}
              onClick={handleRevokeConfirm}
              className="bg-[#E56D5D] hover:bg-[#D4594A] text-white"
            >
              Revoke Grant Immediately
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
