import React from 'react';
import { Menu, ShieldCheck, Search, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';
import { NotificationsMenu } from './NotificationsMenu';

interface TopbarProps {
  onOpenMobileNav: () => void;
  onOpenSearch?: () => void;
  onOpenUpload?: () => void;
  title?: string;
}

export function Topbar({ onOpenMobileNav, onOpenSearch, onOpenUpload, title }: TopbarProps) {
  const { user, role } = useAuth();
  const userInitial = user?.full_name?.charAt(0).toUpperCase() || 'U';

  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      {/* Left: Mobile Nav toggle, Logo, Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-small text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="lg:hidden">
          <TrustVaultLogo variant="symbol" size="sm" />
        </div>
        {title && (
          <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Center/Right: Global Search Bar, Notifications, Quick Actions, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Global Command Palette Trigger Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-medium bg-surface-subtle hover:bg-surface-ivory border border-border text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs"
          title="Search or press Ctrl+K"
          aria-label="Open global search palette"
        >
          <Search className="w-3.5 h-3.5 text-primary" />
          <span className="hidden md:inline font-medium">Search anything...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-text-muted border border-border">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Quick Upload Action */}
        {onOpenUpload && (
          <Button
            size="sm"
            onClick={onOpenUpload}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-primary hover:bg-primary-hover text-white shadow-subtle"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </Button>
        )}

        {/* Real-time Notifications Menu */}
        <NotificationsMenu />

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* User Identity Display */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-soft border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-text-primary block leading-tight">
              {user?.full_name || 'Authenticated User'}
            </span>
            <span className="text-[11px] text-text-muted block truncate max-w-[160px]">
              {user?.email}
            </span>
          </div>
        </div>

        <Badge
          variant={role === 'admin' ? 'default' : 'neutral'}
          className="capitalize hidden xl:inline-flex text-[10px] font-bold"
        >
          <ShieldCheck className="w-3 h-3 mr-1 text-primary" />
          {role}
        </Badge>
      </div>
    </header>
  );
}
