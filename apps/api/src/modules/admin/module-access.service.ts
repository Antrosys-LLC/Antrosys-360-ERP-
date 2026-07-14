import { prisma } from '../../config/database';
import { ROLE_PERMISSIONS, Role, Permission } from '@antrosys/types';

export type AccessLevel = 'OFF' | 'READ' | 'FULL';

export interface ModuleDef {
  key: string;
  label: string;
  writeCapable: boolean;
}

// Toggleable business modules. `admin` and `audit` are intentionally excluded
// so administrators cannot lock themselves (or the org) out of user management.
export const TOGGLEABLE_MODULES: ModuleDef[] = [
  { key: 'finance', label: 'Finance', writeCapable: true },
  { key: 'payroll', label: 'Payroll', writeCapable: true },
  { key: 'hr', label: 'HR / Employees', writeCapable: true },
  { key: 'recruitment', label: 'Recruitment', writeCapable: true },
  { key: 'attendance', label: 'Attendance', writeCapable: true },
  { key: 'leave', label: 'Leave', writeCapable: true },
  { key: 'manpower', label: 'Manpower', writeCapable: true },
  { key: 'clients', label: 'Clients', writeCapable: true },
  { key: 'reports', label: 'Reports & BI', writeCapable: false },
  { key: 'announcements', label: 'Announcements', writeCapable: true },
  { key: 'documents', label: 'Documents', writeCapable: true },
  { key: 'inventory', label: 'Inventory', writeCapable: true },
];

export const TOGGLEABLE_ROLES: Role[] = [
  Role.CEO,
  Role.CFO,
  Role.OPERATIONS_HEAD,
  Role.HR_HEAD,
  Role.FINANCE_MANAGER,
  Role.PROJECT_MANAGER,
  Role.MANAGER,
  Role.SUB_MANAGER,
  Role.TEAM_LEAD,
  Role.EMPLOYEE,
];

const moduleByKey = new Map(TOGGLEABLE_MODULES.map((m) => [m.key, m]));

/** Access level a role has for a module based purely on the static defaults. */
export function defaultLevelFor(role: Role, moduleKey: string): AccessLevel {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes(`${moduleKey}:write` as Permission)) return 'FULL';
  if (perms.includes(`${moduleKey}:read` as Permission)) return 'READ';
  return 'OFF';
}

// ---- Overrides cache (avoids a DB hit on every authenticated request) ----

type OverrideMap = Map<string, Map<string, AccessLevel>>;
let cache: { data: OverrideMap; expires: number } | null = null;
const CACHE_TTL_MS = 10_000;

export function invalidateModuleAccessCache() {
  cache = null;
}

async function loadOverrides(): Promise<OverrideMap> {
  if (cache && cache.expires > Date.now()) return cache.data;

  const delegate = (prisma as any).roleModuleAccess;
  const rows: Array<{ role: string; module: string; accessLevel: AccessLevel }> =
    await delegate.findMany();

  const map: OverrideMap = new Map();
  for (const row of rows) {
    if (!map.has(row.role)) map.set(row.role, new Map());
    map.get(row.role)!.set(row.module, row.accessLevel);
  }

  cache = { data: map, expires: Date.now() + CACHE_TTL_MS };
  return map;
}

function applyLevel(
  perms: Set<string>,
  moduleKey: string,
  level: AccessLevel,
  writeCapable: boolean,
) {
  perms.delete(`${moduleKey}:read`);
  perms.delete(`${moduleKey}:write`);
  if (level === 'READ') {
    perms.add(`${moduleKey}:read`);
  } else if (level === 'FULL') {
    perms.add(`${moduleKey}:read`);
    if (writeCapable) perms.add(`${moduleKey}:write`);
  }
}

/**
 * Resolves the effective permissions for a role: static defaults overlaid with
 * any admin-configured module access overrides.
 */
export async function getEffectivePermissions(role: string): Promise<Permission[]> {
  const base = ROLE_PERMISSIONS[role as Role] ?? [];
  const overrides = await loadOverrides();
  const roleOverrides = overrides.get(role);
  if (!roleOverrides || roleOverrides.size === 0) return base;

  const perms = new Set<string>(base);
  for (const [moduleKey, level] of roleOverrides) {
    const def = moduleByKey.get(moduleKey);
    if (!def) continue;
    applyLevel(perms, moduleKey, level, def.writeCapable);
  }
  return Array.from(perms) as Permission[];
}

/** Full role x module matrix (effective levels) for the admin UI. */
export async function getModuleAccessMatrix() {
  const overrides = await loadOverrides();

  const roles = TOGGLEABLE_ROLES.map((role) => {
    const roleOverrides = overrides.get(role);
    const modules = TOGGLEABLE_MODULES.map((m) => {
      const overridden = roleOverrides?.get(m.key);
      const defaultLevel = defaultLevelFor(role, m.key);
      return {
        module: m.key,
        level: overridden ?? defaultLevel,
        isOverridden: overridden !== undefined && overridden !== defaultLevel,
      };
    });
    return { role, modules };
  });

  return {
    modules: TOGGLEABLE_MODULES,
    roles,
  };
}

export async function setModuleAccess(
  role: string,
  moduleKey: string,
  level: AccessLevel,
  userId: string,
) {
  await prisma.$transaction(async (tx) => {
    const txDelegate = (tx as any).roleModuleAccess;
    await txDelegate.upsert({
      where: { role_module: { role, module: moduleKey } },
      create: { role, module: moduleKey, accessLevel: level, updatedByUserId: userId },
      update: { accessLevel: level, updatedByUserId: userId },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'MODULE_ACCESS_UPDATE',
        metadata: { role, module: moduleKey, accessLevel: level },
      },
    });
  });

  invalidateModuleAccessCache();

  return { role, module: moduleKey, level };
}
