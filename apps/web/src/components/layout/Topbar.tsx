'use client';

import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Bell, LogOut, Settings, User, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

// API Helpers
async function fetchNotifications(): Promise<NotificationsResponse> {
  const { data } = await apiClient.get('/notifications');
  return data.data;
}

async function markNotificationAsRead(id: string) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
}

async function markAllNotificationsAsRead() {
  const { data } = await apiClient.post('/notifications/read-all');
  return data;
}

function timeAgo(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Topbar() {
  const { pageTitle } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const initials = user?.role?.slice(0, 2).toUpperCase() || 'U';

  // React Query fetch
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60000, // auto-refresh notifications every 60 seconds
    retry: 1,
    retryDelay: 3000,
    enabled: !!user,
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.items || [];

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-[var(--topbar-height)] items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6"
      style={{ left: 'var(--sidebar-width)' }}
    >
      {/* Page title */}
      <h2 className="text-lg font-semibold text-foreground">
        {pageTitle || 'Dashboard'}
      </h2>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notification bell dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition outline-none cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-xs text-[#4F46E5] hover:underline font-semibold focus:outline-none cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Mail className="h-8 w-8 text-muted-foreground/40" />
                  <span>No notifications yet.</span>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) {
                        markAsReadMutation.mutate(item.id);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-accent/40 ${
                      !item.isRead ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {/* Unread indicator */}
                    <div className="mt-1 shrink-0">
                      {!item.isRead ? (
                        <span className="block h-2 w-2 rounded-full bg-[#4F46E5]" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full border border-muted" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow space-y-0.5 text-xs">
                      <p className={`font-semibold text-foreground ${!item.isRead ? 'font-bold' : ''}`}>
                        {item.title}
                      </p>
                      <p className="text-muted-foreground leading-normal">{item.message}</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition outline-none cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 shadow-lg border border-border bg-card">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
