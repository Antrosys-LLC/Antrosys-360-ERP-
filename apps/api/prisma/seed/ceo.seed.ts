import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function seedCeoData() {
  console.log('🏢 Seeding CEO dashboard data...');

  const ceoUser = await prisma.user.findUnique({ where: { email: 'ceo@antrosys.com' } });
  const financeManager = await prisma.user.findUnique({ where: { email: 'finance_manager@antrosys.com' } });
  const hrHead = await prisma.user.findUnique({ where: { email: 'hr_head@antrosys.com' } });

  if (!ceoUser || !financeManager) {
    console.warn('⚠️  Skipping CEO seed — required users not found');
    return;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const periodStart = dateOnly(year, month, 1);
  const periodEnd = dateOnly(year, month, 28);
  const fyStart = dateOnly(year, 1, 1);
  const fyEnd = dateOnly(year, 12, 31);

  const metricTargets = [
    {
      metricKey: 'monthly_revenue_target',
      periodStart,
      periodEnd,
      targetValue: dec(1000000),
      label: 'Monthly revenue target',
    },
    {
      metricKey: 'fy_headcount_plan',
      periodStart: fyStart,
      periodEnd: fyEnd,
      targetValue: dec(300),
      label: 'FY headcount plan',
    },
  ];

  for (const m of metricTargets) {
    await prisma.companyMetricTarget.upsert({
      where: { metricKey_periodStart: { metricKey: m.metricKey, periodStart: m.periodStart } },
      update: {},
      create: {
        metricKey: m.metricKey,
        periodStart: m.periodStart,
        periodEnd: m.periodEnd,
        targetValue: m.targetValue,
        label: m.label,
      },
    });
  }

  const expenseDay = dateOnly(year, month, 10);
  const expenses: {
    category: 'OPERATIONS' | 'SOFTWARE' | 'TAX_LEGAL' | 'BENEFITS' | 'OTHER';
    amount: Prisma.Decimal;
    expenseDate: Date;
    createdByUserId: string;
    description: string;
  }[] = [
    { category: 'OPERATIONS', amount: dec(67000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Facilities & ops' },
    { category: 'SOFTWARE', amount: dec(44000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'SaaS licenses' },
    { category: 'TAX_LEGAL', amount: dec(39000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Tax & legal retainer' },
    { category: 'BENEFITS', amount: dec(29000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Employee benefits' },
    { category: 'OTHER', amount: dec(18000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Misc overhead' },
  ];

  for (const expense of expenses) {
    const existing = await prisma.operatingExpense.findFirst({
      where: { category: expense.category, expenseDate: expense.expenseDate, description: expense.description },
    });
    if (existing) continue;
    await prisma.operatingExpense.create({ data: expense });
  }

  const services: {
    serviceKey: string;
    label: string;
    status: 'OPERATIONAL' | 'DEGRADED';
    notes?: string;
  }[] = [
    { serviceKey: 'api_gateway', label: 'API gateway', status: 'OPERATIONAL' },
    { serviceKey: 'stripe_billing', label: 'Stripe billing', status: 'OPERATIONAL' },
    { serviceKey: 'payroll_engine', label: 'Payroll engine', status: 'OPERATIONAL' },
    { serviceKey: 'auth_sso', label: 'Auth / SSO', status: 'OPERATIONAL' },
    { serviceKey: 'file_storage', label: 'File storage', status: 'DEGRADED', notes: 'Elevated latency in EU region' },
    { serviceKey: 'email_service', label: 'Email service', status: 'OPERATIONAL' },
    { serviceKey: 'audit_logging', label: 'Audit logging', status: 'OPERATIONAL' },
  ];

  for (const service of services) {
    await prisma.systemServiceHealth.upsert({
      where: { serviceKey: service.serviceKey },
      update: {},
      create: {
        serviceKey: service.serviceKey,
        label: service.label,
        status: service.status,
        notes: service.notes ?? null,
      },
    });
  }

  const hrEmployee = hrHead ? await prisma.employee.findUnique({ where: { userId: hrHead.id } }) : null;
  const payroll = await prisma.payroll.findFirst({ where: { status: 'PENDING_APPROVAL' } });

  if (payroll && hrEmployee) {
    const existing = await prisma.approvalTask.findFirst({
      where: { assigneeUserId: ceoUser.id, entityId: payroll.id, status: 'PENDING' },
    });
    if (!existing) {
      await prisma.approvalTask.create({
        data: {
          assigneeUserId: ceoUser.id,
          requesterEmployeeId: hrEmployee.id,
          actionTitle: `CEO override — ${payroll.batchNumber}`,
          priority: 'HIGH',
          entityType: 'PAYROLL',
          entityId: payroll.id,
          dueAt: new Date(),
        },
      });
    }
  }

  const auditLogs = [
    { userId: financeManager.id, action: 'Payroll run initiated', createdAt: new Date(Date.now() - 4 * 60000) },
    { userId: financeManager.id, action: 'Client Nexus Corp — Invoice sent $42K', createdAt: new Date(Date.now() - 3 * 3600000) },
    { userId: ceoUser.id, action: 'Audit log exported for board package', createdAt: new Date(Date.now() - 5 * 3600000) },
    { userId: ceoUser.id, action: 'Override request escalated to CEO', createdAt: new Date(Date.now() - 2 * 3600000) },
  ];

  for (const log of auditLogs) {
    const existing = await prisma.auditLog.findFirst({
      where: { userId: log.userId, action: log.action },
    });
    if (existing) continue;
    await prisma.auditLog.create({ data: log });
  }

  console.log('✅ CEO dashboard seed data created');
}
