import { Department } from '@prisma/client';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import type {
  ListOnboardEmployeesQuery,
  CreateEmployeeBody,
  UpdateEmployeeBody,
  CreateTaskBody,
  UpdateTaskBody,
  CreateTeamBody,
  UpdateTeamBody,
  SendMessageBody,
  CreateMeetingBody,
  UpdateMeetingBody,
} from './onboard.schema';
import type { OnboardingPhase } from '@prisma/client';

// Ordered pipeline phases used to compute progress.
export const PHASE_ORDER: OnboardingPhase[] = [
  'PENDING',
  'DOCUMENTATION',
  'IT_SETUP',
  'HR_ORIENTATION',
  'TEAM_INTRO',
  'COMPLETED',
];

const employeeInclude = {
  user: { select: { email: true, role: true } },
  skills: true,
  teams: {
    include: { team: true },
  },
  tasks: {
    orderBy: { createdAt: 'desc' as const },
    take: 25,
  },
  onboarding: true,
  onboardingMeetings: {
    orderBy: { scheduledAt: 'asc' as const },
  },
};

export async function listOnboardEmployees(query: ListOnboardEmployeesQuery) {
  const where: Record<string, unknown> = {};
  if (query.department) where.department = query.department;
  if (query.status) where.employmentStatus = query.status;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        user: { select: { email: true } },
        teams: { include: { team: true } },
        onboarding: true,
        tasks: { select: { id: true, status: true, phase: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page: query.page, limit: query.limit };
}

export async function getOnboardEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      ...employeeInclude,
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function createEmployee(data: CreateEmployeeBody, userId: string) {
  const { teamIds, email, ...rest } = data;

  // Auto-assign team and manager based on department
  let autoTeamId: string | undefined;
  let autoManagerId: string | undefined;
  if (rest.department) {
    const deptKey = rest.department.trim().toLowerCase().replace(/\s+dept$/i, '');
    const departmentAliases: Record<string, Department> = {
      engineering: 'ENGINEERING',
      operations: 'OPERATIONS',
      sales: 'SALES',
      finance: 'FINANCE',
      hr: 'HR',
      other: 'OTHER',
    };
    const normalizedDept = departmentAliases[deptKey];
    if (normalizedDept) {
      const team = await prisma.team.findFirst({
        where: { department: normalizedDept },
        select: { id: true, managerId: true },
      });
      if (team) {
        autoTeamId = team.id;
        if (team.managerId) autoManagerId = team.managerId;
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const passwordHash = await bcrypt.hash('welcome123', 10);
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employee: {
          create: {
            firstName: rest.firstName,
            lastName: rest.lastName,
            gender: (rest.gender as any) ?? 'OTHER',
            department: (rest.department as any) ?? undefined,
            designation: rest.designation ?? undefined,
            grade: rest.grade ?? undefined,
            employmentStatus: (rest.employmentStatus as any) ?? 'ONBOARDING',
            joiningDate: rest.joiningDate ? new Date(rest.joiningDate) : undefined,
            phone: rest.phone ?? undefined,
            teamId: autoTeamId,
            managerId: autoManagerId,
          },
        },
      },
      include: {
        employee: {
          include: {
            teams: { include: { team: true } },
            onboarding: true,
            user: { select: { email: true, role: true } },
          },
        },
      },
    });

    if (teamIds?.length) {
      await tx.employeeTeam.createMany({
        data: teamIds.map((teamId) => ({
          employeeId: user.employee!.id,
          teamId,
        })),
      });
    }

    const startDate = rest.joiningDate ? new Date(rest.joiningDate) : new Date();
    const targetEndDate = new Date(startDate);
    targetEndDate.setDate(targetEndDate.getDate() + 30);

    await tx.onboardingRecord.create({
      data: {
        employeeId: user.employee!.id,
        status: 'IN_PROGRESS',
        currentPhase: 'PENDING',
        startDate,
        targetEndDate,
        createdByUserId: userId,
      },
    });

    return tx.employee.findUnique({
      where: { id: user.employee!.id },
      include: employeeInclude,
    });
  });
}

