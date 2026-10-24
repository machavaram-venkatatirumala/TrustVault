import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Share2,
  ShieldAlert,
  UserPlus,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { formatRelativeTime } from '../../lib/formatters';

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch real notifications with background polling and refetch on focus
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 20000, // 20s live check
    refetchOnWindowFocus: true,
  });

  const unreadCount = data?.unread_count || 0;
  const notifications = data?.notifications || [];

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id);
    }
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'share':
        return <Share2 className="w-3.5 h-3.5 text-lavender" />;
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-coral" />;
      case 'invitation':
        return <UserPlus className="w-3.5 h-3.5 text-teal" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-small text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
        aria-label="Open notifications menu"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white animate-in zoom-in duration-150">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-large border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-coral/15 text-coral">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <Bell className="w-6 h-6 text-text-muted mx-auto stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-text-primary">No notifications yet</p>
                <p className="text-[11px] text-text-muted">
                  You&apos;ll be notified about document shares, invitations, and security events here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-surface-subtle cursor-pointer transition-colors flex items-start gap-3 ${
                    !n.is_read ? 'bg-primary-soft/40' : 'bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-small bg-white border border-border flex items-center justify-center shrink-0 shadow-subtle mt-0.5">
                    {getTypeIcon(n.notification_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-text-primary truncate">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-muted">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatRelativeTime(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
