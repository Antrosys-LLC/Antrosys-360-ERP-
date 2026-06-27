import { prisma } from '../../config/database';
import type { ListEmployeesQuery, UpdatePersonalBody, UpsertSkillBody } from './employees.schema';

// ============================================================================
// LIST – all employees (grouped by department on the frontend)
// ============================================================================

export async function listEmployees(query: ListEmployeesQuery) {
  const where: Record<string, unknown> = {};
  if (query.department) where.department = query.department;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
        isActive: true,
        user: { select: { email: true } },
      },
      orderBy: [{ department: 'asc' }, { firstName: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page: query.page, limit: query.limit };
}

// ============================================================================
// GET BY ID – full employee profile (hero banner + personal tab)
// ============================================================================

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, role: true, isActive: true },
      },
      manager: {
        select: { id: true, firstName: true, lastName: true },
      },
      skills: {
        orderBy: { createdAt: 'asc' },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  return employee;
}

// ============================================================================
// UPDATE – personal / employment fields
// ============================================================================

export async function updateEmployee(id: string, data: UpdatePersonalBody) {
  // Convert ISO string to Date if dateOfBirth was provided
  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });

  return updated;
}

// ============================================================================
// SKILLS – add / update
// ============================================================================

export async function upsertSkill(employeeId: string, data: UpsertSkillBody) {
  // Check if skill with same name already exists for this employee
  const existing = await prisma.employeeSkill.findFirst({
    where: { employeeId, skillName: data.skillName },
  });

  if (existing) {
    return prisma.employeeSkill.update({
      where: { id: existing.id },
      data: { percentage: data.percentage ?? null },
    });
  }

  return prisma.employeeSkill.create({
    data: {
      employeeId,
      skillName: data.skillName,
      percentage: data.percentage ?? null,
    },
  });
}

// ============================================================================
// SKILLS – delete
// ============================================================================

export async function deleteSkill(employeeId: string, skillId: string) {
  // Verify the skill belongs to this employee before deleting
  const skill = await prisma.employeeSkill.findFirst({
    where: { id: skillId, employeeId },
  });

  if (!skill) return null;

  await prisma.employeeSkill.delete({ where: { id: skillId } });
  return skill;
}
