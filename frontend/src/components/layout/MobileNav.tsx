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
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer content */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-72 max-w-[85vw] h-full bg-white shadow-modal flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-small bg-primary flex items-center justify-center text-white">
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
                <button
                  onClick={onClose}
                  className="p-1 rounded-small text-text-muted hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Organization badge */}
              <div className="p-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-small bg-surface-subtle border border-border">
                  <Building2 className="w-4 h-4 text-accent-ink" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {organization?.name || 'Workspace'}
                    </p>
                    <p className="text-[10px] text-text-secondary capitalize">{role}</p>
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
            <div className="p-4 border-t border-border bg-white flex items-center justify-between">
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
