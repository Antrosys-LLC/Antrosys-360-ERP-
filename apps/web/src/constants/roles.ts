export { Role, ROLE_PERMISSIONS } from '@antrosys/types';
import type { Permission } from '@antrosys/types';

export function hasPermission(
  userPermissions: Permission[],
  required: Permission,
): boolean {
  return userPermissions.includes(required);
}
