import { useAuthStore } from '@/stores/auth.store';
import { Permission, ROLE_PERMISSIONS } from '@antrosys/types';
import { hasPermission } from '@/constants/roles';

export function usePermission(permission: Permission): boolean {
  const { user } = useAuthStore();
  if (!user) return false;
  return hasPermission(user.permissions, permission);
}
