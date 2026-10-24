import React, { useState } from 'react';
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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  CheckSquare,
  Bookmark,
  ShieldAlert,
  ClipboardCheck,
  PackageCheck,
  Cpu,
  BarChart3,
  Flag
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  colorClass: string;
  iconBg: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Document Hub',
    items: [
      { name: 'Overview', href: '/app/overview', icon: LayoutDashboard, colorClass: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
      { name: 'Documents', href: '/app/documents', icon: Files, colorClass: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
      { name: 'Access Explorer', href: '/app/access-explorer', icon: Network, colorClass: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
      { name: 'Approvals', href: '/app/approvals', icon: CheckSquare, colorClass: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
      { name: 'Saved Searches', href: '/app/saved-searches', icon: Bookmark, colorClass: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
      { name: 'Shared with me', href: '/app/shared-with-me', icon: Share2, colorClass: 'text-teal-600', iconBg: 'bg-teal-50 text-teal-600' },
      { name: 'Access Permissions', href: '/app/sharing', icon: KeyRound, colorClass: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
    ],
  },
  {
    label: 'Security & Governance',
    items: [
      { name: 'Policies & Guardrails', href: '/app/policies', icon: ShieldAlert, adminOnly: true, colorClass: 'text-purple-600', iconBg: 'bg-purple-50 text-purple-600' },
      { name: 'Access Reviews', href: '/app/access-reviews', icon: ClipboardCheck, adminOnly: true, colorClass: 'text-teal-600', iconBg: 'bg-teal-50 text-teal-600' },
      { name: 'Evidence Center', href: '/app/evidence-center', icon: PackageCheck, adminOnly: true, colorClass: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
      { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true, colorClass: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
      { name: 'Security Controls', href: '/app/security', icon: Lock, colorClass: 'text-slate-600', iconBg: 'bg-slate-100 text-slate-700' },
    ],
  },
  {
    label: 'Workspace Administration',
    items: [
      { name: 'Members', href: '/app/members', icon: Users, adminOnly: true, colorClass: 'text-rose-600', iconBg: 'bg-rose-50 text-rose-600' },
      { name: 'Invitations', href: '/app/invitations', icon: UserPlus, adminOnly: true, colorClass: 'text-teal-600', iconBg: 'bg-teal-50 text-teal-600' },
      { name: 'SSO & Integrations', href: '/app/integrations', icon: Cpu, adminOnly: true, colorClass: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
      { name: 'Usage & Quotas', href: '/app/quotas', icon: BarChart3, adminOnly: true, colorClass: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
      { name: 'Feature Flags', href: '/app/feature-flags', icon: Flag, adminOnly: true, colorClass: 'text-purple-600', iconBg: 'bg-purple-50 text-purple-600' },
      { name: 'Settings', href: '/app/settings', icon: Settings, colorClass: 'text-slate-600', iconBg: 'bg-slate-100 text-slate-600' },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const { user, organization, role, isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('trustvault_sidebar_collapsed') === 'true';
  });
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('trustvault_sidebar_collapsed', String(next));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const isPersonal = organization?.workspace_type === 'personal';
  const userInitial = user?.full_name?.charAt(0).toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-all duration-200',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Top Brand & Workspace Scope */}
      <div className="overflow-y-auto flex-1 scrollbar-none">
        <div
          className={cn(
            'h-16 flex items-center border-b border-slate-200 sticky top-0 bg-white z-10 px-4 justify-between',
            collapsed && 'px-3 justify-center'
          )}
        >
          <Link to="/app" className="inline-flex items-center" title="TrustVault Enterprise">
            <TrustVaultLogo size="sm" variant={collapsed ? 'symbol' : 'horizontal'} />
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Scope Card */}
        <div className="p-2.5">
          {collapsed ? (
            <div
              className="w-10 h-10 mx-auto rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs cursor-pointer"
              title={`${organization?.name || 'Workspace'} (${role})`}
              onClick={toggleCollapsed}
            >
              {isPersonal ? <FolderLock className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                {isPersonal ? <FolderLock className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {organization?.name || 'My Workspace'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-500 capitalize font-medium">
                    {isPersonal ? 'Personal Vault' : 'Enterprise Vault'} • {role}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grouped Navigation */}
        <div className="px-2.5 py-1 space-y-4">
          {navGroups.map((group) => {
            // Check if any items in this group are visible to current user
            const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative',
                          collapsed && 'justify-center px-0 py-2',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600" />
                          )}

                          <div
                            className={cn(
                              'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                              isActive ? 'bg-blue-600 text-white shadow-xs' : item.iconBg
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 stroke-[2]" />
                          </div>

                          {!collapsed && <span className="truncate">{item.name}</span>}

                          {!collapsed && item.adminOnly && (
                            <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: User Info & Expand Trigger */}
      <div className="border-t border-slate-200 bg-white shrink-0">
        {collapsed ? (
          <div className="p-2.5 flex flex-col items-center gap-2">
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <Link to="/security" target="_blank" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <span>Security</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
              <Link to="/privacy" target="_blank" className="hover:text-slate-700 transition-colors">Privacy</Link>
              <Link to="/terms" target="_blank" className="hover:text-slate-700 transition-colors">Terms</Link>
              <button
                onClick={toggleCollapsed}
                className="text-slate-400 hover:text-slate-700 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2.5">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Link to="/app/profile" className="flex items-center gap-2.5 min-w-0 flex-1" title="View profile">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {user?.full_name || 'My Account'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                  title="Sign out of TrustVault"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
