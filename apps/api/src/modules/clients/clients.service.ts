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
  CreateContactBody,
  UpdateContactBody,
} from './clients.schema';

// ─── Helpers ───────────────────────────────────────────────────────────────

function toNumber(val: Prisma.Decimal | number | null | undefined): number | null {
  if (val == null) return null;
  return typeof val === 'number' ? val : Number(val);
}

function serializeProject<T extends Record<string, unknown>>(project: T) {
  return {
    ...project,
    budget: toNumber(project.budget as Prisma.Decimal | null),
  };
}

function serializeClient<T extends Record<string, unknown>>(client: T) {
  const projects = client.projects as Array<Record<string, unknown>> | undefined;
  return {
    ...client,
    monthlyRevenue: toNumber(client.monthlyRevenue as Prisma.Decimal | null),
    annualRevenue: toNumber(client.annualRevenue as Prisma.Decimal | null),
    lifetimeValue: toNumber(client.lifetimeValue as Prisma.Decimal | null),
    ...(projects ? { projects: projects.map(serializeProject) } : {}),
  };
}

const clientInclude = {
  _count: { select: { projects: true, tasks: true, invoices: true, contacts: true } },
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
    items: clients.map(serializeClient),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClientById(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      ...clientInclude,
      contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      statuses: { orderBy: { createdAt: 'desc' } },
      renewals: { orderBy: { dueAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      projects: { orderBy: { createdAt: 'desc' } },
      tasks: { orderBy: { dueAt: 'asc' } },
      timelineEvents: { orderBy: { eventDate: 'desc' }, take: recentTimelineTake },
      invoices: { orderBy: { invoiceDate: 'desc' }, take: 10 },
    },
  });
  return client ? serializeClient(client) : null;
}

export async function createClient(payload: CreateClientBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: payload.name,
        clientCode: payload.clientCode ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        industry: payload.industry ?? null,
        tier: payload.tier ?? null,
        pipelineStage: payload.pipelineStage as Prisma.ClientCreateInput['pipelineStage'],
        salesStage: payload.salesStage as Prisma.ClientCreateInput['salesStage'] ?? null,
        currencyCode: payload.currencyCode,
        renewalDueAt: payload.renewalDueAt ? new Date(payload.renewalDueAt) : null,
        isAtRisk: payload.isAtRisk,
        isActive: payload.isActive,
        healthScore: payload.healthScore ?? 75,
        lifetimeValue: payload.lifetimeValue ?? null,
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
    }).then((c) => (c ? serializeClient(c) : c));
  });
}

export async function updateClient(clientId: string, payload: UpdateClientBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.client.findUnique({ where: { id: clientId }, select: { id: true, pipelineStage: true, name: true } });
    if (!current) return null;

    const data: Record<string, unknown> = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.clientCode !== undefined) data.clientCode = payload.clientCode;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.industry !== undefined) data.industry = payload.industry;
    if (payload.tier !== undefined) data.tier = payload.tier;
    if (payload.pipelineStage !== undefined) data.pipelineStage = payload.pipelineStage;
    if (payload.salesStage !== undefined) data.salesStage = payload.salesStage;
    if (payload.currencyCode !== undefined) data.currencyCode = payload.currencyCode;
    if (payload.renewalDueAt !== undefined) data.renewalDueAt = payload.renewalDueAt ? new Date(payload.renewalDueAt) : null;
    if (payload.isAtRisk !== undefined) data.isAtRisk = payload.isAtRisk;
    if (payload.isActive !== undefined) data.isActive = payload.isActive;
    if (payload.healthScore !== undefined) data.healthScore = payload.healthScore;
    if (payload.lifetimeValue !== undefined) data.lifetimeValue = payload.lifetimeValue;

    const updated = await tx.client.update({ where: { id: clientId }, data });

    if (payload.pipelineStage && payload.pipelineStage !== current.pipelineStage) {
      await tx.clientStatus.create({
        data: { clientId, status: payload.pipelineStage, note: `Stage changed from ${current.pipelineStage}` },
      });
      await pushTimeline(tx, clientId, 'STATUS_CHANGED', `Status changed to ${payload.pipelineStage}`, `From ${current.pipelineStage}`);
    }

    await writeAuditLog(tx, userId, 'CLIENT_UPDATE', { clientId, changes: Object.keys(data) });

    return tx.client.findUnique({ where: { id: clientId }, include: clientInclude }).then((c) => (c ? serializeClient(c) : c));
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
  const projects = await prisma.clientProject.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
  return projects.map(serializeProject);
}

