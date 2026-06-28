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
  | 'documents:write';

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
  ],

  [Role.FINANCE_MANAGER]: [
    'finance:read',
    'finance:write',
    'payroll:read',
    'payroll:write',
    'documents:read',
    'documents:write',
  ],

  [Role.PROJECT_MANAGER]: [
    'clients:read',
    'reports:read',
    'documents:read',
  ],

  [Role.MANAGER]: [
    'attendance:read',
    'attendance:write',
    'leave:write',
    'hr:read',
    'announcements:read',
    'announcements:write',
    'documents:read',
    'documents:write',
  ],

  [Role.SUB_MANAGER]: [
    'attendance:read',
    'attendance:write',
    'leave:write',
    'hr:read',
    'announcements:read',
    'announcements:write',
    'documents:read',
    'documents:write',
  ],

  [Role.TEAM_LEAD]: [
    'attendance:read',
    'hr:read',
    'documents:read',
  ],

  [Role.EMPLOYEE]: [
    'attendance:write',
    'leave:read',
    'leave:write',
    'documents:read',
  ],
};

