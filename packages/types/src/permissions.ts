import { Role } from './roles';

export type Permission =
  | 'finance:read'
  | 'finance:write'
  | 'payroll:read'
  | 'payroll:write'
  | 'hr:read'
  | 'hr:write'
  | 'recruitment:read'
  | 'recruitment:write'
  | 'attendance:read'
  | 'attendance:write'
  | 'leave:read'
  | 'leave:write'
  | 'manpower:read'
  | 'manpower:write'
  | 'clients:read'
  | 'clients:write'
  | 'reports:read'
  | 'announcements:read'
  | 'announcements:write'
  | 'admin:read'
  | 'admin:write'
  | 'audit:read'
  | 'documents:read'
  | 'documents:write'
  | 'bank_feeds:read'
  | 'bank_feeds:write'
  | 'inventory:read'
  | 'inventory:write';

const ALL_PERMISSIONS: Permission[] = [
  'finance:read',
  'finance:write',
  'payroll:read',
  'payroll:write',
  'hr:read',
  'hr:write',
  'recruitment:read',
  'recruitment:write',
  'attendance:read',
  'attendance:write',
  'leave:read',
  'leave:write',
  'manpower:read',
  'manpower:write',
  'clients:read',
  'clients:write',
  'reports:read',
  'announcements:read',
  'announcements:write',
  'admin:read',
  'admin:write',
  'audit:read',
  'documents:read',
  'documents:write',
  'bank_feeds:read',
  'bank_feeds:write',
  'inventory:read',
  'inventory:write',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.CEO]: ALL_PERMISSIONS,

  [Role.CFO]: [
    'finance:read',
    'finance:write',
    'payroll:read',
    'payroll:write',
    'reports:read',
    'clients:read',
    'documents:read',
    'documents:write',
    'bank_feeds:read',
    'bank_feeds:write',
    'inventory:read',
    'inventory:write',
  ],

  [Role.OPERATIONS_HEAD]: [
    'attendance:read',
    'attendance:write',
    'leave:read',
    'leave:write',
    'manpower:read',
    'manpower:write',
    'announcements:read',
    'announcements:write',
    'documents:read',
    'documents:write',
    'inventory:read',
    'inventory:write',
  ],

  [Role.HR_HEAD]: [
    'hr:read',
    'hr:write',
    'recruitment:read',
    'recruitment:write',
    'attendance:read',
    'leave:read',
    'documents:read',
    'documents:write',
    'inventory:read',
  ],

  [Role.FINANCE_MANAGER]: [
    'finance:read',
    'finance:write',
    'payroll:read',
    'payroll:write',
    'documents:read',
    'documents:write',
    'bank_feeds:read',
    'bank_feeds:write',
    'inventory:read',
  ],

  [Role.PROJECT_MANAGER]: [
    'clients:read',
    'reports:read',
    'documents:read',
    'inventory:read',
  ],

  [Role.MANAGER]: [
    'attendance:read',
    'attendance:write',
    'leave:read',
    'leave:write',
    'hr:read',
    'hr:write',
    'announcements:read',
    'announcements:write',
    'documents:read',
    'documents:write',
    'inventory:read',
    'inventory:write',
  ],

  [Role.SUB_MANAGER]: [
    'attendance:read',
    'attendance:write',
    'leave:read',
    'leave:write',
    'hr:read',
    'hr:write',
    'announcements:read',
    'announcements:write',
    'documents:read',
    'documents:write',
    'inventory:read',
  ],

  [Role.TEAM_LEAD]: [
    'attendance:read',
    'hr:read',
    'documents:read',
    'inventory:read',
  ],

  [Role.EMPLOYEE]: [
    'attendance:read',
    'attendance:write',
    'leave:read',
    'leave:write',
    'documents:read',
    'announcements:read',
    'payroll:read',
    'inventory:read',
  ],
};