export async function createProject(clientId: string, payload: CreateProjectBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.clientProject.create({
      data: {
        clientId,
        name: payload.name,
        description: payload.description ?? null,
        status: payload.status,
        priority: payload.priority,
        projectManager: payload.projectManager ?? null,
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
    return serializeProject(project);
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
    if (payload.priority !== undefined) data.priority = payload.priority;
    if (payload.projectManager !== undefined) data.projectManager = payload.projectManager;
    if (payload.startDate !== undefined) data.startDate = payload.startDate ? new Date(payload.startDate) : null;
    if (payload.endDate !== undefined) data.endDate = payload.endDate ? new Date(payload.endDate) : null;
    if (payload.budget !== undefined) data.budget = payload.budget;

    const updated = await tx.clientProject.update({ where: { id: projectId }, data });
    await writeAuditLog(tx, userId, 'CLIENT_PROJECT_UPDATE', { clientId, projectId });

    if (payload.status && payload.status !== current.status) {
      const isCompleted = payload.status === 'COMPLETED';
      await pushTimeline(
        tx,
        clientId,
        isCompleted ? 'PROJECT_COMPLETED' : 'STATUS',
        isCompleted
          ? `Project "${current.name}" completed`
          : `Project "${current.name}" moved to ${payload.status}`,
        `Status changed from ${current.status} to ${payload.status}`,
      );
    }

    return updated;
  }).then(async (result) => {
    if (result) {
      await recalculateClientRevenue(clientId);
    }
    return result ? serializeProject(result) : result;
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
    revenueAgg,
    upcomingRenewals,
    prospectCount,
    activeCount,
    prospectStageCount,
    atRiskStageCount,
    atRiskClientList,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true } }),
    prisma.client.count({ where: { isAtRisk: true } }),
    prisma.client.aggregate({
      where: { isActive: true },
      _sum: { annualRevenue: true, monthlyRevenue: true },
    }),
    prisma.client.count({
      where: {
        renewalDueAt: { not: null, gte: new Date() },
        isActive: true,
      },
    }),
    prisma.client.count({ where: { pipelineStage: { in: ['PROSPECT', 'PROPOSAL', 'NEGOTIATION'] } } }),
    prisma.client.count({ where: { pipelineStage: 'ACTIVE', isActive: true } }),
    prisma.client.count({ where: { pipelineStage: { in: ['PROSPECT', 'PROPOSAL', 'NEGOTIATION'] } } }),
    prisma.client.count({ where: { OR: [{ pipelineStage: 'AT_RISK' }, { isAtRisk: true }] } }),
    prisma.client.findMany({
      where: { isAtRisk: true, renewalDueAt: { not: null } },
      select: { name: true },
      orderBy: { renewalDueAt: 'asc' },
      take: 5,
    }),
  ]);

  const total = totalClients || 1;
  const lifecycleDistribution = {
    active: Math.round((activeCount / total) * 100),
    prospect: Math.round((prospectStageCount / total) * 100),
    atRisk: Math.round((atRiskStageCount / total) * 100),
  };

  const distSum = lifecycleDistribution.active + lifecycleDistribution.prospect + lifecycleDistribution.atRisk;
  if (distSum !== 100 && distSum > 0) {
    lifecycleDistribution.active += 100 - distSum;
  }

  return {
    totalClients,
    activeClients,
    atRiskClients,
    totalAnnualRevenue: toNumber(revenueAgg._sum.annualRevenue),
    totalMonthlyRevenue: toNumber(revenueAgg._sum.monthlyRevenue),
    upcomingRenewals,
    prospectPipeline: prospectCount,
    lifecycleDistribution,
    atRiskClientNames: atRiskClientList.map((c) => c.name),
  };
}

// ─── Sales Pipeline ────────────────────────────────────────────────────────

const SALES_STAGES = ['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON'] as const;

export async function getSalesPipeline() {
  const clients = await prisma.client.findMany({
    where: { salesStage: { not: null } },
    select: {
      id: true,
      name: true,
      salesStage: true,
      annualRevenue: true,
      currencyCode: true,
    },
    orderBy: { name: 'asc' },
  });

  const pipeline: Record<string, { id: string; name: string; annualRevenue: number | null; currencyCode: string }[]> = {};
  for (const stage of SALES_STAGES) {
    pipeline[stage] = [];
  }

  for (const client of clients) {
    if (client.salesStage && pipeline[client.salesStage]) {
      pipeline[client.salesStage].push({
        id: client.id,
        name: client.name,
        annualRevenue: toNumber(client.annualRevenue),
        currencyCode: client.currencyCode,
      });
    }
  }

  return pipeline;
}

export async function updateClientSalesStage(clientId: string, salesStage: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id: clientId },
      data: { salesStage: salesStage as Prisma.ClientUpdateInput['salesStage'] },
    });
    await pushTimeline(tx, clientId, 'STATUS_CHANGED', `Moved to ${salesStage.replace(/_/g, ' ')}`);
    await writeAuditLog(tx, userId, 'CLIENT_SALES_STAGE_UPDATE', { clientId, salesStage });
    return serializeClient(updated);
  });
}

