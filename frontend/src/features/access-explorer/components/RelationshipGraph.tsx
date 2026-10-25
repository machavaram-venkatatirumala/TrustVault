import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  User,
  Building2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Layers,
} from 'lucide-react';
import {
  AccessExplorerData,
  AccessGraphNode,
  AccessGraphLink,
  ClassificationLevel,
} from '../../../types';
import { cn } from '../../../lib/utils';

interface RelationshipGraphProps {
  data: AccessExplorerData;
  selectedNode: AccessGraphNode | null;
  selectedLink: AccessGraphLink | null;
  onSelectNode: (node: AccessGraphNode | null) => void;
  onSelectLink: (link: AccessGraphLink | null) => void;
  activeFilter?: 'all' | 'direct' | 'inherited' | 'manage' | 'revoked';
  onFilterChange?: (filter: 'all' | 'direct' | 'inherited' | 'manage' | 'revoked') => void;
}

interface NodePosition {
  x: number;
  y: number;
  node: AccessGraphNode;
}

export function RelationshipGraph({
  data,
  selectedNode,
  selectedLink,
  onSelectNode,
  onSelectLink,
  activeFilter = 'all',
  onFilterChange,
}: RelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [graphSearch, setGraphSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<AccessGraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<AccessGraphLink | null>(null);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset zoom & pan when document changes
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [data.document.id]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on svg background, not interactive elements
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas-bg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Node Layout Computation
  // Center Document at (450, 300)
  // Workspace Node directly at (450, 100)
  // Identities distributed radially or by category around the center
  const layout = useMemo(() => {
    const centerX = 450;
    const centerY = 300;
    const positions: Record<string, NodePosition> = {};

    const docNode = data.graph.nodes.find((n) => n.type === 'document') || data.graph.nodes[0];
    const wsNode = data.graph.nodes.find((n) => n.type === 'workspace');
    const userNodes = data.graph.nodes.filter((n) => n.id !== docNode?.id && n.id !== wsNode?.id);

    // Place Document
    if (docNode) {
      positions[docNode.id] = { x: centerX, y: centerY, node: docNode };
    }

    // Place Workspace Node
    if (wsNode) {
      positions[wsNode.id] = { x: centerX, y: 100, node: wsNode };
    }

    // Split user nodes:
    // Left hemisphere: Owner and Inherited Admins
    // Right hemisphere: Direct share grants
    const ownerNode = userNodes.find((n) => n.role === 'Document Owner');
    const adminNodes = userNodes.filter((n) => n.role === 'admin');
    const directUsers = userNodes.filter((n) => n !== ownerNode && !adminNodes.includes(n));

    // Place Owner top-left
    if (ownerNode) {
      positions[ownerNode.id] = { x: 210, y: 180, node: ownerNode };
    }

    // Place Admins left
    adminNodes.forEach((node, idx) => {
      const step = 280 + idx * 110;
      positions[node.id] = { x: 170, y: Math.min(step, 480), node };
    });

    // Place Direct Grants around right and bottom
    const totalDirect = directUsers.length;
    directUsers.forEach((node, idx) => {
      if (totalDirect === 1) {
        positions[node.id] = { x: 700, y: 300, node };
      } else if (totalDirect === 2) {
        const yPos = idx === 0 ? 210 : 390;
        positions[node.id] = { x: 710, y: yPos, node };
      } else {
        // Distribute radially from angle -45 deg to 140 deg
        const startAngle = -Math.PI / 4;
        const endAngle = (3 * Math.PI) / 4;
        const angle = startAngle + (idx / (totalDirect - 1 || 1)) * (endAngle - startAngle);
        const radius = 250;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          node,
        };
      }
    });

    return { centerX, centerY, positions };
  }, [data.graph.nodes]);

  // Filter links and nodes based on activeFilter and graphSearch
  const isMatchSearch = (node: AccessGraphNode) => {
    if (!graphSearch) return true;
    const q = graphSearch.toLowerCase();
    return (
      node.label.toLowerCase().includes(q) ||
      (node.email && node.email.toLowerCase().includes(q)) ||
      (node.role && node.role.toLowerCase().includes(q))
    );
  };

  const isLinkVisible = (link: AccessGraphLink) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'direct') return link.relationship === 'direct_grant' && link.status === 'active';
    if (activeFilter === 'inherited') return !!link.inherited;
    if (activeFilter === 'manage') return link.permission_level === 'manage';
    if (activeFilter === 'revoked') return link.status === 'revoked' || link.status === 'expired';
    return true;
  };

  const getClassificationBadge = (cls?: ClassificationLevel | string) => {
    switch (cls) {
      case 'Restricted':
        return 'bg-coral-pale text-coral-deep border-coral/30';
      case 'Confidential':
        return 'bg-amber-pale text-amber-deep border-amber/30';
      case 'Internal':
        return 'bg-primary-soft text-primary border-primary/25';
      case 'Public':
        return 'bg-emerald-pale text-emerald-fresh border-emerald/30';
      default:
        return 'bg-surface-subtle text-text-secondary border-border';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-2xl border border-border bg-[#F8FAFC] overflow-hidden select-none flex flex-col',
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'h-[580px] lg:h-[620px]'
      )}
    >
      {/* Top Floating Glass Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2.5 z-20 pointer-events-none">
        {/* Left: Quick In-Canvas Search */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Find principal in topology..."
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 w-44 sm:w-56 bg-white/95 backdrop-blur-md border border-border rounded-xl text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs placeholder:text-text-muted"
            />
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:inline-flex items-center p-0.5 bg-white/95 backdrop-blur-md border border-border rounded-xl shadow-xs text-[11px] font-medium">
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-colors',
                activeFilter === 'all' ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange('direct')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-colors',
                activeFilter === 'direct' ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Direct Grants
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange('inherited')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-colors',
                activeFilter === 'inherited' ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Inherited Roles
            </button>
          </div>
        </div>

        {/* Right: Zoom & Navigation Controls */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-border rounded-xl shadow-xs">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-text-muted px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <div className="w-px h-3.5 bg-border mx-0.5" />
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Reset to Center View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize to Fullscreen'}
            aria-label="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas with Interactive Pan & Zoom */}
      <div
        className={cn(
          'w-full flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing',
          isPanning && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          id="graph-canvas-bg"
          className="w-full h-full select-none"
          viewBox="0 0 900 600"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Subtle Dot Grid Pattern */}
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#D8DCE7" />
            </pattern>

            {/* Direct Grant Arrowhead (Cobalt #3155D9) */}
            <marker
              id="arrow-direct"
              markerWidth="10"
              markerHeight="10"
              refX="32"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,1 L9,5 L0,9 Z" fill="#3155D9" />
            </marker>

            {/* Inherited Access Arrowhead (Teal #0F9D91) */}
            <marker
              id="arrow-inherited"
              markerWidth="10"
              markerHeight="10"
              refX="32"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,1 L9,5 L0,9 Z" fill="#0F9D91" />
            </marker>

            {/* Revoked / Inactive Arrowhead (Coral #E56D5D) */}
            <marker
              id="arrow-revoked"
              markerWidth="10"
              markerHeight="10"
              refX="32"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,1 L9,5 L0,9 Z" fill="#E56D5D" />
            </marker>

            {/* Node Shadows */}
            <filter id="shadow-card" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1e293b" floodOpacity="0.08" />
            </filter>
            <filter id="shadow-node" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* Background Grid Pattern */}
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

          {/* Graph Content Group transformed by pan & zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '450px 300px' }}>
            {/* 1. RENDER LINKS (EDGES) */}
            {data.graph.links.map((link, idx) => {
              if (!isLinkVisible(link)) return null;

              const sourcePos = layout.positions[link.source];
              const targetPos = layout.positions[link.target];
              if (!sourcePos || !targetPos) return null;

              const isDirect = link.relationship === 'direct_grant';
              const isRevoked = link.status === 'revoked' || link.status === 'expired';
              const isInherited = !!link.inherited;
              const isSelected =
                selectedLink &&
                selectedLink.source === link.source &&
                selectedLink.target === link.target;

              const strokeColor = isRevoked ? '#E56D5D' : isInherited ? '#0F9D91' : '#3155D9';
              const markerId = isRevoked
                ? 'url(#arrow-revoked)'
                : isInherited
                ? 'url(#arrow-inherited)'
                : 'url(#arrow-direct)';

              // Compute mid-point for badge
              const midX = (sourcePos.x + targetPos.x) / 2;
              const midY = (sourcePos.y + targetPos.y) / 2;

              return (
                <g key={`link-${idx}`} className="group cursor-pointer">
                  {/* Invisible wide stroke for easy clicking/hovering */}
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke="transparent"
                    strokeWidth="18"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLink(link);
                      onSelectNode(null);
                    }}
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                  />

                  {/* Visible Edge Line */}
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '3.5' : isRevoked ? '1.8' : '2'}
                    strokeDasharray={isInherited || isRevoked ? '5,5' : undefined}
                    markerEnd={markerId}
                    className="transition-all duration-200"
                  />

                  {/* Midpoint Pill: Permission Level */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLink(link);
                      onSelectNode(null);
                    }}
                    className="cursor-pointer transition-transform group-hover:scale-105"
                  >
                    <rect
                      x="-38"
                      y="-10"
                      width="76"
                      height="20"
                      rx="10"
                      fill="#FFFFFF"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '2' : '1.2'}
                      filter="url(#shadow-node)"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={strokeColor}
                      className="text-[9px] font-bold uppercase tracking-wider pointer-events-none select-none"
                    >
                      {link.permission_level || (isInherited ? 'ROLE' : 'GRANT')}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 2. RENDER NODES */}
            {data.graph.nodes.map((node) => {
              const pos = layout.positions[node.id];
              if (!pos) return null;

              const isSelected = selectedNode?.id === node.id;
              const matchesSearch = isMatchSearch(node);
              const isHovered = hoveredNode?.id === node.id;

              // Node type rendering
              if (node.type === 'document') {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                      onSelectLink(null);
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Active Halo Ring */}
                    {isSelected && (
                      <rect
                        x="-106"
                        y="-48"
                        width="212"
                        height="96"
                        rx="20"
                        fill="none"
                        stroke="#3155D9"
                        strokeWidth="3"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                    )}

                    {/* Central Document Card */}
                    <rect
                      x="-100"
                      y="-42"
                      width="200"
                      height="84"
                      rx="16"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#3155D9' : '#D8DCE7'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      filter="url(#shadow-card)"
                      className="transition-all duration-200 group-hover:stroke-primary"
                    />

                    {/* Icon Badge */}
                    <rect x="-86" y="-28" width="36" height="36" rx="10" fill="#EEF2FF" />
                    <text
                      x="-68"
                      y="-6"
                      textAnchor="middle"
                      fill="#3155D9"
                      className="text-base font-bold pointer-events-none"
                    >
                      📄
                    </text>

                    {/* Document Label */}
                    <text
                      x="-40"
                      y="-12"
                      textAnchor="start"
                      fill="#20263A"
                      className="text-xs font-bold pointer-events-none truncate"
                    >
                      {node.label.length > 18 ? node.label.substring(0, 16) + '...' : node.label}
                    </text>

                    {/* Document Subtext: Classification & Target Scope */}
                    <text
                      x="-40"
                      y="4"
                      textAnchor="start"
                      fill="#747C90"
                      className="text-[10px] font-medium pointer-events-none"
                    >
                      Target Resource • {node.classification || 'Internal'}
                    </text>

                    {/* SHA256 Tag */}
                    <text
                      x="-86"
                      y="26"
                      textAnchor="start"
                      fill="#9AA0B2"
                      className="text-[9px] font-mono pointer-events-none"
                    >
                      Digest: {node.sha256_hash ? `${node.sha256_hash.substring(0, 16)}...` : 'N/A'}
                    </text>
                  </g>
                );
              }

              if (node.type === 'workspace') {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                      onSelectLink(null);
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Workspace Card */}
                    <rect
                      x="-85"
                      y="-26"
                      width="170"
                      height="52"
                      rx="12"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#0F9D91' : '#E8EAF1'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      filter="url(#shadow-node)"
                      className="transition-all duration-150 group-hover:stroke-teal"
                    />

                    {/* Icon container */}
                    <rect x="-74" y="-16" width="30" height="32" rx="8" fill="#E6F7F5" />
                    <text
                      x="-59"
                      y="5"
                      textAnchor="middle"
                      fill="#0F9D91"
                      className="text-xs font-bold pointer-events-none"
                    >
                      🏢
                    </text>

                    <text
                      x="-34"
                      y="-1"
                      textAnchor="start"
                      fill="#20263A"
                      className="text-xs font-bold pointer-events-none"
                    >
                      {node.label.length > 15 ? node.label.substring(0, 13) + '...' : node.label}
                    </text>
                    <text
                      x="-34"
                      y="14"
                      textAnchor="start"
                      fill="#0F9D91"
                      className="text-[10px] font-semibold uppercase tracking-wider pointer-events-none"
                    >
                      Workspace Domain
                    </text>
                  </g>
                );
              }

              // Identity Node (User / Member / Collaborator)
              const isOwner = node.role === 'Document Owner';
              const isAdmin = node.role === 'admin';
              const isRevoked = node.status === 'revoked' || node.status === 'expired';
              const initials = node.label ? node.label.charAt(0).toUpperCase() : 'U';

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={cn(
                    'cursor-pointer group transition-opacity duration-200',
                    !matchesSearch && 'opacity-30'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node);
                    onSelectLink(null);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="36"
                      fill="none"
                      stroke={isOwner ? '#B57416' : isAdmin ? '#0F9D91' : '#3155D9'}
                      strokeWidth="2.5"
                      strokeDasharray="4,3"
                      className="animate-spin-slow"
                    />
                  )}

                  {/* Main Avatar Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="26"
                    fill="#FFFFFF"
                    stroke={
                      isRevoked
                        ? '#E56D5D'
                        : isOwner
                        ? '#D99022'
                        : isAdmin
                        ? '#0F9D91'
                        : '#3155D9'
                    }
                    strokeWidth={isSelected ? '2.5' : '2'}
                    filter="url(#shadow-node)"
                    className="transition-transform group-hover:scale-110 duration-150"
                  />

                  {/* Avatar Initials */}
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#20263A"
                    className="text-xs font-bold pointer-events-none select-none"
                  >
                    {initials}
                  </text>

                  {/* Crown Icon for Owner */}
                  {isOwner && (
                    <g transform="translate(10, -22)">
                      <circle cx="0" cy="0" r="8" fill="#FDF4E7" stroke="#D99022" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" className="text-[9px] pointer-events-none">
                        👑
                      </text>
                    </g>
                  )}

                  {/* Status Indicator Dot (Bottom-Right of Avatar) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="5"
                    fill={isRevoked ? '#E56D5D' : '#16865B'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Identity Name Label Below */}
                  <text
                    x="0"
                    y="39"
                    textAnchor="middle"
                    fill="#20263A"
                    className="text-xs font-bold pointer-events-none select-none"
                  >
                    {node.label.length > 16 ? node.label.substring(0, 14) + '...' : node.label}
                  </text>

                  {/* Role or Email Subtitle */}
                  <text
                    x="0"
                    y="52"
                    textAnchor="middle"
                    fill="#747C90"
                    className="text-[10px] font-medium pointer-events-none select-none"
                  >
                    {isOwner ? 'Document Owner' : isAdmin ? 'Workspace Admin' : node.role || 'Member'}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-border rounded-xl p-3 text-xs shadow-xs space-y-1.5 z-20 hidden sm:block max-w-xs">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-text-primary uppercase tracking-wider pb-1 border-b border-border">
          <span>Topology Legend</span>
          <span className="text-[10px] text-text-muted font-normal">Click edge/node to inspect</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-primary rounded-full"></span>
            <span>Direct Grant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-teal"></span>
            <span>Inherited Role</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-coral"></span>
            <span>Revoked/Expired</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald"></span>
            <span>Active Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
