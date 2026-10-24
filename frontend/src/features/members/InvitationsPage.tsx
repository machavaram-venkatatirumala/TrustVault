import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { api, ApiError } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import { OrganizationMembership, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export function InvitationsPage() {
  const { organization, isAdmin } = useAuth();
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal/form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [password, setPassword] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.members.list();
      setMembers(res.members || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load organization members.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setInviting(true);
    setInviteSuccess(null);
    setError(null);

    try {
      await api.members.invite({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
        password: password || 'DefaultP@ss123!',
      });
      setInviteSuccess(`Successfully invited and provisioned account for ${email}.`);
      setEmail('');
      setFullName('');
      setPassword('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/app/members"
              className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Members</span>
            </Link>
            <span className="text-text-muted text-xs">/</span>
            <span className="text-xs font-semibold text-text-primary">Invitations</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Team Invitations & Access Onboarding
          </h1>
        </div>

        <Link to="/app/members">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>View All Active Members ({members.length})</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-medium bg-danger-bg border border-danger/20 text-xs text-danger flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {inviteSuccess && (
        <div className="p-4 rounded-medium bg-surface-green border border-success/20 text-xs text-success-text flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <span>{inviteSuccess}</span>
        </div>
      )}

      {/* Invite Member Section */}
      {isAdmin ? (
        <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text-primary">
              Invite a Collaborator to {organization?.name || 'Workspace'}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Provision an authorized seat in your workspace. In accordance with zero-trust principles, new members only receive access to documents explicitly shared with them.
            </p>
          </div>

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1.5">
              <label htmlFor="inv_email" className="block text-xs font-semibold text-text-primary">
                Email Address
              </label>
              <Input
                id="inv_email"
                type="email"
                required
                placeholder="colleague@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="inv_name" className="block text-xs font-semibold text-text-primary">
                Full Name
              </label>
              <Input
                id="inv_name"
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="inv_role" className="block text-xs font-semibold text-text-primary">
                Organization Role
              </label>
              <select
                id="inv_role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs h-9 px-3 rounded-medium border border-border bg-white dark:bg-elevated text-text-primary"
              >
                <option value="member">Member (Can view/download shared files)</option>
                <option value="admin">Administrator (Can manage organization & review audit trail)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="inv_pwd" className="block text-xs font-semibold text-text-primary">
                Initial Password
              </label>
              <Input
                id="inv_pwd"
                type="text"
                placeholder="DefaultP@ss123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <Button type="submit" size="sm" disabled={inviting} className="text-xs shadow-subtle gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>{inviting ? 'Provisioning...' : 'Provision Workspace Member'}</span>
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-medium bg-surface-subtle border border-border text-xs text-text-secondary">
          Only organization administrators are authorized to invite new members to this workspace.
        </div>
      )}

      {/* Invitations & Membership Status Policy */}
      <div className="rounded-medium border border-border/80 bg-surface-subtle p-5 text-xs text-text-secondary flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Invitation Workflow Specification
          </p>
          <p className="text-[11px] leading-relaxed">
            In development and evaluation mode without an outbound SMTP service, newly invited members are provisioned directly into the database with active status and can immediately sign in using their provided credentials to test multi-user collaboration and permission revocation.
          </p>
        </div>
      </div>
    </div>
  );
}
