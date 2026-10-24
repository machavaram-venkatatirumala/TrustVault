import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Shield, ShieldCheck, UserX, CheckCircle2, Search, X, Ban } from 'lucide-react';
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

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [invitePassword, setInvitePassword] = useState('Password123!');
  const [inviting, setInviting] = useState(false);

  const [selectedMemberForSuspend, setSelectedMemberForSuspend] = useState<OrganizationMembership | null>(null);
  const [suspending, setSuspending] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.members.list(),
    enabled: isAdmin,
  });

  const rawMembers = data?.members || [];

  const members = useMemo(() => {
    let result = rawMembers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.user_name?.toLowerCase().includes(q) ||
          m.user_email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }
    return result;
  }, [rawMembers, search, roleFilter]);

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Users}
        title="Administrative Access Required"
        description="Member and role management is restricted to organization administrators."
      />
    );
  }

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

  const confirmSuspend = async () => {
    if (!selectedMemberForSuspend) return;
    setSuspending(true);
    try {
      await api.members.deactivate(selectedMemberForSuspend.id);
      success('Member Suspended', `${selectedMemberForSuspend.user_name}'s access has been revoked.`);
      setSelectedMemberForSuspend(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      error('Suspension Failed', err.message);
    } finally {
      setSuspending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20263A]">
            Member & Role Management
          </h2>
          <p className="mt-0.5 text-xs text-[#747C90]">
            Manage teammates, configure administrator privileges, and enforce access status.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="gap-1.5 text-xs bg-[#3155D9] hover:bg-[#2544B8] text-white"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Enroll Teammate
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search members by name or email..."
            leftIcon={<Search className="w-4 h-4 text-[#747C90]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="member">Members</option>
          </select>

          {(search || roleFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
              className="text-xs text-[#747C90] hover:text-[#20263A] gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#E8EAF1] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#747C90]">Loading organization members...</div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search || roleFilter !== 'all' ? 'No matching members found' : 'No members yet'}
            description="Try modifying your search or filter parameters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FC]/70 hover:bg-[#F7F8FC]/70">
                <TableHead className="text-[#20263A] font-semibold">Teammate</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Role</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Status</TableHead>
                <TableHead className="text-[#20263A] font-semibold">Joined</TableHead>
                <TableHead className="text-right text-[#20263A] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.user_id === user?.id;

                return (
                  <TableRow key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3155D9]/10 border border-[#3155D9]/20 text-[#3155D9] font-bold text-xs flex items-center justify-center shrink-0">
                          {member.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[#20263A]">
                              {member.user_name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-[#747C90] font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#747C90] block">{member.user_email}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <select
                        value={member.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                        className="h-8 rounded-md border border-[#E8EAF1] bg-white px-2 text-xs font-medium text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30 disabled:opacity-75 disabled:bg-[#F7F8FC]"
                      >
                        <option value="admin">Administrator</option>
                        <option value="member">Member</option>
                      </select>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-[#16865B]'
                            : 'bg-rose-50 text-[#E56D5D]'
                        }`}
                      >
                        {member.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                        {member.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-[#747C90] whitespace-nowrap">
                      {formatDate(member.joined_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      {!isSelf && member.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMemberForSuspend(member)}
                          className="h-7 text-xs gap-1 border-rose-200 text-[#E56D5D] hover:bg-rose-50"
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
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <DialogTitle className="text-[#20263A]">Enroll Organization Teammate</DialogTitle>
            <DialogDescription className="text-xs text-[#747C90]">
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
              <label className="text-xs font-semibold text-[#20263A] block mb-1">
                Organization Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-[#E8EAF1] bg-white px-3 text-xs text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3155D9]/30"
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

            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setInviteOpen(false)}
                className="border-[#E8EAF1]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                loading={inviting}
                className="bg-[#3155D9] hover:bg-[#2544B8] text-white"
              >
                Enroll Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accessible Suspend Confirmation Dialog */}
      <Dialog open={Boolean(selectedMemberForSuspend)} onOpenChange={(open) => !open && setSelectedMemberForSuspend(null)}>
        <DialogContent className="max-w-md bg-white border-[#E8EAF1]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E56D5D] flex items-center justify-center mb-2">
              <Ban className="w-5 h-5" />
            </div>
            <DialogTitle className="text-[#20263A]">Suspend Teammate</DialogTitle>
            <DialogDescription className="text-xs text-[#747C90] space-y-2">
              <p>
                Are you sure you want to suspend <strong className="text-[#20263A]">{selectedMemberForSuspend?.user_name}</strong> ({selectedMemberForSuspend?.user_email})?
              </p>
              <p className="text-[#E56D5D] bg-rose-50/70 p-2.5 rounded border border-rose-200">
                Their active sessions will be terminated and all document access permissions will be revoked immediately.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedMemberForSuspend(null)}
              disabled={suspending}
              className="border-[#E8EAF1]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={suspending}
              onClick={confirmSuspend}
              className="bg-[#E56D5D] hover:bg-[#D4594A] text-white"
            >
              Suspend Teammate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
