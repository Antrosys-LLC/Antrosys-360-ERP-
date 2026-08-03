import { Role, WorkScheduleConfig } from '@prisma/client';
import { ROLE_PERMISSIONS, Permission, formatRoleLabel } from '@antrosys/types';
import { getWorkScheduleConfig } from '../employee/EmployeeDashboard/employee_dashboard.service';

const PERMISSION_TO_MODULE: Partial<Record<Permission, string>> = {
  'attendance:read': 'Attendance',
  'attendance:write': 'Attendance',
  'leave:read': 'Leave',
  'leave:write': 'Leave',
  'payroll:read': 'Payslips',
  'payroll:write': 'Payroll',
  'hr:read': 'HR',
  'hr:write': 'HR',
  'recruitment:read': 'Recruitment',
  'recruitment:write': 'Recruitment',
  'finance:read': 'Finance',
  'finance:write': 'Finance',
  'manpower:read': 'Manpower',
  'manpower:write': 'Manpower',
  'clients:read': 'Clients',
  'clients:write': 'Clients',
  'reports:read': 'Reports',
  'announcements:read': 'Announcements',
  'announcements:write': 'Announcements',
  'documents:read': 'Documents',
  'documents:write': 'Documents',
  'admin:read': 'Admin',
  'admin:write': 'Admin',
  'audit:read': 'Audit Logs',
};

type OfficeAccessEmployee = {
  location: string | null;
  employeeType: string | null;
};

type OfficeAccessUser = {
  role: Role;
  lastLoginAt: Date | null;
};

function padTimePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatWorkShiftLabel(config: WorkScheduleConfig): string {
  const startHour = padTimePart(config.lateAfterHour);
  const startMinute = padTimePart(config.lateAfterMinute);
  const hoursPerDay = Number(config.standardHoursPerDay);
  const totalStartMinutes = config.lateAfterHour * 60 + config.lateAfterMinute;
  const totalEndMinutes = totalStartMinutes + Math.round(hoursPerDay * 60);
  const endHour = Math.floor(totalEndMinutes / 60);
  const endMinute = totalEndMinutes % 60;
  return `General (${startHour}:${startMinute} - ${padTimePart(endHour)}:${padTimePart(endMinute)})`;
}

export function formatLastLoginLabel(lastLoginAt: Date | null | undefined): string {
  if (!lastLoginAt) return 'Never';

  const now = new Date();
  const login = new Date(lastLoginAt);
  const isSameDay =
    login.getFullYear() === now.getFullYear() &&
    login.getMonth() === now.getMonth() &&
    login.getDate() === now.getDate();

  const timeLabel = login.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (isSameDay) {
    return `Today, ${timeLabel}`;
  }

  return login.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getSystemAccessLabel(role: Role): string {
  return formatRoleLabel(role);
}

function getActiveModulesForRole(role: Role): string[] {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const modules = new Set<string>(['ESS']);

  for (const permission of permissions) {
    const moduleName = PERMISSION_TO_MODULE[permission];
    if (moduleName) {
      modules.add(moduleName);
    }
  }

  return Array.from(modules).sort((a, b) => a.localeCompare(b));
}

export function buildOfficeAccessPayload(
  employee: OfficeAccessEmployee,
  user: OfficeAccessUser,
  schedule: WorkScheduleConfig,
) {
  return {
    details: [
      { label: 'Location', value: employee.location?.trim() || 'Not assigned' },
      { label: 'Shift', value: formatWorkShiftLabel(schedule) },
      { label: 'Work Mode', value: employee.employeeType?.trim() || 'Not specified' },
      { label: 'System Access', value: getSystemAccessLabel(user.role) },
      { label: 'Last Login', value: formatLastLoginLabel(user.lastLoginAt) },
    ],
    activeModules: getActiveModulesForRole(user.role),
  };
}

type EmployeeForOfficeAccess = {
  location: string | null;
  employeeType: string | null;
  user: {
    role: Role;
    lastLoginAt: Date | null;
  };
};

export async function buildOfficeAccessForEmployee(employee: EmployeeForOfficeAccess) {
  const schedule = await getWorkScheduleConfig();
  return buildOfficeAccessPayload(
    {
      location: employee.location,
      employeeType: employee.employeeType,
    },
    {
      role: employee.user.role,
      lastLoginAt: employee.user.lastLoginAt,
    },
    schedule,
  );
}
