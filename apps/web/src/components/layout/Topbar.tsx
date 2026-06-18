'use client';

import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';

export function Topbar() {
  const { pageTitle } = useUIStore();
  const { user } = useAuthStore();

  const initials = user?.role?.slice(0, 2).toUpperCase() || 'U';

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
        {/* Notification bell */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
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
