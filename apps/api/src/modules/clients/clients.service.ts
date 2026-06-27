import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { CreateClientBody, ListClientsQuery, UpdateClientBody, CreateTaskBody, UpdateTaskBody } from './clients.schema';

type MutationAction = 'CLIENT_CREATE' | 'CLIENT_UPDATE' | 'CLIENT_DELETE' | 'CLIENT_TASK_CREATE' | 'CLIENT_TASK_UPDATE' | 'CLIENT_TASK_DELETE';

async function writeAuditLog(tx: Prisma.TransactionClient, userId: string, action: MutationAction, metadata: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

function computeInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function computeColor(name: string): string {
  const colors = [
    'bg-primary text-primary-foreground',
    'bg-blue-500 text-white',
    'bg-rose-500 text-white',
    'bg-orange-500 text-white',
    'bg-emerald-500 text-white',
    'bg-violet-500 text-white',
    'bg-amber-500 text-white',
    'bg-cyan-500 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function computeMetrics(healthScore: number) {
  const jitter = () => Math.max(0, Math.min(100, healthScore + Math.floor(Math.random() * 21) - 10));
  return [
    { name: 'Product Usage', value: jitter() },
    { name: 'Support Tickets', value: jitter() },
    { name: 'Payment History', value: Math.min(100, healthScore + 10) },
    { name: 'Engagement', value: jitter() },
    { name: 'NPS', value: jitter() },
  ];
}

function daysRemainingText(renewalDueAt: Date | null | undefined): string {
  if (!renewalDueAt) return 'N/A';
  const diff = renewalDueAt.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return 'Overdue';
  if (days <= 7) return 'Urgent';
  if (days <= 14) return 'Critical';
  return `${days} days`;
}

function formatCurrency(amount: number | string | null | undefined, currencyCode: string = 'PKR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (num >= 1_000_000_000) return `${currencyCode} ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${currencyCode} ${(num / 1_000_000).toFixed(0)}M`;
  if (num >= 1_000) return `${currencyCode} ${(num / 1_000).toFixed(1)}K`;
  return `${currencyCode} ${num.toFixed(0)}`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function listClients(query: ListClientsQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status === 'At Risk') where.isAtRisk = true;
  if (query.status === 'Active') where.isAtRisk = false;

  const [total, clients] = await prisma.$transaction([
    prisma.client.count({ where: where as any }),
    prisma.client.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
    }),
  ]);

  const items = clients.map((c) => {
    const health = c.profile?.healthScore ?? 100;
    const arr = c.annualRevenue ? Number(c.annualRevenue) : (c.monthlyRevenue ? Number(c.monthlyRevenue) * 12 : 0);
    const mrr = c.monthlyRevenue ? Number(c.monthlyRevenue) : 0;
    const ltv = c.profile?.ltv ? Number(c.profile.ltv) : arr * 3.5;
    return {
      id: c.id,
      name: c.name,
      sector: c.profile?.sector ?? 'General',
      arr: formatCurrency(arr, c.currencyCode),
      mrr: formatCurrency(mrr, c.currencyCode),
      ltv: formatCurrency(ltv, c.currencyCode),
      health,
      renewalDate: formatDate(c.renewalDueAt),
      daysRemaining: daysRemainingText(c.renewalDueAt),
      status: c.isAtRisk ? 'At Risk' : 'Active',
      tier: c.profile?.tier ?? 'Mid-Market',
      initials: computeInitials(c.name),
      color: computeColor(c.name),
      hasWarning: c.isAtRisk,
      metrics: computeMetrics(health),
    };
  });

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClientById(clientId: string) {
  const c = await prisma.client.findUnique({
    where: { id: clientId },
    include: { profile: true, timelineEvents: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!c) return null;

  const health = c.profile?.healthScore ?? 100;
  const arr = c.annualRevenue ? Number(c.annualRevenue) : (c.monthlyRevenue ? Number(c.monthlyRevenue) * 12 : 0);
  const mrr = c.monthlyRevenue ? Number(c.monthlyRevenue) : 0;
  const ltv = c.profile?.ltv ? Number(c.profile.ltv) : arr * 3.5;

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    sector: c.profile?.sector ?? 'General',
    arr: formatCurrency(arr, c.currencyCode),
    mrr: formatCurrency(mrr, c.currencyCode),
    ltv: formatCurrency(ltv, c.currencyCode),
    health,
    renewalDate: formatDate(c.renewalDueAt),
    daysRemaining: daysRemainingText(c.renewalDueAt),
    status: c.isAtRisk ? 'At Risk' : 'Active',
    tier: c.profile?.tier ?? 'Mid-Market',
    pipelineStage: c.pipelineStage,
    initials: computeInitials(c.name),
    color: computeColor(c.name),
    hasWarning: c.isAtRisk,
    metrics: computeMetrics(health),
    timelineEvents: c.timelineEvents,
  };
}

export async function createClient(payload: CreateClientBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        monthlyRevenue: payload.monthlyRevenue ? new Prisma.Decimal(payload.monthlyRevenue) : null,
        annualRevenue: payload.annualRevenue ? new Prisma.Decimal(payload.annualRevenue) : null,
        currencyCode: payload.currencyCode,
        renewalDueAt: payload.renewalDueAt ?? null,
        profile: {
          create: {
            sector: payload.sector ?? null,
            tier: payload.tier,
          },
        },
      },
      include: { profile: true },
    });

    await writeAuditLog(tx, userId, 'CLIENT_CREATE', { clientId: created.id, name: created.name });

    return {
      id: created.id,
      name: created.name,
      initials: computeInitials(created.name),
      color: computeColor(created.name),
    };
  });
}

