import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { CreateKpiBody, ListKpisQuery, UpdateKpiBody } from './kpi.schema';

type MutationAction = 'KPI_CREATE' | 'KPI_UPDATE' | 'KPI_DELETE';

async function writeAuditLog(tx: Prisma.TransactionClient, userId: string, action: MutationAction, metadata: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

export async function listKpis(query: ListKpisQuery) {
  const where: Record<string, unknown> = {};
  if (query.quarter) where.quarter = query.quarter;
  if (query.department && query.department !== 'All Depts') where.department = query.department;

  const kpis = await prisma.kpiCard.findMany({
    where: where as any,
    orderBy: { createdAt: 'asc' },
  });

  let filtered = kpis.map((k) => ({
    id: k.id,
    title: k.title,
    status: k.status,
    value: k.value,
    target: k.target,
    progress: k.progress,
    trendType: k.trendType as 'bar' | 'line',
    trendData: (k.trendData as number[]) || [],
    avatarUrl: k.assigneeUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    period: k.period,
    badgeText: k.badgeText || undefined,
  }));

  if (query.status === 'Off Track') {
    filtered = filtered.filter((k) => k.status === 'off-track');
  }

  return filtered;
}

export async function getKpiSummary() {
  const kpis = await prisma.kpiCard.findMany();
  return {
    total: kpis.length,
    onTrack: kpis.filter((k) => k.status === 'on-track').length,
    atRisk: kpis.filter((k) => k.status === 'at-risk').length,
    offTrack: kpis.filter((k) => k.status === 'off-track').length,
    exceeded: kpis.filter((k) => k.status === 'exceeded').length,
  };
}

export async function createKpi(payload: CreateKpiBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.kpiCard.create({
      data: {
        title: payload.title,
        status: payload.status,
        value: payload.value,
        target: payload.target,
        progress: payload.progress,
        trendType: payload.trendType,
        trendData: payload.trendData,
        category: payload.category ?? null,
        period: payload.period,
        quarter: payload.quarter ?? null,
        department: payload.department ?? null,
        assigneeUrl: payload.assigneeUrl ?? null,
        badgeText: payload.badgeText ?? null,
      },
    });
    await writeAuditLog(tx, userId, 'KPI_CREATE', { kpiId: created.id, title: created.title });
    return created;
  });
}

export async function updateKpi(kpiId: string, payload: UpdateKpiBody, userId: string) {
  const current = await prisma.kpiCard.findUnique({ where: { id: kpiId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.kpiCard.update({
      where: { id: kpiId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.value !== undefined ? { value: payload.value } : {}),
        ...(payload.target !== undefined ? { target: payload.target } : {}),
        ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
        ...(payload.trendType !== undefined ? { trendType: payload.trendType } : {}),
        ...(payload.trendData !== undefined ? { trendData: payload.trendData } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.period !== undefined ? { period: payload.period } : {}),
        ...(payload.quarter !== undefined ? { quarter: payload.quarter } : {}),
        ...(payload.department !== undefined ? { department: payload.department } : {}),
        ...(payload.assigneeUrl !== undefined ? { assigneeUrl: payload.assigneeUrl } : {}),
        ...(payload.badgeText !== undefined ? { badgeText: payload.badgeText } : {}),
      },
    });
    await writeAuditLog(tx, userId, 'KPI_UPDATE', { kpiId, title: updated.title });
    return updated;
  });
}

export async function deleteKpi(kpiId: string, userId: string) {
  const current = await prisma.kpiCard.findUnique({ where: { id: kpiId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    await tx.kpiCard.delete({ where: { id: kpiId } });
    await writeAuditLog(tx, userId, 'KPI_DELETE', { kpiId, title: current.title });
    return current;
  });
}
