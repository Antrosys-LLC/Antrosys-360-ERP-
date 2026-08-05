import { Department, Kpi, KpiStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateKpiBody,
  KpiQueryFilters,
  ListKpisQuery,
  UpdateKpiBody,
} from './kpi.schema';

const ownerInclude = {
  owner: {
    select: { id: true, firstName: true, lastName: true, designation: true },
  },
} satisfies Prisma.KpiInclude;

type KpiWithOwner = Prisma.KpiGetPayload<{ include: typeof ownerInclude }>;

function ownerName(owner: KpiWithOwner['owner']): string | null {
  if (!owner) return null;
  return `${owner.firstName} ${owner.lastName}`.trim() || null;
}

function initials(owner: KpiWithOwner['owner']): string {
  if (!owner) return '';
  return ((owner.firstName?.[0] ?? '') + (owner.lastName?.[0] ?? '')).toUpperCase();
}

export function serializeKpi(kpi: KpiWithOwner) {
  return {
    id: kpi.id,
    name: kpi.name,
    description: kpi.description,
    department: kpi.department,
    unit: kpi.unit,
    targetValue: kpi.targetValue == null ? null : Number(kpi.targetValue),
    currentValue: kpi.currentValue == null ? null : Number(kpi.currentValue),
    progress: kpi.progress,
    status: kpi.status,
    trend: Array.isArray(kpi.trend) ? (kpi.trend as number[]) : [],
    quarter: kpi.quarter,
    year: kpi.year,
    owner: kpi.owner
      ? {
          id: kpi.owner.id,
          name: ownerName(kpi.owner),
          initials: initials(kpi.owner),
          designation: kpi.owner.designation,
        }
      : null,
    createdAt: kpi.createdAt,
    updatedAt: kpi.updatedAt,
  };
}

export function buildKpiWhere(filters: KpiQueryFilters): Prisma.KpiWhereInput {
  const where: Prisma.KpiWhereInput = { isActive: true };

  if (filters.department) where.department = filters.department as Department;
  if (filters.quarter) where.quarter = filters.quarter;
  if (filters.year) where.year = filters.year;
  if (filters.status) where.status = filters.status as KpiStatus;
  if (filters.search) {
    where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
  }

  return where;
}

// ============================================================================
// READ
// ============================================================================

export async function listKpis(query: ListKpisQuery) {
  const where = buildKpiWhere(query);

  const [total, items] = await Promise.all([
    prisma.kpi.count({ where }),
    prisma.kpi.findMany({
      where,
      include: ownerInclude,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: items.map(serializeKpi),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
  };
}

export async function getKpiById(id: string) {
  const kpi = await prisma.kpi.findFirst({
    where: { id, isActive: true },
    include: ownerInclude,
  });
  return kpi ? serializeKpi(kpi) : null;
}

export async function listKpiOwners() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, department: true, designation: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  return employees.map((emp) => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    initials: `${(emp.firstName?.[0] ?? '')}${(emp.lastName?.[0] ?? '')}`.toUpperCase(),
    department: emp.department,
    designation: emp.designation,
  }));
}

export async function getKpiOverview(filters: KpiQueryFilters = {}) {
  const where = buildKpiWhere(filters);

  const [total, groups, avg] = await Promise.all([
    prisma.kpi.count({ where }),
    prisma.kpi.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
    prisma.kpi.aggregate({ where, _avg: { progress: true } }),
  ]);

  const byStatus = new Map(groups.map((g) => [g.status, g._count._all]));
  const onTrack = byStatus.get('ON_TRACK') ?? 0;
  const atRisk = byStatus.get('AT_RISK') ?? 0;
  const offTrack = byStatus.get('OFF_TRACK') ?? 0;
  const exceeded = byStatus.get('EXCEEDED') ?? 0;
  const avgProgress = Math.round(avg._avg.progress ?? 0);

  return {
    total,
    onTrack,
    atRisk,
    offTrack,
    exceeded,
    avgProgress,
    onTrackPct: total > 0 ? Math.round(((onTrack + exceeded) / total) * 100) : 0,
  };
}

export async function getDepartmentAggregates(filters: KpiQueryFilters = {}) {
  const where = buildKpiWhere(filters);
  const groups = await prisma.kpi.groupBy({
    by: ['department'],
    where,
    _count: { _all: true },
    _avg: { progress: true },
  });

  return groups.map((g) => {
    const avgProgress = Math.round(g._avg.progress ?? 0);
    return {
      department: g.department,
      count: g._count._all,
      avgProgress,
      status: classifyStatus(avgProgress),
    };
  });
}

function classifyStatus(avgProgress: number): KpiStatus {
  if (avgProgress >= 100) return 'EXCEEDED';
  if (avgProgress >= 80) return 'ON_TRACK';
  if (avgProgress >= 60) return 'AT_RISK';
  return 'OFF_TRACK';
}

