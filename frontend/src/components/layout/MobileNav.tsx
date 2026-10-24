import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
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
  FolderLock,
  X,
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
  { name: 'Overview', href: '/app', icon: LayoutDashboard },
  { name: 'Documents', href: '/app/documents', icon: Files },
  { name: 'Shared with me', href: '/app/shared', icon: Share2 },
  { name: 'Access Permissions', href: '/app/permissions', icon: KeyRound },
  { name: 'Audit Center', href: '/app/audit', icon: ShieldCheck, adminOnly: true },
  { name: 'Members', href: '/app/members', icon: Users, adminOnly: true },
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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer content */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-elevated shadow-modal flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <TrustVaultLogo size="sm" />
                <button
                  onClick={onClose}
                  className="p-1 rounded-small text-text-muted hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workspace badge */}
              <div className="p-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-small bg-surface-subtle border border-border">
                  <div className="w-7 h-7 rounded-small bg-white dark:bg-elevated border border-border flex items-center justify-center text-primary shrink-0">
                    {isPersonal ? <FolderLock className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {organization?.name || 'Workspace'}
                    </p>
                    <p className="text-[10px] text-text-muted capitalize">
                      {isPersonal ? 'Personal Vault' : 'Shared Workspace'} • {role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="px-3 py-2 space-y-1">
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={item.href === '/app'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-small text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary-soft text-primary font-semibold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* User footer */}
            <div className="p-4 border-t border-border bg-white dark:bg-elevated flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-danger hover:bg-danger-bg rounded-small"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
