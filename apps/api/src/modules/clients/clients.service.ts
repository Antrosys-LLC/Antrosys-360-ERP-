import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateClientBody,
  UpdateClientBody,
  ListClientsQuery,
  CreateStatusBody,
  CreateRenewalBody,
  UpdateRenewalBody,
  CreateActivityBody,
  CreateProjectBody,
  UpdateProjectBody,
  CreateTaskBody,
  UpdateTaskBody,
  ListTimelineQuery,
} from './clients.schema';

// ─── Helpers ───────────────────────────────────────────────────────────────

const clientInclude = {
  _count: { select: { projects: true, tasks: true, invoices: true } },
} satisfies Prisma.ClientInclude;

const recentTimelineTake = 5;

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

async function recalculateClientRevenue(clientId: string) {
  const result = await prisma.clientProject.aggregate({
    where: {
      clientId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
    _sum: { budget: true },
  });

  const annualRevenue = result._sum.budget;
  const monthlyRevenue = annualRevenue ? annualRevenue.div(12) : null;

  await prisma.client.update({
    where: { id: clientId },
    data: { annualRevenue, monthlyRevenue },
  });
}

async function pushTimeline(
  tx: Prisma.TransactionClient,
  clientId: string,
  eventType: string,
  title: string,
  description?: string | null,
  metadata?: Prisma.InputJsonValue,
) {
  await tx.clientTimelineEvent.create({
    data: { clientId, eventType, title, description, metadata },
  });
}

// ─── Client CRUD ───────────────────────────────────────────────────────────

export async function listClients(query: ListClientsQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.pipelineStage) where.pipelineStage = query.pipelineStage;
  if (query.isAtRisk !== undefined) where.isAtRisk = query.isAtRisk;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const [total, clients] = await prisma.$transaction([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        ...clientInclude,
        statuses: { orderBy: { createdAt: 'desc' }, take: 1 },
        renewals: { orderBy: { dueAt: 'desc' }, take: 1 },
        timelineEvents: { orderBy: { eventDate: 'desc' }, take: recentTimelineTake },
      },
    }),
  ]);

  return {
    items: clients,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: {
      ...clientInclude,
      statuses: { orderBy: { createdAt: 'desc' } },
      renewals: { orderBy: { dueAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      projects: { orderBy: { createdAt: 'desc' } },
      tasks: { orderBy: { dueAt: 'asc' } },
      timelineEvents: { orderBy: { eventDate: 'desc' }, take: recentTimelineTake },
      invoices: { orderBy: { invoiceDate: 'desc' }, take: 10 },
    },
  });
}

export async function createClient(payload: CreateClientBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        pipelineStage: payload.pipelineStage as any,
        currencyCode: payload.currencyCode,
        renewalDueAt: payload.renewalDueAt ? new Date(payload.renewalDueAt) : null,
        isAtRisk: payload.isAtRisk,
        isActive: payload.isActive,
      },
    });

    await tx.clientStatus.create({
      data: { clientId: client.id, status: payload.pipelineStage, note: 'Client created' },
    });

    await pushTimeline(tx, client.id, 'CREATED', `Client "${client.name}" created`);
    await writeAuditLog(tx, userId, 'CLIENT_CREATE', { clientId: client.id, name: client.name });

    return tx.client.findUnique({
      where: { id: client.id },
      include: clientInclude,
    });
  });
}

export async function updateClient(clientId: string, payload: UpdateClientBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.client.findUnique({ where: { id: clientId }, select: { id: true, pipelineStage: true, name: true } });
    if (!current) return null;

    const data: Record<string, unknown> = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.pipelineStage !== undefined) data.pipelineStage = payload.pipelineStage;
    if (payload.currencyCode !== undefined) data.currencyCode = payload.currencyCode;
    if (payload.renewalDueAt !== undefined) data.renewalDueAt = payload.renewalDueAt ? new Date(payload.renewalDueAt) : null;
    if (payload.isAtRisk !== undefined) data.isAtRisk = payload.isAtRisk;
    if (payload.isActive !== undefined) data.isActive = payload.isActive;

    const updated = await tx.client.update({ where: { id: clientId }, data });

    if (payload.pipelineStage && payload.pipelineStage !== current.pipelineStage) {
      await tx.clientStatus.create({
        data: { clientId, status: payload.pipelineStage, note: `Stage changed from ${current.pipelineStage}` },
      });
      await pushTimeline(tx, clientId, 'STATUS_CHANGED', `Status changed to ${payload.pipelineStage}`, `From ${current.pipelineStage}`);
    }

    await writeAuditLog(tx, userId, 'CLIENT_UPDATE', { clientId, changes: Object.keys(data) });

    return tx.client.findUnique({ where: { id: clientId }, include: clientInclude });
  });
}

