import { Department } from '@prisma/client';
import { prisma } from '../../config/database';

const DEPARTMENT_ALIASES: Record<string, Department> = {
  engineering: 'ENGINEERING',
  operations: 'OPERATIONS',
  sales: 'SALES',
  finance: 'FINANCE',
  hr: 'HR',
  other: 'OTHER',
  unassigned: 'OTHER',
};

export function normalizeDepartment(value: string): Department | undefined {
  const key = value.trim().toLowerCase().replace(/\s+dept$/i, '');
  if (DEPARTMENT_ALIASES[key]) return DEPARTMENT_ALIASES[key];
  const upper = value.trim().toUpperCase().replace(/\s+/g, '_');
  if (upper in DEPARTMENT_ALIASES) return DEPARTMENT_ALIASES[upper.toLowerCase()];
  return Object.values(Department).find((d) => d === upper) as Department | undefined;
}

export async function resolveDepartmentTeam(department: Department) {
  return prisma.team.findFirst({
    where: { department },
    select: { id: true, managerId: true },
  });
}
