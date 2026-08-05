import { prisma } from '../../config/database';

/**
 * Determines whether a user may create/update/delete KPIs for a given department.
 * - CEO / HR_HEAD / OPERATIONS_HEAD: any department (incl. company-wide KPIs).
 * - MANAGER: only KPIs belonging to the department of the team they manage.
 * - Everyone else: denied (RBAC `kpi:write` gates the route itself).
 */
export async function canManageDepartmentKpis(
  userId: string,
  role: string,
  department?: string | null,
): Promise<boolean> {
  if (role === 'CEO' || role === 'HR_HEAD' || role === 'OPERATIONS_HEAD') {
    return true;
  }

  if (role === 'MANAGER') {
    // Company-wide (no department) KPIs are out of scope for line managers.
    if (!department) return false;

    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true, department: true },
    });
    if (!employee) return false;

    const team = await prisma.team.findUnique({
      where: { managerId: employee.id },
      select: { department: true },
    });

    // Prefer the managed team's department, falling back to the manager's own
    // employee record when the team has no department assigned.
    const scopedDepartment = team?.department ?? employee.department;
    return scopedDepartment === department;
  }

  return false;
}