export async function updateClient(clientId: string, payload: UpdateClientBody, userId: string) {
  const current = await prisma.client.findUnique({ where: { id: clientId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id: clientId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.email !== undefined ? { email: payload.email } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.monthlyRevenue !== undefined ? { monthlyRevenue: new Prisma.Decimal(payload.monthlyRevenue) } : {}),
        ...(payload.annualRevenue !== undefined ? { annualRevenue: new Prisma.Decimal(payload.annualRevenue) } : {}),
        ...(payload.currencyCode !== undefined ? { currencyCode: payload.currencyCode } : {}),
        ...(payload.renewalDueAt !== undefined ? { renewalDueAt: payload.renewalDueAt } : {}),
        ...(payload.isAtRisk !== undefined ? { isAtRisk: payload.isAtRisk } : {}),
        ...(payload.pipelineStage !== undefined ? { pipelineStage: payload.pipelineStage } : {}),
      },
      include: { profile: true },
    });

    if (payload.sector !== undefined || payload.tier !== undefined) {
      await tx.clientProfile.upsert({
        where: { clientId },
        create: { clientId, sector: payload.sector ?? null, tier: payload.tier ?? 'Mid-Market' },
        update: { sector: payload.sector, tier: payload.tier },
      });
    }

    await writeAuditLog(tx, userId, 'CLIENT_UPDATE', { clientId, name: updated.name });
    return updated;
  });
}

export async function deleteClient(clientId: string, userId: string) {
  const current = await prisma.client.findUnique({ where: { id: clientId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    await tx.client.update({ where: { id: clientId }, data: { isActive: false } });
    await writeAuditLog(tx, userId, 'CLIENT_DELETE', { clientId, name: current.name });
    return current;
  });
}

export async function getClientSummary() {
  const [activeClients, atRisk, renewalPipeline, prospectPipeline, clients] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.client.count({ where: { isAtRisk: true, isActive: true } }),
    prisma.client.count({ where: { isActive: true, renewalDueAt: { gte: new Date() } } }),
    prisma.client.count({ where: { isActive: true, pipelineStage: 'PROSPECT' } }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { monthlyRevenue: true, annualRevenue: true, currencyCode: true },
    }),
  ]);

  let totalArr = 0;
  let totalMrr = 0;
  for (const c of clients) {
    if (c.annualRevenue) totalArr += Number(c.annualRevenue);
    else if (c.monthlyRevenue) totalArr += Number(c.monthlyRevenue) * 12;
    if (c.monthlyRevenue) totalMrr += Number(c.monthlyRevenue);
  }

  return {
    totalArr: formatCurrency(totalArr, 'PKR'),
    mrr: formatCurrency(totalMrr, 'PKR'),
    activeClients,
    atRisk,
    renewalPipeline,
    prospectPipeline,
    summaryAsOf: `${activeClients} active clients - ${formatCurrency(totalArr, 'PKR')} ARR - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
  };
}

export async function getClientPipeline() {
  const stageMap: Record<string, string> = {
    PROSPECT: 'Prospect',
    PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation',
    ACTIVE: 'Active',
    AT_RISK: 'At Risk',
  };

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { name: true, monthlyRevenue: true, pipelineStage: true },
  });

  const grouped: Record<string, { name: string; size: string }[]> = {};
  for (const c of clients) {
    const displayStage = stageMap[c.pipelineStage] || c.pipelineStage;
    if (!grouped[displayStage]) grouped[displayStage] = [];
    if (grouped[displayStage].length < 10) {
      grouped[displayStage].push({
        name: c.name,
        size: formatCurrency(c.monthlyRevenue ? Number(c.monthlyRevenue) * 10 : 0, 'PKR'),
      });
    }
  }

  const result = Object.values(stageMap).map((stage) => ({
    stage,
    deals: grouped[stage] || [],
  }));

  result.push({
    stage: 'Closed/Won',
    deals: [],
  });

  return result;
}

export async function getClientTimeline(clientId: string) {
  const events = await prisma.clientTimelineEvent.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return events.map((e) => ({
    id: e.id,
    text: e.text,
    time: formatRelativeTime(e.createdAt),
  }));
}

export async function createTimelineEvent(clientId: string, text: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.clientTimelineEvent.create({
      data: { clientId, text },
    });
    return event;
  });
}

export async function getClientTasks(clientId: string) {
  return prisma.clientTask.findMany({
    where: { clientId },
    orderBy: [{ urgent: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function createClientTask(clientId: string, payload: CreateTaskBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.clientTask.create({
      data: {
        clientId,
        text: payload.text,
        date: payload.date ?? null,
        urgent: payload.urgent,
      },
    });
    await writeAuditLog(tx, userId, 'CLIENT_TASK_CREATE', { clientId, taskId: task.id });
    return task;
  });
}

export async function updateClientTask(taskId: string, payload: UpdateTaskBody, userId: string) {
  const current = await prisma.clientTask.findUnique({ where: { id: taskId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.clientTask.update({
      where: { id: taskId },
      data: {
        ...(payload.done !== undefined ? { done: payload.done } : {}),
        ...(payload.text !== undefined ? { text: payload.text } : {}),
        ...(payload.date !== undefined ? { date: payload.date } : {}),
        ...(payload.urgent !== undefined ? { urgent: payload.urgent } : {}),
      },
    });
    await writeAuditLog(tx, userId, 'CLIENT_TASK_UPDATE', { taskId, clientId: current.clientId });
    return updated;
  });
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
