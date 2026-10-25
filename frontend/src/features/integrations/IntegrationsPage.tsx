import React, { useState, useEffect } from 'react';
import {
  Boxes,
  KeyRound,
  Users,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Save,
  Server,
  Database,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { OIDCConfig } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function IntegrationsPage() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'oidc' | 'scim' | 'dr'>('oidc');
  const [isLoading, setIsLoading] = useState(true);

  // OIDC State
  const [oidcConfig, setOidcConfig] = useState<OIDCConfig | null>(null);
  const [issuerUrl, setIssuerUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isOidcEnabled, setIsOidcEnabled] = useState(false);
  const [isSavingOidc, setIsSavingOidc] = useState(false);
  const [oidcSaveSuccess, setOidcSaveSuccess] = useState(false);

  // SCIM State
  const [scimData, setScimData] = useState<{
    totalResults: number;
    Resources: any[];
    schemas: string[];
  } | null>(null);

  // DR State
  const [drBackup, setDrBackup] = useState<any | null>(null);
  const [isGeneratingDr, setIsGeneratingDr] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oidcRes, scimRes] = await Promise.all([
        api.enterprise.getOIDC(),
        api.enterprise.getSCIMUsers(),
      ]);
      const cfg = oidcRes.oidc || oidcRes;
      setOidcConfig(cfg);
      setIssuerUrl(cfg.issuer_url || '');
      setClientId(cfg.client_id || '');
      setRedirectUri(cfg.redirect_uri || '');
      setIsOidcEnabled(cfg.is_enabled || false);

      setScimData(scimRes);
    } catch (err) {
      console.error('Failed to load integrations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOidc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOidc(true);
    setOidcSaveSuccess(false);
    try {
      const res = await api.enterprise.updateOIDC({
        issuer_url: issuerUrl.trim(),
        client_id: clientId.trim(),
        client_secret: clientSecret.trim() || undefined,
        redirect_uri: redirectUri.trim() || undefined,
        is_enabled: isOidcEnabled,
      });
      const cfg = res.oidc || res;
      setOidcConfig(cfg);
      setOidcSaveSuccess(true);
      success('OIDC configuration updated successfully.');
      setTimeout(() => setOidcSaveSuccess(false), 3000);
    } catch (err: any) {
      toastError(err.message || 'Failed to update OIDC configuration.');
    } finally {
      setIsSavingOidc(false);
    }
  };

  const handleGenerateDrSnapshot = async () => {
    setIsGeneratingDr(true);
    try {
      const res = await api.enterprise.generateDRBackup();
      setDrBackup(res);
      success('DR backup snapshot generated successfully.');
    } catch (err: any) {
      toastError(err.message || 'Failed to generate DR backup snapshot.');
    } finally {
      setIsGeneratingDr(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    success('Copied to clipboard.');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-medium bg-primary/10 text-primary">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Enterprise Integrations Hub
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Enterprise Single Sign-On (OIDC), SCIM 2.0 user directory provisioning, and disaster recovery verification.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('oidc')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'oidc'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <KeyRound className="w-4 h-4" />
          OpenID Connect (OIDC / SSO)
        </button>
        <button
          onClick={() => setActiveTab('scim')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'scim'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Users className="w-4 h-4" />
          SCIM 2.0 Directory Sync
          {scimData && (
            <span className="px-1.5 py-0.2 bg-primary/10 text-primary rounded-full text-[10px]">
              {scimData.totalResults}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('dr')}
          className={cn(
            'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'dr'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Database className="w-4 h-4" />
          Disaster Recovery & Backups
        </button>
      </div>

      {/* TAB 1: OIDC / SSO */}
      {activeTab === 'oidc' && (
        <div className="bg-white border border-border rounded-large p-6 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">OIDC Identity Provider Settings</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Federate corporate identity providers (Okta, Azure AD, PingIdentity, Google Workspace) via standard OpenID Connect.
              </p>
            </div>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider',
                oidcConfig?.is_configured
                  ? oidcConfig.is_enabled
                    ? 'bg-emerald/15 text-emerald border-emerald/30'
                    : 'bg-amber/15 text-amber border-amber/30'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              )}
            >
              {oidcConfig?.is_configured
                ? oidcConfig.is_enabled
                  ? 'SSO Active'
                  : 'Configured (Disabled)'
                : 'Not Configured'}
            </span>
          </div>

          {oidcSaveSuccess && (
            <div className="p-3 bg-emerald/10 border border-emerald/20 rounded-medium text-emerald text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>OIDC configuration updated and cryptographically verified in active database.</span>
            </div>
          )}

          <form onSubmit={handleSaveOidc} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-primary block mb-1">
                OpenID Connect Issuer URL (IdP Discovery Endpoint)
              </label>
              <input
                type="url"
                required
                placeholder="https://identity.yourcompany.com or https://dev-12345.okta.com"
                value={issuerUrl}
                onChange={(e) => setIssuerUrl(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">OAuth Client ID</label>
              <input
                type="text"
                required
                placeholder="e.g. 0oa123456789trustvault"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">
                OAuth Client Secret {oidcConfig?.is_configured && '(Leave blank to retain current secret)'}
              </label>
              <input
                type="password"
                placeholder={oidcConfig?.is_configured ? '••••••••••••••••' : 'Enter client secret'}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">
                Authorized Redirect URI (Callback)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={redirectUri || 'https://trustvault.example/api/v1/auth/oidc/callback'}
                  className="w-full text-xs p-2.5 bg-surface-subtle border border-border rounded-medium text-text-secondary font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      redirectUri || 'https://trustvault.example/api/v1/auth/oidc/callback'
                    )
                  }
                  className="px-3 py-2.5 border border-border rounded-medium hover:bg-surface-subtle text-text-secondary"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Add this exact URI to your IdP console under Allowed Callback URLs.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOidcEnabled}
                  onChange={(e) => setIsOidcEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-text-primary">
                  Enable OIDC Single Sign-On for workspace members
                </span>
              </label>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-border flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingOidc}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingOidc ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: SCIM 2.0 Directory Sync */}
      {activeTab === 'scim' && (
        <div className="bg-white border border-border rounded-large shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary">SCIM 2.0 Provisioning Endpoint</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Automated user provisioning and deprovisioning via standard RFC 7643 / RFC 7644 SCIM protocol.
            </p>
          </div>

          <div className="p-4 bg-surface-subtle border border-border rounded-medium flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-text-primary block">SCIM 2.0 Base URL:</span>
              <span className="font-mono text-[11px] text-primary">/api/v1/scim/v2/Users</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald/10 text-emerald border border-emerald/20">
              Schema: urn:ietf:params:scim:schemas:core:2.0:User
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
              Currently Synchronized Identities ({scimData?.totalResults || 0})
            </h4>

            <div className="border border-border rounded-medium overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">SCIM Identity ID</th>
                    <th className="py-2.5 px-3">Username / Email</th>
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scimData?.Resources.map((res: any) => (
                    <tr key={res.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-text-muted">
                        {res.id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        {res.userName}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {res.name?.formatted}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                          {res.roles?.[0]?.value || 'member'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold',
                            res.active
                              ? 'bg-emerald/10 text-emerald'
                              : 'bg-coral/10 text-coral'
                          )}
                        >
                          {res.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Disaster Recovery */}
      {activeTab === 'dr' && (
        <div className="bg-white border border-border rounded-large shadow-xs p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Disaster Recovery & Storage Integrity</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Deterministic recovery snapshots verifying storage integrity and database state.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-subtle rounded-medium border border-border">
              <span className="text-[11px] text-text-muted font-medium">Recovery Point Objective (RPO) Target</span>
              <p className="text-lg font-bold text-text-primary mt-1">&lt; 1 Hour</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Configurable operational target</p>
            </div>
            <div className="p-4 bg-surface-subtle rounded-medium border border-border">
              <span className="text-[11px] text-text-muted font-medium">Recovery Time Objective (RTO) Target</span>
              <p className="text-lg font-bold text-text-primary mt-1">&lt; 4 Hours</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Configurable operational target</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateDrSnapshot}
              disabled={isGeneratingDr}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs"
            >
              <Database className="w-3.5 h-3.5" />
              {isGeneratingDr ? 'Computing Snapshot Hash...' : 'Create Verified Disaster Recovery Snapshot'}
            </button>
          </div>

          {drBackup && (
            <div className="p-4 bg-emerald/5 border border-emerald/20 rounded-medium space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Snapshot Created</span>
              </div>
              <div className="font-mono text-[10px] text-text-secondary break-all">
                Backup SHA-256: {drBackup.backup_sha256}
              </div>
              <div className="text-[11px] text-text-muted">
                Generated At: {new Date(drBackup.generated_at).toLocaleString()} • Records: {drBackup.records_count}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