export async function deleteClient(clientId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });
    if (!current) return null;

    await tx.client.delete({ where: { id: clientId } });
    await writeAuditLog(tx, userId, 'CLIENT_DELETE', { clientId, name: current.name });

    return current;
  });
}

// ─── Status ────────────────────────────────────────────────────────────────

export async function listStatuses(clientId: string) {
  return prisma.clientStatus.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Renewal ───────────────────────────────────────────────────────────────

export async function listRenewals(clientId: string) {
  return prisma.clientRenewal.findMany({
    where: { clientId },
    orderBy: { dueAt: 'desc' },
  });
}

export async function createRenewal(clientId: string, payload: CreateRenewalBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const renewal = await tx.clientRenewal.create({
      data: {
        clientId,
        dueAt: new Date(payload.dueAt),
        amount: payload.amount ?? null,
        note: payload.note ?? null,
      },
    });

    await tx.client.update({ where: { id: clientId }, data: { renewalDueAt: new Date(payload.dueAt) } });
    await pushTimeline(tx, clientId, 'RENEWAL_DUE', 'Renewal scheduled', payload.note);
    await writeAuditLog(tx, userId, 'CLIENT_RENEWAL_CREATE', { clientId, renewalId: renewal.id });

    return renewal;
  });
}

export async function updateRenewal(renewalId: string, clientId: string, payload: UpdateRenewalBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (payload.dueAt !== undefined) data.dueAt = new Date(payload.dueAt);
    if (payload.completedAt !== undefined) data.completedAt = payload.completedAt ? new Date(payload.completedAt) : null;
    if (payload.amount !== undefined) data.amount = payload.amount;
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.note !== undefined) data.note = payload.note;

    const updated = await tx.clientRenewal.update({ where: { id: renewalId }, data });
    await writeAuditLog(tx, userId, 'CLIENT_RENEWAL_UPDATE', { clientId, renewalId });

    if (payload.status === 'COMPLETED') {
      await pushTimeline(tx, clientId, 'RENEWAL_COMPLETED', 'Renewal completed', payload.note);
    }

    return updated;
  });
}

// ─── Activity ──────────────────────────────────────────────────────────────

export async function listActivities(clientId: string) {
  return prisma.clientActivity.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function createActivity(clientId: string, payload: CreateActivityBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const activity = await tx.clientActivity.create({
      data: {
        clientId,
        type: payload.type,
        title: payload.title,
        description: payload.description ?? null,
      },
    });

    await pushTimeline(tx, clientId, 'ACTIVITY', payload.title, payload.description, { activityId: activity.id, type: payload.type });
    await writeAuditLog(tx, userId, 'CLIENT_ACTIVITY_CREATE', { clientId, activityId: activity.id });

    return activity;
  });
}

// ─── Project ───────────────────────────────────────────────────────────────

export async function listProjects(clientId: string) {
  return prisma.clientProject.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(clientId: string, payload: CreateProjectBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.clientProject.create({
      data: {
        clientId,
        name: payload.name,
        description: payload.description ?? null,
        status: payload.status,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        budget: payload.budget ?? null,
      },
    });

    await pushTimeline(tx, clientId, 'PROJECT_STARTED', `Project "${payload.name}" started`);
    await writeAuditLog(tx, userId, 'CLIENT_PROJECT_CREATE', { clientId, projectId: project.id });

    return project;
  }).then(async (project) => {
    await recalculateClientRevenue(clientId);
    return project;
  });
}

