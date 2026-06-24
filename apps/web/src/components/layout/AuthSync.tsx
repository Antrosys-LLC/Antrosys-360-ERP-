'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Role, ROLE_PERMISSIONS } from '@antrosys/types';

export function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user.role || 'EMPLOYEE') as Role;
      setUser({
        id: session.user.id || '',
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole] || [],
      });

      const accessToken = (session as { accessToken?: string }).accessToken;
      if (accessToken && typeof document !== 'undefined') {
        document.cookie = `access-token=${accessToken}; path=/; SameSite=Lax`;
      }
    } else if (status === 'unauthenticated') {
      clearUser();
      if (typeof document !== 'undefined') {
        document.cookie = 'access-token=; path=/; Max-Age=0';
      }
    }
  }, [session, status, setUser, clearUser]);

  return null;
}
