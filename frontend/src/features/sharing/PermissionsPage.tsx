import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldAlert, Trash2, Eye, Download, CheckCircle2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/formatters';

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // Fetch all documents to aggregate their active permission grants
  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'all_permissions'],
    queryFn: () => api.documents.list({ page: 1, per_page: 50 }),
  });

  const documents = data?.documents || [];

  // Flatten active permissions from all returned documents
  const allPermissions = documents.flatMap((doc) =>
    (doc.permissions || []).map((p) => ({
      ...p,
      document_name: doc.original_filename,
    }))
  );

  const handleRevoke = async (permissionId: string) => {
    try {
      await api.permissions.revoke(permissionId);
      success('Permission Revoked', 'Access has been revoked immediately.');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Revocation Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Access Permissions & Active Grants
        </h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Monitor and manage all active authorization policies and sharing grants across your workspace.
        </p>
      </div>

      <div className="rounded-medium border border-border bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading permissions...</div>
        ) : allPermissions.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No active permission grants"
            description="You have not granted access to any external teammates yet. Share documents from the Document Repository."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Grantor</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Granted Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell className="font-semibold text-xs text-text-primary">
                    {perm.document_name}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium text-text-primary block">{perm.recipient_name}</span>
                    <span className="text-[11px] text-text-muted block">{perm.recipient_email}</span>
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {perm.grantor_name || 'Owner'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={perm.permission_level === 'download' ? 'info' : 'neutral'}>
                      {perm.permission_level === 'download' ? (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          View Only
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted whitespace-nowrap">
                    {formatDate(perm.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="danger-outline"
                      size="sm"
                      onClick={() => handleRevoke(perm.id)}
                      className="h-7 text-xs gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Revoke Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
