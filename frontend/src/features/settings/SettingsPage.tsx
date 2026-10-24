import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme, Theme } from '../../lib/theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import {
  Shield,
  Building2,
  Lock,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Trash2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileCode,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { api } from '../../lib/api';

export function SettingsPage() {
  const { user, organization, role, isAdmin, updateProfile, deleteAccount, refetch } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  // Profile updating
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Workspace identity editing (Admin)
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgSlug, setOrgSlug] = useState(
    organization?.slug || 'kkr-ksr-institute-of-technology-and-sciences'
  );
  const [savingOrg, setSavingOrg] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<{
    available: boolean | null;
    message: string | null;
  }>({ available: null, message: null });
  const [slugError, setSlugError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Keep state synchronized when organization data loads
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgSlug(organization.slug || 'kkr-ksr-institute-of-technology-and-sciences');
    }
  }, [organization]);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Data export state
  const [exportingDocs, setExportingDocs] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);

  const handleExportDocuments = async (format: 'json' | 'csv') => {
    setExportingDocs(true);
    try {
      const res = await api.documents.list({ per_page: 100 });
      const docs = res.documents || [];
      let content = '';
      let mime = 'application/json';
      let filename = `trustvault_documents_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'json') {
        content = JSON.stringify(docs, null, 2);
        filename += '.json';
      } else {
        mime = 'text/csv';
        filename += '.csv';
        const headers = ['id', 'original_filename', 'content_type', 'size_bytes', 'sha256_hash', 'status', 'created_at'];
        const rows = docs.map((d: any) =>
          headers.map((h) => JSON.stringify(d[h] ?? '')).join(',')
        );
        content = [headers.join(','), ...rows].join('\n');
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      success('Export Completed', `Exported ${docs.length} document metadata records as ${format.toUpperCase()}.`);
    } catch (err: any) {
      error('Export Failed', err.message);
    } finally {
      setExportingDocs(false);
    }
  };

  const handleExportAudit = async (format: 'json' | 'csv') => {
    setExportingAudit(true);
    try {
      const res = await api.audit.list({ per_page: 100 });
      const events = res.events || [];
      let content = '';
      let mime = 'application/json';
      let filename = `trustvault_audit_trail_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'json') {
        content = JSON.stringify(events, null, 2);
        filename += '.json';
      } else {
        mime = 'text/csv';
        filename += '.csv';
        const headers = ['id', 'action', 'actor_name', 'actor_email', 'resource_type', 'outcome', 'timestamp'];
        const rows = events.map((e: any) =>
          headers.map((h) => JSON.stringify(e[h] ?? '')).join(',')
        );
        content = [headers.join(','), ...rows].join('\n');
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      success('Export Completed', `Exported ${events.length} audit records as ${format.toUpperCase()}.`);
    } catch (err: any) {
      error('Export Failed', err.message);
    } finally {
      setExportingAudit(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        theme_preference: theme,
      });
      success('Profile Saved', 'Your account profile has been updated.');
      refetch();
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Slug format & inline validation
  const validateSlugInline = (val: string): boolean => {
    if (!val.trim()) {
      setSlugError('Workspace slug cannot be empty.');
      return false;
    }
    if (val.length < 3) {
      setSlugError('Workspace slug must be at least 3 characters long.');
      return false;
    }
    if (val.length > 120) {
      setSlugError('Workspace slug cannot exceed 120 characters.');
      return false;
    }
    if (val.startsWith('-')) {
      setSlugError('Workspace slug cannot begin with a hyphen.');
      return false;
    }
    if (val.endsWith('-')) {
      setSlugError('Workspace slug cannot end with a hyphen.');
      return false;
    }
    if (val.includes('--')) {
      setSlugError('Workspace slug cannot contain consecutive hyphens.');
      return false;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(val)) {
      setSlugError('Workspace slug can only contain lowercase letters, numbers, and single hyphens.');
      return false;
    }

    setSlugError(null);
    return true;
  };

  const handleSlugChange = (rawInput: string) => {
    // Automatically convert uppercase to lowercase, spaces and disallowed characters to hyphens
    let formatted = rawInput.toLowerCase().replace(/\s+/g, '-');
    formatted = formatted.replace(/[^a-z0-9-]/g, '');
    formatted = formatted.replace(/-+/g, '-');

    setOrgSlug(formatted);
    validateSlugInline(formatted);
  };

  // Debounced real backend availability check
  useEffect(() => {
    if (!isEditingOrg) {
      setSlugAvailability({ available: null, message: null });
      return;
    }
    if (!orgSlug.trim()) {
      setSlugAvailability({ available: null, message: null });
      return;
    }
    const isValidFormat =
      !orgSlug.startsWith('-') &&
      !orgSlug.endsWith('-') &&
      !orgSlug.includes('--') &&
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(orgSlug) &&
      orgSlug.length >= 3;

    if (!isValidFormat) {
      setSlugAvailability({ available: null, message: null });
      return;
    }
    if (orgSlug === organization?.slug) {
      setSlugAvailability({ available: true, message: 'Current workspace slug' });
      return;
    }

    setSlugChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.organization.checkSlug(orgSlug);
        setSlugAvailability({ available: res.available, message: res.message });
      } catch (err: any) {
        setSlugAvailability({ available: null, message: 'Could not verify slug availability.' });
      } finally {
        setSlugChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [orgSlug, isEditingOrg, organization?.slug]);

  const handleStartEdit = () => {
    setOrgName(organization?.name || '');
    setOrgSlug(organization?.slug || 'kkr-ksr-institute-of-technology-and-sciences');
    setSlugError(null);
    setNameError(null);
    setIsEditingOrg(true);
  };

  const handleCancelEdit = () => {
    setOrgName(organization?.name || '');
    setOrgSlug(organization?.slug || 'kkr-ksr-institute-of-technology-and-sciences');
    setSlugError(null);
    setNameError(null);
    setSlugAvailability({ available: null, message: null });
    setIsEditingOrg(false);
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setNameError('Workspace name cannot be empty.');
      return;
    }
    if (!validateSlugInline(orgSlug)) {
      return;
    }
    if (slugAvailability.available === false && orgSlug !== organization?.slug) {
      setSlugError(slugAvailability.message || 'Workspace slug is already taken.');
      return;
    }

    setSavingOrg(true);
    try {
      await api.organization.update({
        name: orgName.trim(),
        slug: orgSlug.trim(),
      });
      success('Workspace Updated', 'Workspace name and slug updated successfully.');
      refetch();
      setIsEditingOrg(false);
    } catch (err: any) {
      if (err.status === 409) {
        setSlugError(err.message || 'Workspace slug is already taken.');
        error('Conflict', err.message || 'Workspace slug is already taken.');
      } else {
        error('Update Failed', err.message || 'Failed to update workspace settings.');
      }
    } finally {
      setSavingOrg(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    if (newPassword.length < 8) {
      error('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Mismatch', 'New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.auth.changePassword({ old_password: oldPassword, new_password: newPassword });
      success('Password Updated', 'Your password has been changed with Argon2id.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error('Password Change Failed', err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeletingAccount(true);
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch (err: any) {
      error('Deletion Failed', err.message);
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Settings & Preferences
        </h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Manage your personal identity, theme preferences, workspace name, and cryptographic security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Profile & Theme</CardTitle>
            <CardDescription>Your account credentials and interface presentation settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Email Address
                </label>
                <div className="p-2.5 rounded-small bg-surface-subtle border border-border text-xs text-text-muted font-mono">
                  {user?.email}
                </div>
                <span className="text-[11px] text-text-muted block mt-1">
                  Email normalization is strictly enforced for account security.
                </span>
              </div>

              {/* Theme Preference Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Visual Theme (Atelier Cobalt)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-small border text-xs font-medium transition-colors ${
                      theme === 'light'
                        ? 'border-primary bg-primary-soft text-primary font-semibold'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-warning" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-small border text-xs font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border-primary bg-primary-soft text-primary font-semibold'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-accent-champagne" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-small border text-xs font-medium transition-colors ${
                      theme === 'system'
                        ? 'border-primary bg-primary-soft text-primary font-semibold'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-text-muted" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              <Button size="sm" type="submit" loading={savingProfile} className="text-xs">
                Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workspace Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Workspace Identity</span>
                </CardTitle>
                <CardDescription>
                  {organization?.workspace_type === 'personal'
                    ? 'Your personal document vault and storage partition.'
                    : 'Shared organization workspace tenant and public URL address.'}
                </CardDescription>
              </div>
              <Badge variant="neutral" className="text-[10px] capitalize">
                {organization?.workspace_type || 'personal'} vault
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              isEditingOrg ? (
                <form onSubmit={handleUpdateOrg} className="space-y-4 max-w-lg">
                  <Input
                    label="Workspace Name"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    error={nameError || undefined}
                    placeholder="e.g. KKR & KSR Institute of Technology and Sciences"
                    required
                  />

                  <div className="space-y-1.5">
                    <Input
                      label="Workspace Slug (URL Identifier)"
                      value={orgSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      error={slugError || undefined}
                      placeholder="kkr-ksr-institute-of-technology-and-sciences"
                      className="font-mono text-xs"
                      required
                      rightIcon={
                        slugChecking ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : slugAvailability.available === true && !slugError ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : (slugAvailability.available === false || slugError) && orgSlug ? (
                          <AlertCircle className="w-3.5 h-3.5 text-danger" />
                        ) : null
                      }
                    />

                    {/* Slug status message */}
                    {slugChecking ? (
                      <p className="text-[11px] text-text-muted flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                        <span>Verifying slug availability on server...</span>
                      </p>
                    ) : slugAvailability.message && !slugError ? (
                      <p
                        className={`text-[11px] font-medium flex items-center gap-1 ${
                          slugAvailability.available
                            ? 'text-success'
                            : 'text-danger'
                        }`}
                      >
                        {slugAvailability.available ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span>{slugAvailability.message}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-text-muted">
                        Only lowercase letters, numbers, and hyphens are permitted. Spaces and uppercase characters are converted automatically.
                      </p>
                    )}

                    <div className="p-2 rounded bg-surface-subtle border border-border/70 text-[11px] text-text-secondary flex items-center gap-1.5 font-mono">
                      <span className="text-text-muted">URL Address:</span>
                      <span className="text-primary font-medium truncate">
                        trustvault.app/w/{orgSlug || 'workspace-slug'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      type="submit"
                      loading={savingOrg}
                      disabled={savingOrg || slugChecking || Boolean(slugError) || slugAvailability.available === false}
                      className="text-xs gap-1.5 shadow-subtle"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={savingOrg}
                      className="text-xs gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Workspace Name
                      </span>
                      <p className="font-semibold text-text-primary text-sm">
                        {organization?.name || 'Workspace'}
                      </p>
                    </div>

                    <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Workspace Slug
                      </span>
                      <p className="font-mono text-xs font-semibold text-text-primary">
                        {organization?.slug || 'kkr-ksr-institute-of-technology-and-sciences'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-text-muted font-mono truncate">
                      <span>URL: </span>
                      <span className="text-text-secondary">
                        trustvault.app/w/{organization?.slug || 'kkr-ksr-institute-of-technology-and-sciences'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartEdit}
                      className="text-xs gap-1.5 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>Edit Workspace</span>
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3 text-xs max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      Workspace Name
                    </span>
                    <p className="font-semibold text-text-primary text-sm">
                      {organization?.name}
                    </p>
                  </div>
                  <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      Workspace Slug
                    </span>
                    <p className="font-mono text-xs font-semibold text-text-primary">
                      {organization?.slug}
                    </p>
                  </div>
                </div>
                <p className="text-text-secondary text-[11px]">
                  Only organization administrators are authorized to modify workspace configurations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Password</CardTitle>
            <CardDescription>Update your login credentials using Argon2id hashing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <Input
                label="New Password (min 8 characters)"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button size="sm" type="submit" loading={changingPassword} className="text-xs">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Security Architecture Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Active Cryptographic & Storage Policies</CardTitle>
            <CardDescription>Guarantees actively enforced by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-text-secondary">
            <div className="p-3.5 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">SHA-256 Integrity Verification</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Every uploaded file is hashed at the byte level before storage. Verification recalculates hashes directly from private storage to detect bit rot or manipulation.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Private Path Isolation</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Files are stored under opaque UUID keys outside the web root. Download routes enforce backend authorization, ownership, and grant checks.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Argon2id Password Hashing</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Configured with 64MB memory cost, 3 iterations, and 4 parallel threads to resist GPU and ASIC brute-force attacks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Portability & Workspace Export (Section 15.I) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <span>Workspace Data Export & Portability</span>
            </CardTitle>
            <CardDescription>
              Export your authorized document metadata and verifiable audit records in open machine-readable formats (JSON & CSV).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-small bg-surface-subtle border border-border flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-text-primary mb-1">
                    <FileCode className="w-4 h-4 text-accent-blue" />
                    <span>Document Metadata Export</span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Includes original filenames, MIME types, file sizes, authoritative SHA-256 digests, and timestamp records.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1 gap-1"
                    onClick={() => handleExportDocuments('json')}
                    loading={exportingDocs}
                  >
                    <span>JSON</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1 gap-1"
                    onClick={() => handleExportDocuments('csv')}
                    loading={exportingDocs}
                  >
                    <span>CSV</span>
                  </Button>
                </div>
              </div>

              {isAdmin && (
                <div className="p-3.5 rounded-small bg-surface-subtle border border-border flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-text-primary mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-emerald" />
                      <span>Audit Trail Log Export</span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Full workspace security event history with actors, actions, timestamps, and cryptographic verification outcomes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1 gap-1"
                      onClick={() => handleExportAudit('json')}
                      loading={exportingAudit}
                    >
                      <span>JSON</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1 gap-1"
                      onClick={() => handleExportAudit('csv')}
                      loading={exportingAudit}
                    >
                      <span>CSV</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone: Account Deletion */}
        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription>
              Irreversible account removal and data retention policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-text-secondary">
              Deleting your account permanently removes your login identity, personal profile, and personal files from the database.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs text-danger border-danger/40 hover:bg-danger-bg"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-danger flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Account Deletion</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type <strong className="font-mono text-danger">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <Input
              label="Type DELETE to confirm"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
              loading={deletingAccount}
              onClick={handleDeleteAccount}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
