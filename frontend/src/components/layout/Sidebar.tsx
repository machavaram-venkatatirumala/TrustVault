import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Share2,
  KeyRound,
  ShieldCheck,
  Users,
  UserPlus,
  Lock,
  HardDrive,
  Settings,
  LogOut,
  FolderLock,
  Building2,
  ExternalLink,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/app/overview', icon: LayoutDashboard },
  { name: 'Documents', href: '/app/documents', icon: Files },
  { name: 'Shared with me', href: '/app/shared-with-me', icon: Share2 },
  { name: 'Access Permissions', href: '/app/sharing', icon: KeyRound },
  { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true },
  { name: 'Members', href: '/app/members', icon: Users, adminOnly: true },
  { name: 'Invitations', href: '/app/invitations', icon: UserPlus, adminOnly: true },
  { name: 'Security Controls', href: '/app/security', icon: Lock },
  { name: 'Plan & Usage', href: '/app/billing', icon: HardDrive },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const { user, organization, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const isPersonal = organization?.workspace_type === 'personal';

  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r border-border bg-white dark:bg-elevated flex flex-col justify-between h-screen sticky top-0 select-none z-30',
        className
      )}
    >
      {/* Top Brand & Workspace Switcher */}
      <div className="overflow-y-auto flex-1">
        <div className="h-16 flex items-center px-4 border-b border-border sticky top-0 bg-white dark:bg-elevated z-10">
          <Link to="/app" className="inline-flex items-center">
            <TrustVaultLogo size="sm" />
          </Link>
        </div>

        {/* Workspace Scope Card */}
        <div className="p-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-small bg-surface-subtle border border-border/80">
            <div className="w-7 h-7 rounded-small bg-white dark:bg-elevated border border-border flex items-center justify-center text-primary shrink-0 shadow-subtle">
              {isPersonal ? <FolderLock className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                {organization?.name || 'My Workspace'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                <span className="text-[10px] text-text-muted capitalize">
                  {isPersonal ? 'Personal Vault' : 'Shared Workspace'} • {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-1 space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-small text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary-soft text-primary font-semibold shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )
                }
              >
                <Icon className="w-4 h-4 stroke-[1.8]" />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Documentation Links & User Info */}
      <div className="border-t border-border bg-white dark:bg-elevated shrink-0">
        <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between text-[11px] text-text-muted">
          <Link to="/security" target="_blank" className="hover:text-text-primary transition-colors flex items-center gap-1">
            <span>Security</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
          <Link to="/privacy" target="_blank" className="hover:text-text-primary transition-colors">Privacy</Link>
          <Link to="/terms" target="_blank" className="hover:text-text-primary transition-colors">Terms</Link>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between p-2 rounded-small hover:bg-surface-subtle transition-colors">
            <Link to="/app/profile" className="flex items-center gap-2.5 min-w-0 flex-1" title="View profile">
              <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight hover:underline">
                  {user?.full_name || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-small text-text-muted hover:text-danger hover:bg-danger-bg transition-colors shrink-0 ml-1"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
