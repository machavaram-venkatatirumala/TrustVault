import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/toast';

const titleMap: Record<string, string> = {
  '/app': 'Workspace Overview',
  '/app/documents': 'Document Repository',
  '/app/shared': 'Shared With Me',
  '/app/permissions': 'Access Permissions & Grants',
  '/app/audit': 'Security Audit Center',
  '/app/members': 'Member & Role Management',
  '/app/settings': 'Workspace Settings',
};

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const title = titleMap[location.pathname] || 'TrustVault';

  return (
    <div className="min-h-screen bg-background-warm flex flex-row">
      <Sidebar className="hidden lg:flex" />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
