import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme, Theme } from '../../lib/theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Shield, Building2, Lock, CheckCircle2, Moon, Sun, Laptop, Trash2, AlertTriangle, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { api } from '../../lib/api';

export function SettingsPage() {
  const { user, organization, role, isAdmin, updateProfile, deleteAccount, refetch } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  // Profile updating
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Workspace renaming (Admin)
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [savingOrg, setSavingOrg] = useState(false);

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

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setSavingOrg(true);
    try {
      await api.organization.update({ name: orgName.trim() });
      success('Workspace Updated', 'Workspace name saved successfully.');
      refetch();
    } catch (err: any) {
      error('Update Failed', err.message);
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
            <CardTitle>Workspace Identity</CardTitle>
            <CardDescription>
              {organization?.workspace_type === 'personal'
                ? 'Your personal document vault and storage partition.'
                : 'Shared organization workspace tenant.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <form onSubmit={handleUpdateOrg} className="space-y-4 max-w-md">
                <Input
                  label="Workspace Display Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
                <div className="text-xs text-text-muted space-y-1">
                  <div>
                    Workspace Slug: <code className="font-mono text-text-primary">{organization?.slug}</code>
                  </div>
                  <div>
                    Workspace Type: <span className="capitalize font-medium text-text-primary">{organization?.workspace_type || 'Personal'}</span>
                  </div>
                </div>
                <Button size="sm" type="submit" loading={savingOrg} className="text-xs">
                  Save Workspace Name
                </Button>
              </form>
            ) : (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-text-muted">Workspace:</span>{' '}
                  <span className="font-semibold text-text-primary">{organization?.name}</span>
                </p>
                <p className="text-text-secondary">
                  Only administrators can modify workspace configurations.
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
