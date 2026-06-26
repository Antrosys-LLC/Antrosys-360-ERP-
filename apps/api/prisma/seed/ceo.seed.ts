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

  await prisma.operatingExpense.deleteMany();
  await prisma.companyMetricTarget.deleteMany();
  await prisma.systemServiceHealth.deleteMany();

  const existingClients = await prisma.client.findMany();
  if (existingClients.length === 0) {
    await prisma.client.createMany({
      data: [
        { name: 'Nexus Corp', email: 'billing@nexus.com', pipelineStage: 'ACTIVE', monthlyRevenue: dec(42000), annualRevenue: dec(504000), isAtRisk: false },
        { name: 'Apex Holdings', email: 'finance@apex.com', pipelineStage: 'ACTIVE', monthlyRevenue: dec(28000), annualRevenue: dec(336000), isAtRisk: false },
        { name: 'BrightX Corp', email: 'ap@brightx.com', pipelineStage: 'AT_RISK', monthlyRevenue: dec(18000), isAtRisk: true, renewalDueAt: dateOnly(year, month, 28) },
        { name: 'Vanta AI', email: 'ops@vanta.ai', pipelineStage: 'NEGOTIATION', monthlyRevenue: dec(12000) },
        { name: 'Orbit Systems', email: 'hello@orbit.io', pipelineStage: 'PROPOSAL' },
        { name: 'Pulse Labs', email: 'team@pulselabs.com', pipelineStage: 'PROSPECT' },
      ],
    });
  } else {
    const updates = [
      { name: 'Acme Corp', pipelineStage: 'ACTIVE' as const, monthlyRevenue: 35000, annualRevenue: 420000 },
      { name: 'Globex Industries', pipelineStage: 'ACTIVE' as const, monthlyRevenue: 22000, annualRevenue: 264000 },
      { name: 'Initech LLC', pipelineStage: 'AT_RISK' as const, monthlyRevenue: 15000, isAtRisk: true, renewalDueAt: dateOnly(year, month, 25) },
    ];
    for (const u of updates) {
      await prisma.client.updateMany({
        where: { name: u.name },
        data: {
          pipelineStage: u.pipelineStage,
          monthlyRevenue: dec(u.monthlyRevenue),
          annualRevenue: u.annualRevenue ? dec(u.annualRevenue) : undefined,
          isAtRisk: u.isAtRisk ?? false,
          renewalDueAt: u.renewalDueAt,
        },
      });
    }
    await prisma.client.createMany({
      data: [
        { name: 'Nexus Corp', email: 'billing@nexus.com', pipelineStage: 'ACTIVE', monthlyRevenue: dec(42000), annualRevenue: dec(504000) },
        { name: 'Prospect Alpha', pipelineStage: 'PROSPECT' },
        { name: 'Prospect Beta', pipelineStage: 'PROSPECT' },
        { name: 'Deal Gamma', pipelineStage: 'PROPOSAL' },
        { name: 'Deal Delta', pipelineStage: 'NEGOTIATION' },
      ],
      skipDuplicates: true,
    });
  }

  const periodStart = dateOnly(year, month, 1);
  const periodEnd = dateOnly(year, month, 28);
  const fyStart = dateOnly(year, 1, 1);
  const fyEnd = dateOnly(year, 12, 31);

  await prisma.companyMetricTarget.createMany({
    data: [
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
    ],
  });

  const expenseDay = dateOnly(year, month, 10);
  await prisma.operatingExpense.createMany({
    data: [
      { category: 'OPERATIONS', amount: dec(67000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Facilities & ops' },
      { category: 'SOFTWARE', amount: dec(44000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'SaaS licenses' },
      { category: 'TAX_LEGAL', amount: dec(39000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Tax & legal retainer' },
      { category: 'BENEFITS', amount: dec(29000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Employee benefits' },
      { category: 'OTHER', amount: dec(18000), expenseDate: expenseDay, createdByUserId: financeManager.id, description: 'Misc overhead' },
    ],
  });

  await prisma.systemServiceHealth.createMany({
    data: [
      { serviceKey: 'api_gateway', label: 'API gateway', status: 'OPERATIONAL' },
      { serviceKey: 'stripe_billing', label: 'Stripe billing', status: 'OPERATIONAL' },
      { serviceKey: 'payroll_engine', label: 'Payroll engine', status: 'OPERATIONAL' },
      { serviceKey: 'auth_sso', label: 'Auth / SSO', status: 'OPERATIONAL' },
      { serviceKey: 'file_storage', label: 'File storage', status: 'DEGRADED', notes: 'Elevated latency in EU region' },
      { serviceKey: 'email_service', label: 'Email service', status: 'OPERATIONAL' },
      { serviceKey: 'audit_logging', label: 'Audit logging', status: 'OPERATIONAL' },
    ],
  });

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

  await prisma.auditLog.createMany({
    data: [
      { userId: financeManager.id, action: 'Payroll run initiated', createdAt: new Date(Date.now() - 4 * 60000) },
      { userId: financeManager.id, action: 'Client Nexus Corp — Invoice sent $42K', createdAt: new Date(Date.now() - 3 * 3600000) },
      { userId: ceoUser.id, action: 'Audit log exported for board package', createdAt: new Date(Date.now() - 5 * 3600000) },
      { userId: ceoUser.id, action: 'Override request escalated to CEO', createdAt: new Date(Date.now() - 2 * 3600000) },
    ],
  });

  console.log('✅ CEO dashboard seed data created');
}
