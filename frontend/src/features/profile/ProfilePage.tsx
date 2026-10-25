import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api, ApiError } from '../../lib/api';
import { formatDate } from '../../lib/formatters';

export function ProfilePage() {
  const { user, organization, role, refetch, logout } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile update state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion modal state
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await api.auth.updateProfile({ full_name: fullName.trim() });
      refetch();
      setProfileMessage({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      await api.auth.changePassword({ old_password: currentPassword, new_password: newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type DELETE to confirm permanent account deletion:');
    if (confirmation !== 'DELETE') return;

    setDeleting(true);
    try {
      await api.auth.deleteAccount();
      await logout();
      window.location.href = '/login';
    } catch (err: any) {
      toastError(err.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Personal Profile & Identity
        </h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          Manage your personal account details, session security credentials, and organization membership.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary font-bold text-2xl flex items-center justify-center shrink-0 border border-primary/20">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text-primary">{user?.full_name}</h2>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-text-muted">
              <Badge variant="neutral" className="text-[10px] capitalize font-medium">
                {role}
              </Badge>
              <span>•</span>
              <span>Member since {user?.created_at ? formatDate(user.created_at) : 'recently'}</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-medium bg-surface-subtle border border-border/80 text-xs space-y-1 min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Workspace Scope
          </span>
          <p className="font-semibold text-text-primary truncate">
            {organization?.name || 'Workspace'}
          </p>
          <span className="text-[11px] text-text-secondary capitalize">
            {organization?.workspace_type || 'personal'} vault
          </span>
        </div>
      </div>

      {/* Profile Details Edit Form */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary">Personal Details</h3>
          <p className="text-xs text-text-secondary">
            Update your display name visible on audit logs and document sharing receipts.
          </p>
        </div>

        {profileMessage && (
          <div
            className={`p-3 rounded-medium text-xs flex items-center gap-2 ${
              profileMessage.type === 'success'
                ? 'bg-surface-green border border-success/20 text-success-text'
                : 'bg-danger-bg border border-danger/20 text-danger'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label htmlFor="full_name" className="block text-xs font-semibold text-text-primary">
              Full Name
            </label>
            <Input
              id="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email_ro" className="block text-xs font-semibold text-text-primary">
              Email Address (Immutable)
            </label>
            <Input
              id="email_ro"
              type="email"
              disabled
              value={user?.email || ''}
              className="text-xs bg-surface-subtle text-text-muted cursor-not-allowed"
            />
          </div>

          <Button type="submit" size="sm" disabled={profileSaving} className="text-xs shadow-subtle">
            {profileSaving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary">Change Password</h3>
          <p className="text-xs text-text-secondary">
            Protect your account with a strong passphrase. Passwords are encrypted using Argon2id.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`p-3 rounded-medium text-xs flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-surface-green border border-success/20 text-success-text'
                : 'bg-danger-bg border border-danger/20 text-danger'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label htmlFor="current_password" className="block text-xs font-semibold text-text-primary">
              Current Password
            </label>
            <Input
              id="current_password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="text-xs"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new_password" className="block text-xs font-semibold text-text-primary">
              New Password (min 8 characters)
            </label>
            <Input
              id="new_password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-xs"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm_password" className="block text-xs font-semibold text-text-primary">
              Confirm New Password
            </label>
            <Input
              id="confirm_password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-xs"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="sm" disabled={passwordSaving} className="text-xs shadow-subtle">
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Danger Zone: Account Deactivation */}
      <div className="rounded-large border border-danger/30 bg-white dark:bg-elevated p-6 shadow-subtle space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-danger">Danger Zone</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Permanently deactivates your account identity and revokes all active session cookies.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="text-xs gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{deleting ? 'Deleting...' : 'Delete My Account'}</span>
        </Button>
      </div>
    </div>
  );
}
