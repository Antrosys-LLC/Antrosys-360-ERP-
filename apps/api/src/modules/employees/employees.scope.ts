import { prisma } from '../../config/database';

const LEAVE_READ_ALL_ROLES = ['HR_HEAD', 'CEO', 'OPERATIONS_HEAD', 'MANAGER'];

export async function canUserEditEmployee(userId: string, userRole: string, targetEmployeeId: string): Promise<boolean> {
  if (userRole === 'HR_HEAD' || userRole === 'CEO') {
    return true;
  }

  if (userRole === 'MANAGER') {
    return true;
  }

  if (userRole === 'SUB_MANAGER') {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) return false;

    const managedTeam = await prisma.team.findUnique({
      where: { managerId: employee.id },
      select: { id: true },
    });

    if (!managedTeam) return false;

    const target = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { teamId: true },
    });

    return target?.teamId === managedTeam.id;
  }

  return false;
}

/**
 * Determines whether a user may read another employee's leave data.
 * - CEO / HR_HEAD / OPERATIONS_HEAD / MANAGER: any employee
 * - SUB_MANAGER: employees within the team they manage (Team.managerId)
 * - Everyone else: own records only (handled by the caller)
 */
export async function canUserReadEmployeeLeaves(userId: string, userRole: string, targetEmployeeId: string): Promise<boolean> {
  if (LEAVE_READ_ALL_ROLES.includes(userRole)) {
    return true;
  }

  if (userRole === 'SUB_MANAGER') {
    return isEmployeeInManagedTeam(userId, targetEmployeeId);
  }

  return false;
}

async function isEmployeeInManagedTeam(userId: string, targetEmployeeId: string): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!employee) return false;

  const managedTeam = await prisma.team.findUnique({
    where: { managerId: employee.id },
    select: { id: true },
  });

  if (!managedTeam) return false;

  const target = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: { teamId: true },
  });

  return target?.teamId === managedTeam.id;
}