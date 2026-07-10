import { prisma } from '../../config/database';

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