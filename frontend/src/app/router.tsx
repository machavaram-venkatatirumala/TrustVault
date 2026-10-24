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
import { TermsPage } from '../features/legal/TermsPage';
import { PrivacyPage } from '../features/legal/PrivacyPage';
import { CookiesPage } from '../features/legal/CookiesPage';
import { SecurityPage } from '../features/legal/SecurityPage';
import { ContactPage } from '../features/legal/ContactPage';
import { CookieConsent } from '../components/layout/CookieConsent';
import { AppLoadingMark } from '../components/brand/TrustVaultLogo';

function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieConsent />
    </>
  );
}

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center">
        <AppLoadingMark message="Verifying session and security context..." />
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
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/terms',
        element: <TermsPage />,
      },
      {
        path: '/privacy',
        element: <PrivacyPage />,
      },
      {
        path: '/cookies',
        element: <CookiesPage />,
      },
      {
        path: '/security',
        element: <SecurityPage />,
      },
      {
        path: '/contact',
        element: <ContactPage />,
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
    ],
  },
]);
