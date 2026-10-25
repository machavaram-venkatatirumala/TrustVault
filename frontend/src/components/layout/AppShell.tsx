import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { UploadModal } from '../documents/UploadModal';
import { ToastContainer } from '../ui/toast';

const titleMap: Record<string, string> = {
  '/app': 'Workspace Overview',
  '/app/overview': 'Workspace Overview',
  '/app/documents': 'Document Repository',
  '/app/access-explorer': 'Access Explorer & Topology',
  '/app/approvals': 'Document Approval Workflows',
  '/app/saved-searches': 'Saved Searches & Filters',
  '/app/shared': 'Shared With Me',
  '/app/shared-with-me': 'Shared With Me',
  '/app/sharing': 'Access Permissions & Grants',
  '/app/permissions': 'Access Permissions & Grants',
  '/app/policies': 'Security Policies & Guardrails',
  '/app/access-reviews': 'Access Review Campaigns',
  '/app/audit': 'Security Audit Center',
  '/app/evidence-center': 'Compliance Evidence Center',
  '/app/security': 'Security Controls & Posture',
  '/app/members': 'Member & Role Management',
  '/app/invitations': 'Workspace Invitations',
  '/app/integrations': 'Enterprise SSO & Integrations',
  '/app/quotas': 'Usage Quotas & Analytics',
  '/app/feature-flags': 'Feature Management & Flags',
  '/app/settings': 'Workspace Settings',
  '/app/billing': 'Plan & Usage Analytics',
  '/app/profile': 'User Profile & Security',
};

export interface AppShellContext {
  openUploadModal: () => void;
  openCommandPalette: () => void;
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const location = useLocation();
  const queryClient = useQueryClient();

  const title =
    titleMap[location.pathname] ||
    (location.pathname.startsWith('/app/documents/') ? 'Document Details & Verification' : 'TrustVault');

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <div className="min-h-screen bg-background-warm flex flex-row">
      <Sidebar className="hidden lg:flex" />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          onOpenUpload={() => setUploadModalOpen(true)}
          title={title}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openUploadModal: () => setUploadModalOpen(true), openCommandPalette: () => setCommandPaletteOpen(true) }} />
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenUpload={() => setUploadModalOpen(true)}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <ToastContainer />
    </div>
  );
}
