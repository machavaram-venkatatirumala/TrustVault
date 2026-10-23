import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Share2,
  KeyRound,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  Building2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/app', icon: LayoutDashboard },
  { name: 'Documents', href: '/app/documents', icon: Files },
  { name: 'Shared with me', href: '/app/shared', icon: Share2 },
  { name: 'Access Permissions', href: '/app/permissions', icon: KeyRound },
  { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true },
  { name: 'Members', href: '/app/members', icon: Users, adminOnly: true },
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

  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r border-border bg-white flex flex-col justify-between h-screen sticky top-0 select-none z-30',
        className
      )}
    >
      {/* Top Brand & Workspace Switcher */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-border gap-2.5">
          <div className="w-8 h-8 rounded-small bg-primary flex items-center justify-center text-white shadow-subtle">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-text-primary block leading-none">
              TrustVault
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted block mt-0.5">
              Enterprise Security
            </span>
          </div>
        </div>

        {/* Organization Scope Card */}
        <div className="p-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-small bg-surface-subtle/60 border border-border/60">
            <div className="w-7 h-7 rounded-small bg-white border border-border flex items-center justify-center text-accent-ink shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                {organization?.name || 'Workspace'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                <span className="text-[11px] text-text-secondary capitalize">
                  {role === 'admin' ? 'Organization Admin' : 'Member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/app'}
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
                  <span className="ml-auto text-[9px] uppercase tracking-wider font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Sign Out Footer */}
      <div className="p-3 border-t border-border bg-white">
        <div className="flex items-center justify-between p-2 rounded-small hover:bg-surface-subtle/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-accent-periwinkle/30 border border-accent-periwinkle text-accent-ink font-semibold text-xs flex items-center justify-center shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                {user?.full_name || 'Authenticated User'}
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-small text-text-muted hover:text-danger hover:bg-danger-bg transition-colors shrink-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
