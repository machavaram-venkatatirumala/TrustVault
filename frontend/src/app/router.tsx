import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../features/landing/LandingPage';
import { FeaturesPage } from '../features/marketing/FeaturesPage';
import { PricingPage } from '../features/marketing/PricingPage';
import { AboutPage } from '../features/marketing/AboutPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { DocumentDetailPage } from '../features/documents/DocumentDetailPage';
import { SharedWithMePage } from '../features/sharing/SharedWithMePage';
import { PermissionsPage } from '../features/sharing/PermissionsPage';
import { AuditCenterPage } from '../features/audit/AuditCenterPage';
import { MembersPage } from '../features/members/MembersPage';
import { InvitationsPage } from '../features/members/InvitationsPage';
import { SecurityControlsPage } from '../features/security/SecurityControlsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { BillingPage } from '../features/billing/BillingPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { TermsPage } from '../features/legal/TermsPage';
import { PrivacyPage } from '../features/legal/PrivacyPage';
import { CookiesPage } from '../features/legal/CookiesPage';
import { SecurityPage } from '../features/legal/SecurityPage';
import { ContactPage } from '../features/legal/ContactPage';
import { CookieConsent } from '../components/layout/CookieConsent';
import { AppLoadingMark } from '../components/brand/TrustVaultLogo';

// Enterprise Features
import { AccessExplorerPage } from '../features/access-explorer/AccessExplorerPage';
import { ApprovalsPage } from '../features/approvals/ApprovalsPage';
import { PoliciesPage } from '../features/policies/PoliciesPage';
import { EvidenceCenterPage } from '../features/evidence/EvidenceCenterPage';
import { IntegrationsPage } from '../features/integrations/IntegrationsPage';
import { QuotasPage } from '../features/quotas/QuotasPage';
import { FeatureFlagsPage } from '../features/feature-flags/FeatureFlagsPage';
import { AccessReviewsPage } from '../features/governance/AccessReviewsPage';
import { SavedSearchesPage } from '../features/governance/SavedSearchesPage';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
        path: '/features',
        element: <FeaturesPage />,
      },
      {
        path: '/pricing',
        element: <PricingPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
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
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
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
              { path: 'overview', element: <OverviewPage /> },
              
              // Documents Group
              { path: 'documents', element: <DocumentsPage /> },
              { path: 'documents/:id', element: <DocumentDetailPage /> },
              { path: 'access-explorer', element: <AccessExplorerPage /> },
              { path: 'approvals', element: <ApprovalsPage /> },
              { path: 'saved-searches', element: <SavedSearchesPage /> },
              { path: 'shared-with-me', element: <SharedWithMePage /> },
              { path: 'shared', element: <SharedWithMePage /> },
              { path: 'sharing', element: <PermissionsPage /> },
              { path: 'permissions', element: <PermissionsPage /> },
              
              // Security & Governance Group
              { path: 'policies', element: <PoliciesPage /> },
              { path: 'access-reviews', element: <AccessReviewsPage /> },
              { path: 'audit', element: <AuditCenterPage /> },
              { path: 'evidence-center', element: <EvidenceCenterPage /> },
              { path: 'security', element: <SecurityControlsPage /> },
              
              // Workspace Administration Group
              { path: 'members', element: <MembersPage /> },
              { path: 'invitations', element: <InvitationsPage /> },
              { path: 'integrations', element: <IntegrationsPage /> },
              { path: 'quotas', element: <QuotasPage /> },
              { path: 'feature-flags', element: <FeatureFlagsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'billing', element: <BillingPage /> },
              { path: 'profile', element: <ProfilePage /> },
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