// ============================================================================
// WRITE
// ============================================================================

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

export async function createKpi(userId: string, body: CreateKpiBody) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.kpi.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        department: (body.department as Department) ?? null,
        ownerEmployeeId: body.ownerEmployeeId ?? null,
        unit: body.unit ?? null,
        targetValue: body.targetValue == null ? null : new Prisma.Decimal(body.targetValue),
        currentValue: body.currentValue == null ? null : new Prisma.Decimal(body.currentValue),
        progress: body.progress ?? deriveProgress(body),
        status: (body.status as KpiStatus) ?? deriveStatus(body.progress ?? deriveProgress(body)),
        trend: (body.trend ?? []) as Prisma.InputJsonValue,
        quarter: body.quarter ?? null,
        year: body.year ?? new Date().getUTCFullYear(),
        createdById: userId,
      },
      include: ownerInclude,
    });

    await writeAuditLog(tx, userId, 'KPI_CREATE', {
      kpiId: created.id,
      name: created.name,
      department: created.department,
      quarter: created.quarter,
      year: created.year,
    });

    return serializeKpi(created);
  });
}

export async function updateKpi(userId: string, id: string, body: UpdateKpiBody) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.kpi.findFirst({ where: { id, isActive: true } });
    if (!existing) return null;

    const data: Prisma.KpiUncheckedUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.department !== undefined) data.department = body.department as Department;
    if (body.ownerEmployeeId !== undefined) data.ownerEmployeeId = body.ownerEmployeeId;
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.targetValue !== undefined) {
      data.targetValue = body.targetValue == null ? null : new Prisma.Decimal(body.targetValue);
    }
    if (body.currentValue !== undefined) {
      data.currentValue = body.currentValue == null ? null : new Prisma.Decimal(body.currentValue);
    }
    if (body.progress !== undefined) data.progress = body.progress;
    if (body.status !== undefined) data.status = body.status as KpiStatus;
    if (body.trend !== undefined) data.trend = body.trend as Prisma.InputJsonValue;
    if (body.quarter !== undefined) data.quarter = body.quarter;
    if (body.year !== undefined) data.year = body.year;

    const updated = await tx.kpi.update({ where: { id }, data, include: ownerInclude });

    await writeAuditLog(tx, userId, 'KPI_UPDATE', {
      kpiId: id,
      name: updated.name,
      changes: Object.keys(body),
    });

    return serializeKpi(updated);
  });
}

export async function deleteKpi(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.kpi.findFirst({ where: { id, isActive: true } });
    if (!existing) return null;

    await tx.kpi.update({ where: { id }, data: { isActive: false } });

    await writeAuditLog(tx, userId, 'KPI_DELETE', {
      kpiId: id,
      name: existing.name,
      department: existing.department,
    });

    return { deleted: true, id };
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export async function exportKpisCsv(filters: KpiQueryFilters = {}) {
  const where = buildKpiWhere(filters);
  const items = await prisma.kpi.findMany({
    where,
    include: ownerInclude,
    orderBy: [{ department: 'asc' }, { createdAt: 'desc' }],
  });

  const now = new Date();
  const dateIso = now.toISOString().slice(0, 10);

  const rows: string[][] = [
    ['ANTROSYS 360 ERP — KPI TRACKER EXPORT'],
    ['Generated', dateIso],
    ['Total KPIs', String(items.length)],
    [],
    ['Name', 'Description', 'Department', 'Unit', 'Current', 'Target', 'Progress (%)', 'Status', 'Quarter', 'Year', 'Owner'],
    ...items.map((kpi) => [
      kpi.name,
      kpi.description ?? '',
      kpi.department ?? '',
      kpi.unit ?? '',
      kpi.currentValue != null ? String(Number(kpi.currentValue)) : '',
      kpi.targetValue != null ? String(Number(kpi.targetValue)) : '',
      String(kpi.progress),
      kpi.status,
      kpi.quarter ?? '',
      kpi.year != null ? String(kpi.year) : '',
      ownerName(kpi.owner) ?? '',
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '');
          return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    )
    .join('\r\n');

  return {
    csv,
    filename: `kpi-tracker-${dateIso}.csv`,
  };
}

function deriveProgress(body: CreateKpiBody): number {
  if (body.targetValue != null && body.currentValue != null && body.targetValue > 0) {
    return Math.min(100, Math.round((body.currentValue / body.targetValue) * 100));
  }
  return 0;
}

function deriveStatus(progress: number): KpiStatus {
  if (progress >= 100) return 'EXCEEDED';
  if (progress >= 80) return 'ON_TRACK';
  if (progress >= 60) return 'AT_RISK';
  return 'OFF_TRACK';
}
