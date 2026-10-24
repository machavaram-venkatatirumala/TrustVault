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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Overview', href: '/app/overview', icon: LayoutDashboard },
  { name: 'Documents', href: '/app/documents', icon: Files },
  { name: 'Shared with me', href: '/app/shared-with-me', icon: Share2 },
  { name: 'Document Sharing', href: '/app/sharing', icon: KeyRound },
  { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true },
  { name: 'Members', href: '/app/members', icon: Users, adminOnly: true },
  { name: 'Invitations', href: '/app/invitations', icon: UserPlus, adminOnly: true },
  { name: 'Security Controls', href: '/app/security', icon: Lock },
  { name: 'Plan & Usage', href: '/app/billing', icon: HardDrive },
  { name: 'Settings', href: '/app/settings', icon: Settings },
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
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-elevated border-r border-border flex flex-col justify-between shadow-2xl"
          >
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border sticky top-0 bg-white dark:bg-elevated z-10">
                <Link to="/app" onClick={onClose}>
                  <TrustVaultLogo size="sm" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-small text-text-muted hover:text-text-primary hover:bg-surface-subtle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workspace info */}
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

              {/* Nav */}
              <nav className="px-3 py-1 space-y-0.5">
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
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
