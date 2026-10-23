import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { SharedWithMePage } from '../features/sharing/SharedWithMePage';
import { PermissionsPage } from '../features/sharing/PermissionsPage';
import { AuditCenterPage } from '../features/audit/AuditCenterPage';
import { MembersPage } from '../features/members/MembersPage';
import { SettingsPage } from '../features/settings/SettingsPage';

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-text-muted">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'shared', element: <SharedWithMePage /> },
          { path: 'permissions', element: <PermissionsPage /> },
          { path: 'audit', element: <AuditCenterPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
