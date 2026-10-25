import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Table as TableIcon,
  RefreshCw,
  Download,
  ChevronDown,
  Search,
  FileText,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DocumentItem, ClassificationLevel } from '../../../types';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

interface AccessExplorerHeaderProps {
  documents: DocumentItem[];
  selectedDocId: string;
  onSelectDoc: (id: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
  activeTab: 'graph' | 'table';
  onTabChange: (tab: 'graph' | 'table') => void;
  totalIdentities: number;
}

export function AccessExplorerHeader({
  documents,
  selectedDocId,
  onSelectDoc,
  onRefresh,
  onExport,
  isRefreshing,
  activeTab,
  onTabChange,
  totalIdentities,
}: AccessExplorerHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDocuments = documents.filter((doc) =>
    doc.original_filename.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Scope Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link to="/app" className="hover:text-text-primary transition-colors">
            Workspace
          </Link>
          <span className="text-text-muted/60">/</span>
          <Link to="/app/documents" className="hover:text-text-primary transition-colors">
            Document Hub
          </Link>
          <span className="text-text-muted/60">/</span>
          <span className="text-text-primary font-semibold">Access Explorer</span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-soft text-primary border border-primary/20 shadow-2xs">
            <Shield className="w-3 h-3 text-primary" />
            Deterministic Access Evaluation
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                Access Explorer & Topology
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Understand how identities, workspace roles, and policies determine access to your documents.
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar: Document Selector, Refresh, Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Searchable Document Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3 py-2 bg-white border border-border rounded-lg text-xs font-medium text-text-primary hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all max-w-xs sm:max-w-sm"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label="Select document to explore access"
            >
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="text-left min-w-0">
                <span className="block font-semibold text-text-primary truncate max-w-[150px] sm:max-w-[200px]">
                  {selectedDoc ? selectedDoc.original_filename : 'Select Document...'}
                </span>
              </div>
              {selectedDoc && (
                <span
                  className={cn(
                    'hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0',
                    getClassificationBadge(selectedDoc.classification)
                  )}
                >
                  {selectedDoc.classification || 'Internal'}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                {/* Search inside documents */}
                <div className="p-2.5 border-b border-border bg-surface-subtle/50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search accessible documents..."
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-border rounded-md text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Document List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => {
                      const isSelected = doc.id === selectedDocId;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            onSelectDoc(doc.id);
                            setDropdownOpen(false);
                            setSearchDocQuery('');
                          }}
                          className={cn(
                            'w-full text-left p-2.5 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-surface-subtle',
                            isSelected && 'bg-primary-soft/60'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'font-semibold truncate',
                                isSelected ? 'text-primary' : 'text-text-primary'
                              )}
                              title={doc.original_filename}
                            >
                              {doc.original_filename}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {formatFileSize(doc.size_bytes)} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0',
                              getClassificationBadge(doc.classification)
                            )}
                          >
                            {doc.classification || 'Internal'}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-text-muted">
                      No matching documents found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Re-evaluate / Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 bg-white shadow-2xs hover:bg-surface-subtle border-border"
            title="Re-evaluate access paths and permissions from backend"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-text-secondary', isRefreshing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Re-evaluate</span>
          </Button>

          {/* Export Report */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="text-xs gap-1.5 bg-white shadow-2xs hover:bg-surface-subtle border-border"
            title="Export effective permissions as CSV"
          >
            <Download className="w-3.5 h-3.5 text-text-secondary" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* View Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-border/80 pb-3">
        <div className="inline-flex items-center p-1 bg-surface-subtle border border-border rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange('graph')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'graph'
                ? 'bg-white text-primary shadow-xs border border-border/60'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Relationship Topology</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('table')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'table'
                ? 'bg-white text-primary shadow-xs border border-border/60'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Effective Permissions Matrix</span>
            {totalIdentities > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-primary/20">
                {totalIdentities}
              </span>
            )}
          </button>
        </div>

        {selectedDoc && (
          <div className="hidden md:flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Policy Topology
            </span>
            <span className="text-border">|</span>
            <span>Target: <strong className="text-text-primary font-mono">{selectedDoc.original_filename}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
