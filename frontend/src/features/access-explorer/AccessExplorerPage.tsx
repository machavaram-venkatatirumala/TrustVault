import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Info,
  ShieldAlert,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  AccessExplorerData,
  AccessGraphNode,
  AccessGraphLink,
  EffectivePermissionRecord,
  DocumentItem,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { AccessExplorerHeader } from './components/AccessExplorerHeader';
import { AccessSummaryStrip } from './components/AccessSummaryStrip';
import { RelationshipGraph } from './components/RelationshipGraph';
import { RelationshipInspector } from './components/RelationshipInspector';
import { EffectivePermissionsTable } from './components/EffectivePermissionsTable';
import { Button } from '../../components/ui/button';

export function AccessExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [data, setData] = useState<AccessExplorerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View state: 'graph' or 'table'
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');

  // Summary and Graph active filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'inherited' | 'manage' | 'revoked'>('all');

  // Selected entities for contextual inspector
  const [selectedNode, setSelectedNode] = useState<AccessGraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<AccessGraphLink | null>(null);

  // 1. Initial Load: Fetch authorized documents list
  useEffect(() => {
    let isMounted = true;
    async function loadDocuments() {
      try {
        const res = await api.documents.list({ per_page: 100 });
        if (!isMounted) return;
        const docs = res.documents || [];
        setDocuments(docs);

        const urlDocId = searchParams.get('document_id');
        if (urlDocId && docs.some((d) => d.id === urlDocId)) {
          setSelectedDocId(urlDocId);
        } else if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load documents list:', err);
        setErrorMessage('Unable to load document directory. Please verify your permissions.');
        setIsLoading(false);
      }
    }
    loadDocuments();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // 2. Fetch Access Graph & Effective Permissions when selectedDocId changes
  const fetchGraphData = useCallback(
    async (isManualRefresh = false) => {
      if (!selectedDocId) {
        setIsLoading(false);
        return;
      }

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const res = await api.accessExplorer.getGraph(selectedDocId);
        setData(res);

        // Pre-select central document node if nothing selected
        if (res.graph.nodes.length > 0) {
          setSelectedNode(res.graph.nodes[0]);
          setSelectedLink(null);
        }

        if (isManualRefresh) {
          toastSuccess('Access topology & effective permissions re-evaluated');
        }
      } catch (err: any) {
        console.error('Failed to fetch access explorer graph:', err);
        const msg =
          err.response?.data?.error ||
          err.message ||
          'Failed to calculate access topology. You may not be authorized to view this document.';
        setErrorMessage(msg);
        toastError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDocId, toastError, toastSuccess]
  );

  useEffect(() => {
    fetchGraphData(false);
  }, [fetchGraphData]);

  // Handle document switch
  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    setSearchParams({ document_id: docId });
    setSelectedNode(null);
    setSelectedLink(null);
  };

  // Export effective permissions as CSV
  const handleExport = () => {
    if (!data) return;
    const docName = data.document.name || 'document';
    const headers = [
      'Document',
      'Identity Name',
      'Email',
      'Access Source',
      'Is Inherited',
      'Effective Permission',
      'Download Authorized',
      'Grant Status',
      'Expiration',
      'Rationale',
    ];

    const rows = data.table.map((r) => [
      `"${docName.replace(/"/g, '""')}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.access_source.replace(/"/g, '""')}"`,
      r.is_inherited ? 'Yes' : 'No',
      `"${r.effective_permission.toUpperCase()}"`,
      r.can_download ? 'Yes' : 'No',
      `"${r.status.toUpperCase()}"`,
      `"${(r.expiration || 'Never').replace(/"/g, '""')}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `access_topology_${docName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Effective permissions report downloaded');
  };

  // Handle row selection in Table mode to link with Inspector
  const handleSelectTableRow = (record: EffectivePermissionRecord) => {
    if (!data) return;
    const matchingNode = data.graph.nodes.find((n) => n.email === record.email);
    if (matchingNode) {
      setSelectedNode(matchingNode);
      setSelectedLink(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Document Selector & Actions */}
      <AccessExplorerHeader
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDoc={handleSelectDoc}
        onRefresh={() => fetchGraphData(true)}
        onExport={handleExport}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalIdentities={data ? data.total_authorized_identities : 0}
      />

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="py-28 flex flex-col items-center justify-center text-center bg-white border border-border rounded-2xl shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 animate-spin stroke-[2]" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">
            Evaluating Deterministic Access Topology...
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            Resolving direct permission grants, workspace memberships, and active guardrails from authoritative security service.
          </p>
        </div>
      ) : errorMessage ? (
        /* 3. Error State */
        <div className="py-16 px-6 text-center bg-white border border-border rounded-2xl shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-coral-pale text-coral-deep mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">Access Topology Unavailable</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">{errorMessage}</p>
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchGraphData(true)}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Evaluation</span>
            </Button>
          </div>
        </div>
      ) : !data || documents.length === 0 ? (
        /* 4. Empty State: No Documents Found */
        <div className="py-20 text-center bg-white border border-border rounded-2xl shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-text-muted mx-auto flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">No Documents Available</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Upload a document to your workspace to explore its access relationships, role inheritance, and effective permissions.
          </p>
        </div>
      ) : (
        /* 5. Main Content: Metrics Strip + Graph or Table */
        <div className="space-y-6">
          {/* Summary Strip of Authenticated Metrics */}
          <AccessSummaryStrip
            data={data}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Tab View: Graph with Side Inspector OR Table View */}
          {activeTab === 'graph' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* 2 Cols: Graph Canvas Workspace */}
              <div className="lg:col-span-2">
                <RelationshipGraph
                  data={data}
                  selectedNode={selectedNode}
                  selectedLink={selectedLink}
                  onSelectNode={setSelectedNode}
                  onSelectLink={setSelectedLink}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>

              {/* 1 Col: Relationship Details Inspector */}
              <div className="lg:col-span-1 h-full">
                <RelationshipInspector
                  data={data}
                  selectedNode={selectedNode}
                  selectedLink={selectedLink}
                  onClearSelection={() => {
                    setSelectedNode(null);
                    setSelectedLink(null);
                  }}
                />
              </div>
            </div>
          ) : (
            /* Table View: Full-width Effective Permissions Matrix */
            <div>
              <EffectivePermissionsTable
                records={data.table}
                documentName={data.document.name}
                onSelectRecord={handleSelectTableRow}
                selectedUserId={selectedNode?.id?.replace('user:', '')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