export async function updateProject(projectId: string, clientId: string, payload: UpdateProjectBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.clientProject.findUnique({ where: { id: projectId }, select: { status: true, name: true } });
    if (!current) return null;

    const data: Record<string, unknown> = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.startDate !== undefined) data.startDate = payload.startDate ? new Date(payload.startDate) : null;
    if (payload.endDate !== undefined) data.endDate = payload.endDate ? new Date(payload.endDate) : null;
    if (payload.budget !== undefined) data.budget = payload.budget;

    const updated = await tx.clientProject.update({ where: { id: projectId }, data });
    await writeAuditLog(tx, userId, 'CLIENT_PROJECT_UPDATE', { clientId, projectId });

    if (payload.status && payload.status !== current.status && payload.status === 'COMPLETED') {
      await pushTimeline(tx, clientId, 'PROJECT_COMPLETED', `Project "${current.name}" completed`);
    }

    return updated;
  }).then(async (result) => {
    if (result) {
      await recalculateClientRevenue(clientId);
    }
    return result;
  });
}

// ─── Task ──────────────────────────────────────────────────────────────────

export async function listTasks(clientId: string) {
  return prisma.clientTask.findMany({
    where: { clientId },
    orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }],
  });
}

export async function createTask(clientId: string, payload: CreateTaskBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.clientTask.create({
      data: {
        clientId,
        title: payload.title,
        description: payload.description ?? null,
        dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
        priority: payload.priority,
        status: payload.status,
      },
    });

    await writeAuditLog(tx, userId, 'CLIENT_TASK_CREATE', { clientId, taskId: task.id });
    return task;
  });
}

export async function updateTask(taskId: string, clientId: string, payload: UpdateTaskBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.clientTask.findUnique({ where: { id: taskId }, select: { status: true, title: true } });
    if (!current) return null;

    const data: Record<string, unknown> = {};
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.dueAt !== undefined) data.dueAt = payload.dueAt ? new Date(payload.dueAt) : null;
    if (payload.completedAt !== undefined) data.completedAt = payload.completedAt ? new Date(payload.completedAt) : null;
    if (payload.priority !== undefined) data.priority = payload.priority;
    if (payload.status !== undefined) data.status = payload.status;

    const updated = await tx.clientTask.update({ where: { id: taskId }, data });

    if (payload.status === 'COMPLETED' && current.status !== 'COMPLETED') {
      await tx.clientTask.update({ where: { id: taskId }, data: { completedAt: new Date() } });
      await pushTimeline(tx, clientId, 'TASK_COMPLETED', `Task "${current.title}" completed`);
    }

    await writeAuditLog(tx, userId, 'CLIENT_TASK_UPDATE', { clientId, taskId });
    return updated;
  });
}

// ─── Timeline ──────────────────────────────────────────────────────────────

export async function listTimeline(clientId: string, query: ListTimelineQuery) {
  return prisma.clientTimelineEvent.findMany({
    where: { clientId },
    orderBy: { eventDate: 'desc' },
    take: query.limit,
  });
}

// ─── Dashboard Summary ─────────────────────────────────────────────────────

export async function getSummary() {
  const [
    totalClients,
    activeClients,
    atRiskClients,
    projectRevenue,
    upcomingRenewals,
    prospectCount,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true, pipelineStage: 'ACTIVE' } }),
    prisma.client.count({ where: { isAtRisk: true } }),
    prisma.clientProject.aggregate({
      where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
      _sum: { budget: true },
    }),
    prisma.client.count({ where: { renewalDueAt: { not: null }, isActive: true } }),
    prisma.client.count({ where: { pipelineStage: { in: ['PROSPECT', 'PROPOSAL', 'NEGOTIATION'] } } }),
  ]);

  const totalAnnualRevenue = projectRevenue._sum.budget;
  const totalMonthlyRevenue = totalAnnualRevenue ? totalAnnualRevenue.div(12) : null;

  return {
    totalClients,
    activeClients,
    atRiskClients,
    totalAnnualRevenue,
    totalMonthlyRevenue,
    upcomingRenewals,
    prospectPipeline: prospectCount,
  };
}
