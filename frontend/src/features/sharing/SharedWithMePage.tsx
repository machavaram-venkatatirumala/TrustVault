import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, Download, Eye, FileText, Lock } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { SharedDocumentItem } from '../../types';
import { formatBytes, formatDate, getFileExtension } from '../../lib/formatters';

export function SharedWithMePage() {
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: () => api.permissions.sharedWithMe(),
  });

  const documents = data?.documents || [];

  const handleDownload = async (doc: SharedDocumentItem) => {
    try {
      await api.documents.download(doc.document_id, doc.document_name);
      success('Download Complete', `Saved ${doc.document_name}`);
    } catch (err: any) {
      error('Download Denied', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Shared With Me
        </h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Documents you have been explicitly granted permission to view or download by teammates.
        </p>
      </div>

      <div className="rounded-medium border border-border bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading shared documents...</div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={Share2}
            title="No documents shared with you"
            description="When colleagues grant you view or download access to confidential files, they will appear in this verified list."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Permission Level</TableHead>
                <TableHead>Date Shared</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.permission_id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-small bg-primary-soft text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                        {getFileExtension(doc.document_name)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-text-primary block truncate">
                          {doc.document_name}
                        </span>
                        <span className="text-[11px] font-mono text-text-muted block truncate max-w-[200px]">
                          {doc.sha256_hash}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <span className="font-medium text-text-primary">{doc.owner_name}</span>
                    {doc.owner_email && (
                      <span className="text-[11px] text-text-muted block">{doc.owner_email}</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-text-secondary whitespace-nowrap">
                    {formatBytes(doc.size_bytes)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={doc.can_download ? 'info' : 'neutral'}>
                      {doc.can_download ? (
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
                    {formatDate(doc.shared_at)}
                  </TableCell>

                  <TableCell className="text-right">
                    {doc.can_download ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="text-xs gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    ) : (
                      <span className="text-xs text-text-muted inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-text-muted" />
                        View Only
                      </span>
                    )}
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