// ─── Global Timeline ───────────────────────────────────────────────────────

export async function getRecentTimeline(limit = 10) {
  const events = await prisma.clientTimelineEvent.findMany({
    orderBy: { eventDate: 'desc' },
    take: limit,
    include: { client: { select: { name: true } } },
  });

  return events.map((e) => ({
    id: e.id,
    clientId: e.clientId,
    clientName: e.client.name,
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate.toISOString(),
  }));
}

// ─── Upcoming Tasks ────────────────────────────────────────────────────────

export async function getUpcomingTasks(limit = 10) {
  const tasks = await prisma.clientTask.findMany({
    where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
    take: limit,
    include: { client: { select: { name: true } } },
  });

  return tasks.map((t) => ({
    id: t.id,
    clientId: t.clientId,
    clientName: t.client.name,
    title: t.title,
    priority: t.priority,
    status: t.status,
    dueAt: t.dueAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
  }));
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function getAlerts() {
  const atRisk = await prisma.client.findMany({
    where: {
      isAtRisk: true,
      renewalDueAt: { not: null },
      healthScore: { lt: 50 },
    },
    select: { name: true, healthScore: true, renewalDueAt: true },
    orderBy: { renewalDueAt: 'asc' },
  });

  return {
    message: atRisk.length > 0
      ? `${atRisk.map((c) => c.name).join(' and ')} have renewals coming up with low health scores. Immediate outreach recommended.`
      : null,
    clients: atRisk,
  };
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export async function exportClients() {
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  const headers = ['clientCode', 'name', 'email', 'phone', 'industry', 'tier', 'pipelineStage', 'annualRevenue', 'healthScore', 'isAtRisk', 'isActive'];
  const rows = clients.map((c) => [
    c.clientCode ?? '',
    c.name,
    c.email ?? '',
    c.phone ?? '',
    c.industry ?? '',
    c.tier ?? '',
    c.pipelineStage,
    toNumber(c.annualRevenue)?.toString() ?? '',
    c.healthScore.toString(),
    c.isAtRisk ? 'true' : 'false',
    c.isActive ? 'true' : 'false',
  ]);
  return [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
}

export async function importClients(csv: string, userId: string) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { imported: 0 };

  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

    if (!row.name) continue;

    await prisma.client.create({
      data: {
        name: row.name,
        clientCode: row.clientCode || null,
        email: row.email || null,
        phone: row.phone || null,
        industry: row.industry || null,
        tier: row.tier || null,
        pipelineStage: (row.pipelineStage as Prisma.ClientCreateInput['pipelineStage']) || 'PROSPECT',
        annualRevenue: row.annualRevenue ? parseFloat(row.annualRevenue) : null,
        healthScore: row.healthScore ? parseInt(row.healthScore, 10) : 75,
        isAtRisk: row.isAtRisk === 'true',
        isActive: row.isActive !== 'false',
        currencyCode: 'PKR',
      },
    });
    imported++;
  }

  await prisma.auditLog.create({
    data: { userId, action: 'CLIENT_IMPORT', metadata: { imported } },
  });
  return { imported };
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function listContacts(clientId: string) {
  return prisma.clientContact.findMany({
    where: { clientId },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  });
}

export async function createContact(clientId: string, payload: CreateContactBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    if (payload.isPrimary) {
      await tx.clientContact.updateMany({ where: { clientId }, data: { isPrimary: false } });
    }
    const contact = await tx.clientContact.create({
      data: {
        clientId,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        role: payload.role ?? null,
        isPrimary: payload.isPrimary,
      },
    });
    await writeAuditLog(tx, userId, 'CLIENT_CONTACT_CREATE', { clientId, contactId: contact.id });
    return contact;
  });
}

export async function updateContact(contactId: string, clientId: string, payload: UpdateContactBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    if (payload.isPrimary) {
      await tx.clientContact.updateMany({ where: { clientId }, data: { isPrimary: false } });
    }
    const data: Record<string, unknown> = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.role !== undefined) data.role = payload.role;
    if (payload.isPrimary !== undefined) data.isPrimary = payload.isPrimary;

    const updated = await tx.clientContact.update({ where: { id: contactId }, data });
    await writeAuditLog(tx, userId, 'CLIENT_CONTACT_UPDATE', { clientId, contactId });
    return updated;
  });
}

export async function deleteContact(contactId: string, clientId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.clientContact.delete({ where: { id: contactId } });
    await writeAuditLog(tx, userId, 'CLIENT_CONTACT_DELETE', { clientId, contactId });
    return deleted;
  });
}
