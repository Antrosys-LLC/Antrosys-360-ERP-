import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import type { ListUsersQuery, CreateUserBody, UpdateUserBody, ListAuditLogsQuery } from './admin.schema';

const userInclude = {
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      department: true,
      designation: true,
    },
  },
};

export async function listUsers(query: ListUsersQuery) {
  const where: Record<string, unknown> = {};
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { employee: { firstName: { contains: query.search, mode: 'insensitive' } } },
      { employee: { lastName: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: query.page, limit: query.limit };
}

export async function getUserStats() {
  const [total, active, suspended, pending, mfaEnabled] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { lastLoginAt: null } }),
    prisma.user.count({ where: { mfaEnabled: true } }),
  ]);

  const mfaAdoption = total > 0 ? Math.round((mfaEnabled / total) * 100) : 0;

  return { total, active, suspended, pending, mfaEnabled, mfaAdoption };
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true, designation: true },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
}

export async function createUser(data: CreateUserBody) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role as any,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function updateUser(id: string, data: UpdateUserBody) {
  const updateData: Record<string, unknown> = {};
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      updatedAt: true,
      employee: {
        select: { id: true, firstName: true, lastName: true, department: true, designation: true },
      },
    },
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, include: { employee: true } });
  if (!user) return null;

  await prisma.$transaction(async (tx) => {
    if (user.employee) {
      await tx.onboardingRecord.deleteMany({ where: { employeeId: user.employee.id } });
      await tx.employeeTask.deleteMany({ where: { employeeId: user.employee.id } });
      await tx.message.deleteMany({ where: { recipientId: user.employee.id } });
      await tx.employeeSkill.deleteMany({ where: { employeeId: user.employee.id } });
      await tx.employee.delete({ where: { id: user.employee.id } });
    }
    await tx.auditLog.deleteMany({ where: { userId: id } });
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  return user;
}

export async function listAuditLogs(query: ListAuditLogsQuery) {
  const where: Record<string, unknown> = {};
  if (query.userId) where.userId = query.userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: query.page, limit: query.limit };
}
