import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  UserPlus,
  UserCheck,
  ClipboardCheck,
  Calendar,
  CalendarRange,
  UsersRound,
  Building2,
  BarChart3,
  Megaphone,
  Shield,
  ScrollText,
} from 'lucide-react';
import type { Permission } from '@antrosys/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Invoices', href: '/finance/invoices', icon: FileText, permission: 'finance:read' },
  { label: 'Payroll', href: '/finance/payroll', icon: Wallet, permission: 'payroll:read' },
  { label: 'Employees', href: '/hr/employees', icon: Users, permission: 'hr:read' },
  { label: 'Onboarding', href: '/onboard', icon: UserCheck, permission: 'hr:read' },
  { label: 'Recruitment', href: '/hr/recruitment', icon: UserPlus, permission: 'recruitment:read' },
  { label: 'Attendance', href: '/operations/attendance', icon: ClipboardCheck, permission: 'attendance:read' },
  { label: 'Leave', href: '/operations/leave', icon: Calendar, permission: 'leave:read' },
  { label: 'Manpower', href: '/operations/manpower', icon: UsersRound, permission: 'manpower:read' },
  { label: 'Clients', href: '/clients', icon: Building2, permission: 'clients:read' },
  { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports:read' },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, permission: 'announcements:read' },
  { label: 'Admin', href: '/admin/users', icon: Shield, permission: 'admin:read' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, permission: 'audit:read' },
];

// Import ROLE_PERMISSIONS to filter nav items per role
import { ROLE_PERMISSIONS } from '@antrosys/types';

type RoleKey =
  | 'CEO'
  | 'CFO'
  | 'OPERATIONS_HEAD'
  | 'HR_HEAD'
  | 'FINANCE_MANAGER'
  | 'PROJECT_MANAGER'
  | 'MANAGER'
  | 'SUB_MANAGER'
  | 'TEAM_LEAD'
  | 'EMPLOYEE';

function getNavForRole(role: RoleKey): NavItem[] {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return ALL_NAV_ITEMS.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );
}

export const ROLE_NAV_CONFIG: Record<RoleKey, NavItem[]> = {
  CEO: getNavForRole('CEO'),
  CFO: getNavForRole('CFO'),
  OPERATIONS_HEAD: getNavForRole('OPERATIONS_HEAD'),
  HR_HEAD: getNavForRole('HR_HEAD'),
  FINANCE_MANAGER: getNavForRole('FINANCE_MANAGER'),
  PROJECT_MANAGER: getNavForRole('PROJECT_MANAGER'),
  MANAGER: getNavForRole('MANAGER'),
  SUB_MANAGER: getNavForRole('SUB_MANAGER'),
  TEAM_LEAD: getNavForRole('TEAM_LEAD'),
  EMPLOYEE: getNavForRole('EMPLOYEE'),
};
