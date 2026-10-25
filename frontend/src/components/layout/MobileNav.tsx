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
  Building2,
  FolderLock,
  X,
  User,
  Network,
  CheckSquare,
  Bookmark,
  ShieldAlert,
  ClipboardCheck,
  PackageCheck,
  Cpu,
  BarChart3,
  Flag,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Document Hub',
    items: [
      { name: 'Overview', href: '/app/overview', icon: LayoutDashboard },
      { name: 'Documents', href: '/app/documents', icon: Files },
      { name: 'Access Explorer', href: '/app/access-explorer', icon: Network },
      { name: 'Approvals', href: '/app/approvals', icon: CheckSquare },
      { name: 'Saved Searches', href: '/app/saved-searches', icon: Bookmark },
      { name: 'Shared with me', href: '/app/shared-with-me', icon: Share2 },
      { name: 'Access Permissions', href: '/app/sharing', icon: KeyRound },
    ],
  },
  {
    label: 'Security & Governance',
    items: [
      { name: 'Policies & Guardrails', href: '/app/policies', icon: ShieldAlert, adminOnly: true },
      { name: 'Access Reviews', href: '/app/access-reviews', icon: ClipboardCheck, adminOnly: true },
      { name: 'Evidence Center', href: '/app/evidence-center', icon: PackageCheck, adminOnly: true },
      { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true },
      { name: 'Security Controls', href: '/app/security', icon: Lock },
    ],
  },
  {
    label: 'Workspace Administration',
    items: [
      { name: 'Members', href: '/app/members', icon: Users, adminOnly: true },
      { name: 'Invitations', href: '/app/invitations', icon: UserPlus, adminOnly: true },
      { name: 'SSO & Integrations', href: '/app/integrations', icon: Cpu, adminOnly: true },
      { name: 'Usage & Quotas', href: '/app/quotas', icon: BarChart3, adminOnly: true },
      { name: 'Feature Flags', href: '/app/feature-flags', icon: Flag, adminOnly: true },
      { name: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user, organization, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch {
      onClose();
      navigate('/login');
    }
  };

  const isPersonal = organization?.workspace_type === 'personal';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-72 bg-white border-r border-border flex flex-col justify-between shadow-2xl safe-pb"
          >
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border sticky top-0 bg-white z-10">
                <Link to="/app" onClick={onClose}>
                  <TrustVaultLogo size="sm" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-small text-text-muted hover:text-text-primary hover:bg-surface-subtle"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workspace info */}
              <div className="p-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-small bg-surface-subtle border border-border/80">
                  <div className="w-7 h-7 rounded-small bg-white border border-border flex items-center justify-center text-primary shrink-0 shadow-subtle">
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

              {/* Nav Groups */}
              <nav className="px-3 py-1 space-y-4">
                {navGroups.map((group) => {
                  const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.label} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.href}
                              to={item.href}
                              onClick={onClose}
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
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Bottom User Area */}
            <div className="p-3 border-t border-border bg-white dark:bg-elevated shrink-0">
              <div className="flex items-center justify-between p-2 rounded-small hover:bg-surface-subtle transition-colors">
                <Link to="/app/profile" onClick={onClose} className="flex items-center gap-2.5 min-w-0 flex-1">
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
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
