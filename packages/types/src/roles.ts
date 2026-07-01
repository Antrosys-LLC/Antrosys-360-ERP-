export enum Role {
  CEO = 'CEO',
  CFO = 'CFO',
  OPERATIONS_HEAD = 'OPERATIONS_HEAD',
  HR_HEAD = 'HR_HEAD',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  EMPLOYEE = 'EMPLOYEE',
  SUB_MANAGER = 'SUB_MANAGER',
}

/** Human-readable label for a Role enum value (matches Prisma `Role`). */
export function formatRoleLabel(role: Role | string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}