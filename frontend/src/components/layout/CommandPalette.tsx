import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Files,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Share2,
  KeyRound,
  Lock,
  Settings,
  Upload,
  UserPlus,
  ArrowRight,
  X,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SearchResultItem } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenUpload?: () => void;
}

export function CommandPalette({ open, onClose, onOpenUpload }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    documents: SearchResultItem[];
    members: SearchResultItem[];
    audit: SearchResultItem[];
  }>({ documents: [], members: [], audit: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults({ documents: [], members: [], audit: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ documents: [], members: [], audit: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.search.global(query);
        setResults({
          documents: res.documents || [],
          members: res.members || [],
          audit: res.audit || [],
        });
      } catch {
        setResults({ documents: [], members: [], audit: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  // System navigation shortcuts
  const navShortcuts = [
    { title: 'Overview Dashboard', subtitle: 'View operational telemetry & metrics', url: '/app/overview', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Document Repository', subtitle: 'Browse all documents & verify integrity', url: '/app/documents', icon: Files, category: 'Navigation' },
    { title: 'Shared With Me', subtitle: 'Documents shared by team members', url: '/app/shared-with-me', icon: Share2, category: 'Navigation' },
    { title: 'Access Permissions', subtitle: 'Manage sharing grants & revocations', url: '/app/sharing', icon: KeyRound, category: 'Navigation' },
    { title: 'Security Controls', subtitle: 'Cryptographic posture & verification', url: '/app/security', icon: Lock, category: 'Navigation' },
    { title: 'Workspace Settings', subtitle: 'Workspace name, slug & preferences', url: '/app/settings', icon: Settings, category: 'Navigation' },
    ...(isAdmin
      ? [
          { title: 'Security Audit Center', subtitle: 'Immutable event logs & activity history', url: '/app/audit', icon: ShieldCheck, category: 'Navigation' },
          { title: 'Members & Roles', subtitle: 'Manage workspace members & permissions', url: '/app/members', icon: Users, category: 'Navigation' },
        ]
      : []),
  ];

  // Quick Action items
  const quickActions = [
    {
      title: 'Upload Document',
      subtitle: 'Upload a new file & calculate SHA-256 fingerprint',
      icon: Upload,
      action: () => {
        onClose();
        if (onOpenUpload) onOpenUpload();
        else navigate('/app/documents');
      },
      category: 'Action',
    },
    ...(isAdmin
      ? [
          {
            title: 'Invite Workspace Member',
            subtitle: 'Add a new member to the workspace',
            icon: UserPlus,
            action: () => {
              onClose();
              navigate('/app/members');
            },
            category: 'Action',
          },
        ]
      : []),
  ];

  // Combined active selectable list
  const hasSearchResults =
    results.documents.length > 0 || results.members.length > 0 || results.audit.length > 0;

  const selectableItems = query.trim()
    ? [
        ...results.documents.map((d) => ({
          title: d.title,
          subtitle: d.subtitle,
          icon: FileText,
          action: () => {
            onClose();
            navigate(d.url);
          },
          category: 'Document',
          badgeColor: 'bg-lavender/15 text-lavender',
        })),
        ...results.members.map((m) => ({
          title: m.title,
          subtitle: m.subtitle,
          icon: Users,
          action: () => {
            onClose();
            navigate(m.url);
          },
          category: 'Member',
          badgeColor: 'bg-teal/15 text-teal',
        })),
        ...results.audit.map((a) => ({
          title: a.title,
          subtitle: a.subtitle,
          icon: ShieldCheck,
          action: () => {
            onClose();
            navigate(a.url);
          },
          category: 'Security Log',
          badgeColor: 'bg-emerald/15 text-emerald',
        })),
      ]
    : [
        ...quickActions.map((a) => ({
          ...a,
          badgeColor: 'bg-primary/10 text-primary',
        })),
        ...navShortcuts.map((n) => ({
          title: n.title,
          subtitle: n.subtitle,
          icon: n.icon,
          action: () => {
            onClose();
            navigate(n.url);
          },
          category: n.category,
          badgeColor: 'bg-surface-subtle text-text-secondary',
        })),
      ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < selectableItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : selectableItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectableItems[selectedIndex]) {
          selectableItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, selectableItems, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-large border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-white">
          <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search documents, members, audit events, or navigate..."
            className="w-full bg-transparent text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded text-text-muted hover:text-text-primary"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
              ESC to close
            </kbd>
          )}
        </div>

        {/* Results / Navigation Body */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-border/40 flex-1">
          {loading && (
            <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Searching real database records...</span>
            </div>
          )}

          {!loading && query.trim() && selectableItems.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-text-primary">No results found</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                No documents, members, or security audit logs match &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!loading && selectableItems.length > 0 && (
            <div className="space-y-0.5">
              {selectableItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.category}-${item.title}-${idx}`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-medium text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary-soft text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-small flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary truncate">{item.title}</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-small ${item.badgeColor}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center text-text-muted">
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                          Press <CornerDownLeft className="w-3 h-3" />
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-surface-subtle border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-border font-mono text-[9px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-border font-mono text-[9px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-border font-mono text-[9px]">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="text-[10px]">TrustVault Secure Command Explorer</span>
        </div>
      </div>
    </div>
  );
}
