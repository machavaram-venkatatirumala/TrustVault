import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Shield, ShieldCheck, UserX, CheckCircle2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { OrganizationMembership, UserRole } from '../../types';
import { formatDate } from '../../lib/formatters';

export function MembersPage() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [invitePassword, setInvitePassword] = useState('Password123!');
  const [inviting, setInviting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.members.list(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Users}
        title="Administrative Access Required"
        description="Member and role management is restricted to organization administrators."
      />
    );
  }

  const members = data?.members || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setInviting(true);
    try {
      await api.members.invite({
        full_name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        password: invitePassword,
      });
      success('Member Added', `${inviteName} has been enrolled in the organization.`);
      setInviteName('');
      setInviteEmail('');
      setInviteOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Enrollment Failed', err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: OrganizationMembership, newRole: UserRole) => {
    try {
      await api.members.updateRole(member.id, newRole);
      success('Role Updated', `${member.user_name} is now an ${newRole}.`);
      refetch();
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  const handleDeactivate = async (member: OrganizationMembership) => {
    if (!window.confirm(`Are you sure you want to suspend ${member.user_name}? Their active sessions and document permissions will be revoked immediately.`)) {
      return;
    }
    try {
      await api.members.deactivate(member.id);
      success('Member Suspended', `${member.user_name}'s access has been revoked.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Suspension Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Member & Role Management
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Manage teammates, configure administrator privileges, and enforce access status.
          </p>
        </div>

        <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5 text-xs">
          <UserPlus className="w-3.5 h-3.5" />
          Enroll Teammate
        </Button>
      </div>

      <div className="rounded-medium border border-border bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading organization members...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teammate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.user_id === user?.id;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent-periwinkle/30 border border-accent-periwinkle text-accent-ink font-bold text-xs flex items-center justify-center shrink-0">
                          {member.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-text-primary">
                              {member.user_name}
                            </span>
                            {isSelf && (
                              <Badge variant="neutral" className="text-[10px] py-0 px-1">
                                You
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted block">{member.user_email}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <select
                        value={member.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                        className="h-8 rounded-small border border-border bg-white px-2 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-75 disabled:bg-surface-subtle"
                      >
                        <option value="admin">Administrator</option>
                        <option value="member">Member</option>
                      </select>
                    </TableCell>

                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                        {member.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-text-muted whitespace-nowrap">
                      {formatDate(member.joined_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      {!isSelf && member.status === 'active' && (
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => handleDeactivate(member)}
                          className="h-7 text-xs gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Enroll Teammate Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(isOpen) => !isOpen && setInviteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Organization Teammate</DialogTitle>
            <DialogDescription>
              Create an account for a team member and configure their starting access role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Taylor Brooks"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />

            <Input
              label="Work Email"
              type="email"
              required
              placeholder="name@company.example"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Organization Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-small border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="member">Member (Can access owned and shared documents)</option>
                <option value="admin">Administrator (Full audit, member, and org oversight)</option>
              </select>
            </div>

            <Input
              label="Initial Password"
              type="text"
              required
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              helperText="The user will sign in with this temporary password."
            />

            <DialogFooter>
              <Button variant="outline" size="sm" type="button" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" loading={inviting}>
                Enroll Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