export async function updateEmployee(id: string, data: UpdateEmployeeBody) {
  const { teamIds, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };
  if (rest.joiningDate) updateData.joiningDate = new Date(rest.joiningDate);

  // When department is cleared, remove team membership but keep reporting line
  if (rest.department !== undefined && (rest.department === null || rest.department === '')) {
    updateData.teamId = null;
  }

  // Auto-assign team and manager based on department change
  if (rest.department !== undefined && rest.department !== null && rest.department !== '') {
    const deptKey = rest.department.trim().toLowerCase().replace(/\s+dept$/i, '');
    const departmentAliases: Record<string, Department> = {
      engineering: 'ENGINEERING',
      operations: 'OPERATIONS',
      sales: 'SALES',
      finance: 'FINANCE',
      hr: 'HR',
      other: 'OTHER',
    };
    const normalizedDept = departmentAliases[deptKey];
    if (normalizedDept) {
      const team = await prisma.team.findFirst({
        where: { department: normalizedDept },
        select: { id: true, managerId: true },
      });
      if (team) {
        updateData.teamId = team.id;
        if (team.managerId) updateData.managerId = team.managerId;
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id },
      data: updateData,
      include: employeeInclude,
    });

    if (teamIds !== undefined) {
      await tx.employeeTeam.deleteMany({ where: { employeeId: id } });
      if (teamIds.length > 0) {
        await tx.employeeTeam.createMany({
          data: teamIds.map((teamId) => ({ employeeId: id, teamId })),
        });
      }
    }

    return tx.employee.findUnique({
      where: { id },
      include: employeeInclude,
    });
  });
}

export async function deleteEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!employee) return null;

  await prisma.$transaction(async (tx) => {
    await tx.employeeTeam.deleteMany({ where: { employeeId: id } });
    await tx.employeeTask.deleteMany({ where: { employeeId: id } });
    await tx.message.deleteMany({ where: { recipientId: id } });
    await tx.onboardingRecord.deleteMany({ where: { employeeId: id } });
    await tx.employee.delete({ where: { id } });
    await tx.user.delete({ where: { id: employee.userId } });
  });

  return employee;
}

export async function getDashboardStats() {
  const [totalEmployees, activeOnboardings, completedOnboardings, overdueTasks] = await Promise.all([
    prisma.employee.count(),
    prisma.onboardingRecord.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.onboardingRecord.count({ where: { status: 'COMPLETED' } }),
    prisma.employeeTask.count({
      where: {
        status: { not: 'COMPLETED' },
        dueAt: { lt: new Date() },
      },
    }),
  ]);

  const employeesWithTasks = await prisma.employee.findMany({
    where: { tasks: { some: {} } },
    select: {
      _count: { select: { tasks: { where: { status: { not: 'COMPLETED' } } } } },
    },
  });

  const employeesWithOverdueTasks = employeesWithTasks.filter((e) => e._count.tasks > 0).length;

  const totalChecklistItems = await prisma.employeeTask.count();
  const completedChecklistItems = await prisma.employeeTask.count({ where: { status: 'COMPLETED' } });

  const departments = await prisma.employee.groupBy({
    by: ['department'],
    _count: true,
    where: { department: { not: null } },
  });

  const avgCompletion = totalChecklistItems > 0
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

  const completingSoon = await prisma.onboardingRecord.count({
    where: {
      status: 'IN_PROGRESS',
      targetEndDate: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
  });

  const phaseGroups = await prisma.onboardingRecord.groupBy({
    by: ['currentPhase'],
    _count: true,
  });
  const phaseCountMap = new Map(phaseGroups.map((g) => [g.currentPhase, g._count]));
  const phaseDistribution = PHASE_ORDER.map((phase) => ({
    phase,
    count: phaseCountMap.get(phase) ?? 0,
  }));

  return {
    activeOnboardings,
    avgCompletion,
    overdueTasks,
    completingSoon,
    completedOnboardings,
    totalEmployees,
    employeesWithOverdueTasks,
    phaseDistribution,
    departments: departments.map((d) => ({
      department: d.department,
      count: d._count,
    })),
  };
}

export async function getEmployeeTasks(employeeId: string) {
  return prisma.employeeTask.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    include: { assignedBy: { select: { email: true } } },
  });
}

export async function createEmployeeTask(employeeId: string, data: CreateTaskBody, userId: string) {
  return prisma.employeeTask.create({
    data: {
      employeeId,
      title: data.title,
      description: data.description ?? null,
      phase: data.phase ?? null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assignedById: userId,
    },
  });
}

export async function updateTask(taskId: string, data: UpdateTaskBody) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.dueAt !== undefined) {
    updateData.dueAt = data.dueAt ? new Date(data.dueAt) : null;
  }
  // Keep completedAt in sync with status so reopening a task clears it.
  if (data.status !== undefined) {
    updateData.completedAt = data.status === 'COMPLETED' ? new Date() : null;
  }

  return prisma.employeeTask.update({
    where: { id: taskId },
    data: updateData,
  });
}

