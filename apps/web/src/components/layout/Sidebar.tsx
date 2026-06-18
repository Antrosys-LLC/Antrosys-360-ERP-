'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { ROLE_NAV_CONFIG } from '@/constants/nav';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  const role = user?.role || 'EMPLOYEE';
  const navItems = ROLE_NAV_CONFIG[role as keyof typeof ROLE_NAV_CONFIG] || [];

  return (
    <aside className={`erp-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center gap-3 border-b px-4">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-primary" />
        {!isSidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight">Antrosys</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-l-[3px] border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-4 right-2 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
        aria-label="Toggle sidebar"
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
