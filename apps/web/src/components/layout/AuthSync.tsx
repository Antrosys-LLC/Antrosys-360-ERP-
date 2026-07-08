'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Role, ROLE_PERMISSIONS, type Permission } from '@antrosys/types';
import { fetchMyPermissions } from '@/lib/admin-api';

export function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user.role || 'EMPLOYEE') as Role;
      const userId = session.user.id || '';

      // Set static defaults immediately to avoid a flash of missing UI.
      setUser({
        id: userId,
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole] || [],
      });

      const accessToken = (session as { accessToken?: string }).accessToken;
      if (accessToken && typeof document !== 'undefined') {
        document.cookie = `access-token=${accessToken}; path=/; SameSite=Lax`;
      }

      // Then reconcile with server-resolved effective permissions (which include
      // any admin-configured module access overrides).
      fetchMyPermissions()
        .then((data) => {
          setUser({
            id: userId,
            role: userRole,
            permissions: (data.permissions as Permission[]) ?? ROLE_PERMISSIONS[userRole] ?? [],
          });
        })
        .catch(() => { /* keep static defaults on failure */ });
    } else if (status === 'unauthenticated') {
      clearUser();
      if (typeof document !== 'undefined') {
        document.cookie = 'access-token=; path=/; Max-Age=0';
      }
    }
  }, [session, status, setUser, clearUser]);

  return null;
}
