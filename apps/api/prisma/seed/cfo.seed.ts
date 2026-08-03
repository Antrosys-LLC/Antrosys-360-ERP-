import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function seedCfoData() {
  console.log('📊 Seeding CFO dashboard data...');

  const cfoUser = await prisma.user.findUnique({ where: { email: 'cfo@antrosys.com' } });
  const financeManager = await prisma.user.findUnique({
    where: { email: 'finance_manager@antrosys.com' },
  });
  const hrHead = await prisma.user.findUnique({ where: { email: 'hr_head@antrosys.com' } });

  if (!cfoUser || !financeManager || !hrHead) {
    console.warn('⚠️  Skipping CFO seed — required users not found');
    return;
  }

  const hrEmployee = await prisma.employee.findUnique({ where: { userId: hrHead.id } });
  const fmEmployee = await prisma.employee.findUnique({ where: { userId: financeManager.id } });

  if (!hrEmployee || !fmEmployee) {
    console.warn('⚠️  Skipping CFO seed — employee records not found');
    return;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  // ── Approval task for the current payroll batch (created by payroll.seed) ──
  const currentBatchNumber = `PAY-${year}-${String(month).padStart(2, '0')}`;
  const currentPayroll = await prisma.payroll.findUnique({
    where: { batchNumber: currentBatchNumber },
  });

  if (currentPayroll) {
    const existingTask = await prisma.approvalTask.findFirst({
      where: {
        assigneeUserId: cfoUser.id,
        entityType: 'PAYROLL',
        entityId: currentPayroll.id,
        actionTitle: `Approve Payroll ${currentPayroll.batchNumber}`,
      },
    });
    if (!existingTask) {
      await prisma.approvalTask.create({
        data: {
          assigneeUserId: cfoUser.id,
          requesterEmployeeId: hrEmployee.id,
          actionTitle: `Approve Payroll ${currentPayroll.batchNumber}`,
          priority: 'HIGH',
          entityType: 'PAYROLL',
          entityId: currentPayroll.id,
          dueAt: new Date(),
        },
      });
    }
  }

  // ── Vendor payments ──
  const vendorPayments: {
    vendorName: string;
    vendorReference: string;
    amount: Prisma.Decimal;
    currencyCode: string;
    status: 'PENDING' | 'PAID';
    paidAt: Date;
    createdByUserId: string;
  }[] = [
    {
      vendorName: 'CloudHost Pro',
      vendorReference: 'VP-9345',
      amount: dec(12500),
      currencyCode: 'USD',
      status: 'PENDING',
      paidAt: dateOnly(year, month, 5),
      createdByUserId: financeManager.id,
    },
    {
      vendorName: 'Office Supplies Co',
      vendorReference: 'VP-42345',
      amount: dec(3200),
      currencyCode: 'USD',
      status: 'PAID',
      paidAt: dateOnly(year, month, 5),
      createdByUserId: financeManager.id,
    },
  ];

  for (const vp of vendorPayments) {
    const existing = await prisma.vendorPayment.findFirst({
      where: { vendorReference: vp.vendorReference },
    });
    if (existing) continue;
    await prisma.vendorPayment.create({ data: vp });
  }

  const pendingVendor = await prisma.vendorPayment.findFirst({
    where: { vendorReference: 'VP-9345' },
  });

  if (pendingVendor) {
    const existingTask = await prisma.approvalTask.findFirst({
      where: {
        assigneeUserId: cfoUser.id,
        entityType: 'VENDOR_EXPENSE',
        entityId: pendingVendor.id,
        actionTitle: `Approve Vendor Payment ${pendingVendor.vendorReference}`,
      },
    });
    if (!existingTask) {
      await prisma.approvalTask.create({
        data: {
          assigneeUserId: cfoUser.id,
          requesterEmployeeId: fmEmployee.id,
          actionTitle: `Approve Vendor Payment ${pendingVendor.vendorReference}`,
          priority: 'LOW',
          entityType: 'VENDOR_EXPENSE',
          entityId: pendingVendor.id,
          dueAt: new Date(),
        },
      });
    }
  }

  // ── Financial activity feed ──
  const activities: {
    category: 'ACCOUNTS_PAYABLE' | 'PAYROLL';
    title: string;
    occurredAt: Date;
  }[] = [
    {
      category: 'ACCOUNTS_PAYABLE',
      title: 'Payment sent to Vendor #42345',
      occurredAt: new Date(dateOnly(year, month, 5).getTime() + 11 * 60 * 60 * 1000 + 15 * 60 * 1000),
    },
    {
      category: 'PAYROLL',
      title: 'Completed batch #12345',
      occurredAt: new Date(dateOnly(year, month - 1, 28).getTime() + 12 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
    {
      category: 'ACCOUNTS_PAYABLE',
      title: 'Vendor payment VP-9345 awaiting approval',
      occurredAt: new Date(dateOnly(year, month, 5).getTime() + 13 * 60 * 60 * 1000),
    },
  ];

  for (const activity of activities) {
    const existing = await prisma.financialActivity.findFirst({
      where: { category: activity.category, title: activity.title },
    });
    if (existing) continue;
    await prisma.financialActivity.create({ data: activity });
  }

  // ── Financial events ──
  const events = [
    {
      title: 'Tax Filing Deadline',
      subtitle: 'Q4 State Taxes',
      startAt: new Date(dateOnly(year, month, 15).getTime() + 7 * 60 * 60 * 1000 + 30 * 60 * 1000),
      unitLabel: 'Unit #123',
      createdByUserId: cfoUser.id,
    },
    {
      title: 'Quarterly Audit',
      subtitle: 'External Auditors - Boardroom',
      startAt: new Date(dateOnly(year, month, 10).getTime() + 9 * 60 * 60 * 1000),
      isHighlighted: true,
      createdByUserId: cfoUser.id,
    },
    {
      title: 'Board Meeting',
      subtitle: 'Financial Review',
      startAt: new Date(dateOnly(year, month, 18).getTime() + 11 * 60 * 60 * 1000 + 30 * 60 * 1000),
      unitLabel: 'Unit #123',
      createdByUserId: cfoUser.id,
    },
  ];

  for (const event of events) {
    const existing = await prisma.financialEvent.findFirst({
      where: { title: event.title, startAt: event.startAt },
    });
    if (existing) continue;
    await prisma.financialEvent.create({ data: event });
  }

  // ── Daily cashflow (deterministic, upsert by unique date) ──
  for (let m = -2; m <= 0; m++) {
    for (let d = 1; d <= 28; d += 3) {
      const invMonth = month + m;
      const dt = dateOnly(year, invMonth, d);
      const inflow = 25000 + ((d % 5) + 1) * 12000;
      const outflow = 11000 + ((d % 3) + 1) * 6000;
      await prisma.dailyCashflow.upsert({
        where: { date: dt },
        update: {},
        create: {
          date: dt,
          inflowAmount: dec(inflow),
          outflowAmount: dec(outflow),
          netAmount: dec(inflow - outflow),
          currencyCode: 'USD',
        },
      });
    }
  }

  console.log('✅ CFO dashboard seed data created');
}
