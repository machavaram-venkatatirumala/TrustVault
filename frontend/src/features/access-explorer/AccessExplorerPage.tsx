import React, { useState, useEffect, useMemo } from 'react';
import {
  Network,
  Table as TableIcon,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  FileText,
  KeyRound,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  AccessExplorerData,
  EffectivePermissionRecord,
  AccessGraphNode,
  AccessGraphLink,
  DocumentItem,
  ClassificationLevel,
} from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export function AccessExplorerPage() {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [data, setData] = useState<AccessExplorerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');
  const [selectedNode, setSelectedNode] = useState<AccessGraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<AccessGraphLink | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<EffectivePermissionRecord | null>(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'inherited'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'manage' | 'download' | 'view'>('all');

  // Load documents list
  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await api.documents.list();
        setDocuments(res.documents || []);
        if (res.documents && res.documents.length > 0) {
          setSelectedDocId(res.documents[0].id);
        }
      } catch (err) {
        console.error('Failed to load documents list for Access Explorer:', err);
      }
    }
    loadDocs();
  }, []);

  // Fetch access graph data when selected document changes
  useEffect(() => {
    async function fetchGraph() {
      if (!selectedDocId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.accessExplorer.getGraph(selectedDocId);
        setData(res);
        if (res.graph.nodes.length > 0) {
          setSelectedNode(res.graph.nodes[0]);
        }
      } catch (err) {
        console.error('Failed to fetch access explorer graph:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraph();
  }, [selectedDocId]);

  const filteredRecords = useMemo(() => {
    if (!data?.table) return [];
    return data.table.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource =
        sourceFilter === 'all'
          ? true
          : sourceFilter === 'direct'
          ? !r.is_inherited
          : r.is_inherited;
      const matchesLevel =
        levelFilter === 'all' ? true : r.effective_permission === levelFilter;
      return matchesSearch && matchesSource && matchesLevel;
    });
  }, [data?.table, searchQuery, sourceFilter, levelFilter]);

  const getClassificationBadge = (cls?: ClassificationLevel) => {
    switch (cls) {
      case 'Restricted':
        return 'bg-coral/15 text-coral border-coral/30';
      case 'Confidential':
        return 'bg-amber/15 text-amber border-amber/30';
      case 'Internal':
        return 'bg-primary/10 text-primary border-primary/25';
      case 'Public':
        return 'bg-emerald/15 text-emerald border-emerald/30';
      default:
        return 'bg-surface-subtle text-text-secondary border-border';
    }
  };

  const getPermissionBadge = (perm: string) => {
    switch (perm) {
      case 'manage':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'download':
        return 'bg-teal/15 text-teal border-teal/30';
      case 'view':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-medium bg-primary/10 text-primary">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Access & Permission Explorer
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Visual relationship graph and server-computed effective permissions explaining how every identity gains access.
          </p>
        </div>

        {/* Document Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-text-secondary">Document:</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="text-xs font-medium bg-white border border-border rounded-medium px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs max-w-xs truncate"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.original_filename} ({doc.classification || 'Internal'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Container */}
      <div className="bg-white border border-border rounded-large shadow-xs overflow-hidden">
        {/* Top Control Bar */}
        <div className="border-b border-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-surface-subtle/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('graph')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-medium text-xs font-semibold transition-all',
                activeTab === 'graph'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white'
              )}
            >
              <Network className="w-3.5 h-3.5" />
              Relationship Graph
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-medium text-xs font-semibold transition-all',
                activeTab === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white'
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Effective Permissions Table
              {data && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {data.total_authorized_identities}
                </span>
              )}
            </button>
          </div>

          {data?.document && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-text-muted">Target:</span>
              <span className="font-semibold text-text-primary truncate max-w-[200px]">
                {data.document.name}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                  getClassificationBadge(data.document.classification)
                )}
              >
                {data.document.classification}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-7 h-7 text-primary animate-spin mb-3" />
            <p className="text-xs font-semibold text-text-primary">
              Computing effective permissions & resolving relationship edges...
            </p>
            <p className="text-[11px] text-text-muted mt-1">
              Evaluating direct grants, workspace memberships, and active guardrails
            </p>
          </div>
        ) : !data || data.graph.nodes.length === 0 ? (
          <div className="py-20 text-center text-text-muted">
            <Info className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">No document selected or access denied</p>
            <p className="text-xs text-text-secondary mt-1">
              Select an accessible document above to inspect its permission graph.
            </p>
          </div>
        ) : activeTab === 'graph' ? (
          /* Graph Mode with Side Panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-[520px]">
            {/* SVG Visual Relationship Graph (2 Cols) */}
            <div className="lg:col-span-2 relative bg-surface-subtle/25 p-6 flex items-center justify-center overflow-hidden select-none">
              <svg className="w-full h-[480px]" viewBox="0 0 700 480">
                <defs>
                  {/* Arrowheads for direct vs inherited */}
                  <marker
                    id="arrow-solid"
                    markerWidth="8"
                    markerHeight="8"
                    refX="20"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
                  </marker>
                  <marker
                    id="arrow-dashed"
                    markerWidth="8"
                    markerHeight="8"
                    refX="20"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#0d9488" />
                  </marker>
                </defs>

                {/* Central Document Node at (350, 240) */}
                <g
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedNode(data.graph.nodes[0]);
                    setSelectedLink(null);
                  }}
                >
                  <circle
                    cx="350"
                    cy="240"
                    r="44"
                    className="fill-white stroke-primary stroke-[2.5] drop-shadow-sm transition-transform group-hover:scale-105"
                  />
                  <rect
                    x="336"
                    y="226"
                    width="28"
                    height="28"
                    rx="6"
                    className="fill-primary/10"
                  />
                  <text
                    x="350"
                    y="244"
                    textAnchor="middle"
                    className="fill-primary text-xs font-bold pointer-events-none"
                  >
                    DOC
                  </text>
                  <text
                    x="350"
                    y="298"
                    textAnchor="middle"
                    className="fill-text-primary text-[11px] font-bold pointer-events-none"
                  >
                    {data.document.name.length > 20
                      ? data.document.name.substring(0, 18) + '...'
                      : data.document.name}
                  </text>
                  <text
                    x="350"
                    y="312"
                    textAnchor="middle"
                    className="fill-text-muted text-[10px] pointer-events-none"
                  >
                    {data.document.classification}
                  </text>
                </g>

                {/* Connecting Links & Surrounding Nodes */}
                {data.graph.nodes.slice(1).map((node, idx) => {
                  const total = data.graph.nodes.length - 1;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                  const radius = 170;
                  const cx = 350 + radius * Math.cos(angle);
                  const cy = 240 + radius * Math.sin(angle);

                  const link = data.graph.links.find(
                    (l) => l.source === node.id || l.target === node.id
                  );
                  const isInherited = link?.inherited ?? true;

                  return (
                    <g key={node.id}>
                      {/* Connection Line */}
                      <line
                        x1="350"
                        y1="240"
                        x2={cx}
                        y2={cy}
                        stroke={isInherited ? '#0d9488' : '#2563eb'}
                        strokeWidth="2"
                        strokeDasharray={isInherited ? '5,5' : undefined}
                        markerEnd={isInherited ? 'url(#arrow-dashed)' : 'url(#arrow-solid)'}
                        className="cursor-pointer hover:stroke-width-3 transition-all"
                        onClick={() => {
                          if (link) setSelectedLink(link);
                        }}
                      />

                      {/* Relationship Badge in midpoint */}
                      <g
                        transform={`translate(${(350 + cx) / 2}, ${(240 + cy) / 2})`}
                        className="cursor-pointer"
                        onClick={() => {
                          if (link) setSelectedLink(link);
                        }}
                      >
                        <rect
                          x="-32"
                          y="-9"
                          width="64"
                          height="18"
                          rx="9"
                          className={cn(
                            'stroke-[1]',
                            isInherited
                              ? 'fill-teal/10 stroke-teal/30'
                              : 'fill-primary/10 stroke-primary/30'
                          )}
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          className={cn(
                            'text-[9px] font-bold',
                            isInherited ? 'fill-teal' : 'fill-primary'
                          )}
                        >
                          {link?.permission_level?.toUpperCase() || 'ACCESS'}
                        </text>
                      </g>

                      {/* Identity Node */}
                      <g
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedNode(node);
                          setSelectedLink(link || null);
                        }}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r="28"
                          className={cn(
                            'fill-white stroke-[2] drop-shadow-xs transition-transform group-hover:scale-110',
                            isInherited ? 'stroke-teal' : 'stroke-primary'
                          )}
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          className="fill-text-primary text-[10px] font-bold pointer-events-none"
                        >
                          {node.label.charAt(0).toUpperCase()}
                        </text>
                        <text
                          x={cx}
                          y={cy + 40}
                          textAnchor="middle"
                          className="fill-text-primary text-[10px] font-semibold pointer-events-none"
                        >
                          {node.label.length > 15
                            ? node.label.substring(0, 13) + '...'
                            : node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Graph Legend */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-border rounded-medium p-2.5 text-[11px] space-y-1.5 shadow-xs">
                <div className="font-bold text-text-primary text-[10px] uppercase tracking-wider">
                  Legend
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-primary" />
                  <span className="text-text-secondary">Direct Document Grant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 border-t border-dashed border-teal" />
                  <span className="text-text-secondary">Inherited via Workspace Role</span>
                </div>
              </div>
            </div>

            {/* Side Details Panel (1 Col) */}
            <div className="p-5 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Relationship Details
                  </h3>
                  <span className="text-[10px] font-medium text-text-muted">
                    Server Verified
                  </span>
                </div>

                {selectedNode ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[11px] text-text-muted font-medium">Identity Name</span>
                      <p className="font-bold text-text-primary text-sm mt-0.5">{selectedNode.label}</p>
                    </div>

                    {selectedNode.email && (
                      <div>
                        <span className="text-[11px] text-text-muted font-medium">Email Address</span>
                        <p className="font-mono text-text-secondary text-[11px] mt-0.5">
                          {selectedNode.email}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-[11px] text-text-muted font-medium">Identity Type</span>
                      <p className="font-semibold text-text-primary capitalize mt-0.5">
                        {selectedNode.type} {selectedNode.role ? `• ${selectedNode.role}` : ''}
                      </p>
                    </div>

                    {selectedLink && (
                      <div className="p-3 bg-surface-subtle rounded-medium border border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-text-primary">
                            Grant Origin
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              selectedLink.inherited
                                ? 'bg-teal/10 text-teal border-teal/20'
                                : 'bg-primary/10 text-primary border-primary/20'
                            )}
                          >
                            {selectedLink.inherited ? 'Inherited' : 'Direct Grant'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary">{selectedLink.details}</p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-text-muted">
                          <span>Effective Level:</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold border',
                              getPermissionBadge(selectedLink.permission_level || 'view')
                            )}
                          >
                            {selectedLink.permission_level?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'document' && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text-muted">SHA-256 Digest:</span>
                          <span className="font-mono text-[10px] text-text-secondary">
                            {selectedNode.sha256_hash?.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text-muted">Document Owner:</span>
                          <span className="font-semibold text-text-primary">
                            {selectedNode.owner_name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">Click any node or link in the graph to inspect details.</p>
                )}
              </div>

              <div className="pt-4 border-t border-border mt-6">
                <div className="p-2.5 rounded-medium bg-primary/5 border border-primary/15 text-[11px] text-text-secondary flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Permissions evaluated deterministically via central access control service. Revoked or expired grants do not authorize access.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Table Mode */
          <div className="p-5 space-y-4">
            {/* Table Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="text-xs bg-white border border-border rounded-medium px-2.5 py-1.5 text-text-secondary focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="direct">Direct Grant Only</option>
                  <option value="inherited">Inherited Only</option>
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="text-xs bg-white border border-border rounded-medium px-2.5 py-1.5 text-text-secondary focus:outline-none"
                >
                  <option value="all">All Permission Levels</option>
                  <option value="manage">Manage</option>
                  <option value="download">Download</option>
                  <option value="view">View Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-medium overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Identity</th>
                    <th className="py-2.5 px-3">Origin / Source</th>
                    <th className="py-2.5 px-3">Effective Level</th>
                    <th className="py-2.5 px-3">Download Right</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Expiration</th>
                    <th className="py-2.5 px-3">Authorization Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-surface-subtle/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-text-primary">{r.name}</div>
                        <div className="text-[11px] text-text-muted">{r.email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            r.is_inherited
                              ? 'bg-teal/10 text-teal border-teal/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          )}
                        >
                          {r.access_source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border uppercase',
                            getPermissionBadge(r.effective_permission)
                          )}
                        >
                          {r.effective_permission}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {r.can_download ? (
                          <span className="flex items-center gap-1 text-emerald font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-text-muted text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Prohibited
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                            r.status === 'active'
                              ? 'bg-emerald/10 text-emerald'
                              : 'bg-coral/10 text-coral'
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary text-[11px]">
                        {r.expiration || 'Never'}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary text-[11px] max-w-xs truncate" title={r.reason}>
                        {r.reason || 'Authorized by active workspace role'}
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No identities match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