export async function advancePhase(employeeId: string, currentPhase: OnboardingPhase) {
  const record = await prisma.onboardingRecord.findUnique({ where: { employeeId } });
  if (!record) return null;

  const isCompleted = currentPhase === 'COMPLETED';
  const updated = await prisma.onboardingRecord.update({
    where: { employeeId },
    data: {
      currentPhase,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // When onboarding wraps up, promote the hire to an active employee.
  if (isCompleted) {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { employmentStatus: 'ACTIVE' },
    });
  }

  return updated;
}

// ----- Meetings -----

const meetingInclude = {
  createdBy: { select: { email: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
};

export async function listMeetings(employeeId: string) {
  return prisma.onboardingMeeting.findMany({
    where: { employeeId },
    include: meetingInclude,
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function createMeeting(employeeId: string, data: CreateMeetingBody, userId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return null;

  return prisma.onboardingMeeting.create({
    data: {
      employeeId,
      title: data.title,
      description: data.description ?? null,
      scheduledAt: new Date(data.scheduledAt),
      durationMins: data.durationMins ?? 30,
      location: data.location ?? null,
      phase: data.phase ?? null,
      createdByUserId: userId,
    },
    include: meetingInclude,
  });
}

export async function updateMeeting(meetingId: string, data: UpdateMeetingBody) {
  const existing = await prisma.onboardingMeeting.findUnique({ where: { id: meetingId } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = { ...data };
  if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);

  return prisma.onboardingMeeting.update({
    where: { id: meetingId },
    data: updateData,
    include: meetingInclude,
  });
}

export async function deleteMeeting(meetingId: string) {
  const existing = await prisma.onboardingMeeting.findUnique({ where: { id: meetingId } });
  if (!existing) return null;
  await prisma.onboardingMeeting.delete({ where: { id: meetingId } });
  return existing;
}

// ----- Employee self-service (person being onboarded) -----

export async function getMyOnboarding(userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, role: true } },
      manager: { select: { id: true, firstName: true, lastName: true, designation: true } },
      teams: { include: { team: true } },
      onboarding: true,
      tasks: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      onboardingMeetings: { orderBy: { scheduledAt: 'asc' } },
      receivedMessages: {
        include: { sender: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!employee) return { hasProfile: false, hasOnboarding: false, employee: null };

  return {
    hasProfile: true,
    hasOnboarding: Boolean(employee.onboarding),
    employee,
  };
}

export async function updateMyTask(userId: string, taskId: string, data: UpdateTaskBody) {
  const employee = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!employee) return { forbidden: true as const, task: null };

  const task = await prisma.employeeTask.findUnique({ where: { id: taskId } });
  if (!task || task.employeeId !== employee.id) return { forbidden: true as const, task: null };

  const updateData: Record<string, unknown> = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
    updateData.completedAt = data.status === 'COMPLETED' ? new Date() : null;
  }

  const updated = await prisma.employeeTask.update({ where: { id: taskId }, data: updateData });
  return { forbidden: false as const, task: updated };
}

export async function deleteTask(taskId: string) {
  const task = await prisma.employeeTask.findUnique({ where: { id: taskId } });
  if (!task) return null;
  await prisma.employeeTask.delete({ where: { id: taskId } });
  return task;
}

export async function listTeams() {
  return prisma.team.findMany({
    include: {
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, designation: true, department: true },
          },
        },
      },
    },
  });
}

export async function createTeam(data: CreateTeamBody) {
  return prisma.team.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      department: (data.department as any) ?? null,
    },
    include: {
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
        },
      },
    },
  });
}

export async function updateTeam(id: string, data: UpdateTeamBody) {
  const updateData: Record<string, unknown> = { ...data };

  return prisma.team.update({
    where: { id },
    data: updateData,
    include: {
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
        },
      },
    },
  });
}

export async function deleteTeam(id: string) {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return null;
  await prisma.employeeTeam.deleteMany({ where: { teamId: id } });
  await prisma.team.delete({ where: { id } });
  return team;
}

export async function addTeamMember(teamId: string, employeeId: string) {
  const [team, employee] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.employee.findUnique({ where: { id: employeeId } }),
  ]);
  if (!team || !employee) return null;

  return prisma.employeeTeam.create({
    data: { teamId, employeeId },
    include: {
      team: true,
      employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
    },
  });
}

export async function removeTeamMember(teamId: string, employeeId: string) {
  const member = await prisma.employeeTeam.findUnique({
    where: { employeeId_teamId: { employeeId, teamId } },
  });
  if (!member) return null;
  await prisma.employeeTeam.delete({
    where: { employeeId_teamId: { employeeId, teamId } },
  });
  return member;
}

export async function listMessages(employeeId?: string) {
  const where: Record<string, unknown> = {};
  if (employeeId) where.recipientId = employeeId;

  return prisma.message.findMany({
    where,
    include: {
      sender: { select: { email: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function sendMessage(data: SendMessageBody, senderId: string) {
  return prisma.message.create({
    data: {
      senderId,
      recipientId: data.recipientId,
      subject: data.subject,
      body: data.body,
    },
    include: {
      sender: { select: { email: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
    },
  });
}

export async function markMessageRead(id: string) {
  return prisma.message.update({
    where: { id },
    data: { isRead: true },
  });
}
