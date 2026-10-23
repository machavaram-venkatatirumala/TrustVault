import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Shield, Building2, Lock, HardDrive, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export function SettingsPage() {
  const { user, organization, role, isAdmin, refetch } = useAuth();
  const { success, error } = useToast();

  // Organization renaming (Admin)
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [savingOrg, setSavingOrg] = useState(false);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setSavingOrg(true);
    try {
      await api.organization.update({ name: orgName });
      success('Organization Updated', 'Workspace name saved successfully.');
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Workspace Settings
        </h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Manage your personal profile, organization identity, and cryptographic storage policies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Profile</CardTitle>
            <CardDescription>Your authenticated account identity and permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-medium bg-surface-subtle/50 border border-border text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Full Name</span>
                <span className="font-semibold text-text-primary">{user?.full_name}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Email Address</span>
                <span className="font-semibold text-text-primary">{user?.email}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Assigned Role</span>
                <Badge variant={role === 'admin' ? 'default' : 'neutral'} className="capitalize mt-0.5">
                  {role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Workspace</CardTitle>
            <CardDescription>Tenant details and organization display name.</CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <form onSubmit={handleUpdateOrg} className="space-y-4 max-w-md">
                <Input
                  label="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <div className="text-xs text-text-muted">
                  Organization Slug: <code className="font-mono text-text-primary">{organization?.slug}</code>
                </div>
                <Button size="sm" type="submit" loading={savingOrg} className="text-xs">
                  Save Workspace Name
                </Button>
              </form>
            ) : (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-text-muted">Organization:</span>{' '}
                  <span className="font-semibold text-text-primary">{organization?.name}</span>
                </p>
                <p className="text-text-secondary">
                  Only administrators can modify organization settings.
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
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <Input
                label="New Password (min 8 characters)"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
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
            <CardTitle>Cryptographic & Storage Policies</CardTitle>
            <CardDescription>Guarantees actively enforced by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-text-secondary">
            <div className="p-3 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">SHA-256 Integrity Verification</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Every uploaded file is hashed at the byte level before storage. Verification recalculates hashes on the fly to detect any storage corruption or tampering.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Private Path Isolation</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Files are saved under opaque UUID keys (e.g. <code>orgs/[id]/[year]/[month]/[uuid].bin</code>) outside the public directory. Download routes enforce backend authorization.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-small bg-surface-subtle border border-border flex items-start gap-2.5">
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
      </div>
    </div>
  );
}
