import React from 'react';
import { Menu, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';

interface TopbarProps {
  onOpenMobileNav: () => void;
  title?: string;
}

export function Topbar({ onOpenMobileNav, title }: TopbarProps) {
  const { user, role, organization } = useAuth();

  const userInitial = user?.full_name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-small text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User Identity Display */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-soft border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-text-primary block leading-tight">
              {user?.full_name || 'Authenticated User'}
            </span>
            <span className="text-[11px] text-text-muted block truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>
        </div>

        <Badge variant={role === 'admin' ? 'default' : 'neutral'} className="capitalize hidden sm:inline-flex">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {role}
        </Badge>
      </div>
    </header>
  );
}
