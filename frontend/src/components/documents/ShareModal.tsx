import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, UserCheck, Trash2, Eye, Download, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { DocumentItem, OrganizationMembership } from '../../types';
import { formatDate } from '../../lib/formatters';

interface ShareModalProps {
  document: DocumentItem | null;
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ document: doc, open, onClose }: ShareModalProps) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [recipientId, setRecipientId] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'download'>('view');
  const [granting, setGranting] = useState(false);

  // Fetch members of current organization
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.members.list(),
    enabled: open,
  });

  // Fetch permissions for this specific document
  const { data: permissionsData, refetch: refetchPermissions } = useQuery({
    queryKey: ['permissions', doc?.id],
    queryFn: () => api.permissions.listForDoc(doc!.id),
    enabled: Boolean(open && doc?.id),
  });

  const members = membersData?.members || [];
  const permissions = permissionsData?.permissions || [];
  const activePermissions = permissions.filter((p) => p.is_active);

  // Filter out document owner from eligible recipient list
  const eligibleMembers = members.filter(
    (m) => m.user_id !== doc?.owner_id && m.status === 'active'
  );

  useEffect(() => {
    if (eligibleMembers.length > 0 && !recipientId) {
      setRecipientId(eligibleMembers[0].user_id);
    }
  }, [eligibleMembers, recipientId]);

  const handleGrant = async () => {
    if (!doc || !recipientId) return;

    setGranting(true);
    try {
      await api.permissions.grant(doc.id, {
        recipient_user_id: recipientId,
        permission_level: permissionLevel,
      });
      success('Permission Granted', `Access granted to selected recipient.`);
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Grant Failed', err.message);
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (permissionId: string) => {
    try {
      await api.permissions.revoke(permissionId);
      success('Permission Revoked', 'Recipient can no longer access this document.');
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Revocation Failed', err.message);
    }
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Confidential Document</DialogTitle>
          <DialogDescription>
            Grant intentional view or download access to specific verified members of your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Document Summary Card */}
          <div className="p-3 rounded-medium bg-surface-subtle/60 border border-border flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{doc.original_filename}</p>
              <p className="text-[11px] text-text-muted mt-0.5 font-mono truncate">{doc.sha256_hash}</p>
            </div>
            <Badge variant="neutral" className="capitalize text-[11px] shrink-0">
              Owner: {doc.owner_name || 'You'}
            </Badge>
          </div>

          {/* New Grant Section */}
          <div className="p-4 rounded-medium border border-border bg-white space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Grant New Access
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Recipient Member
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full h-9 rounded-small border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {eligibleMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_name} ({m.user_email})
                    </option>
                  ))}
                  {eligibleMembers.length === 0 && (
                    <option disabled>No other members available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Permission Level
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPermissionLevel('view')}
                    className={`flex-1 h-9 rounded-small border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      permissionLevel === 'view'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white border-border text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionLevel('download')}
                    className={`flex-1 h-9 rounded-small border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      permissionLevel === 'download'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white border-border text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleGrant}
              disabled={!recipientId || eligibleMembers.length === 0}
              loading={granting}
              className="w-full text-xs"
            >
              Grant Access
            </Button>
          </div>

          {/* Active Grants List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <span>Active Permissions ({activePermissions.length})</span>
            </h4>

            {activePermissions.length === 0 ? (
              <p className="text-xs text-text-muted italic p-3 text-center border border-dashed border-border rounded-small">
                No active external grants. Only owner and admins can access this file.
              </p>
            ) : (
              <div className="border border-border rounded-small divide-y divide-border overflow-hidden">
                {activePermissions.map((perm) => (
                  <div key={perm.id} className="p-3 flex items-center justify-between bg-white text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-text-primary truncate">
                        {perm.recipient_name || 'Member'}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">{perm.recipient_email}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Granted {formatDate(perm.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={perm.permission_level === 'download' ? 'info' : 'neutral'}>
                        {perm.permission_level === 'download' ? 'Download' : 'View Only'}
                      </Badge>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        onClick={() => handleRevoke(perm.id)}
                        className="h-7 px-2 text-xs"
                        title="Revoke access immediately"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
