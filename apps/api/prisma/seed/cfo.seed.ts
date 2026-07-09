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

  await prisma.financialActivity.deleteMany();
  await prisma.financialEvent.deleteMany();
  await prisma.approvalTask.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.dailyCashflow.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.client.deleteMany();

  const clients = await Promise.all([
    prisma.client.create({ data: { name: 'Acme Corp', email: 'billing@acme.com' } }),
    prisma.client.create({ data: { name: 'Globex Industries', email: 'ap@globex.com' } }),
    prisma.client.create({ data: { name: 'Initech LLC', email: 'finance@initech.com' } }),
  ]);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const invoiceSpecs: {
    number: string;
    clientIdx: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
    total: number;
    currency: string;
    invoiceDay: number;
    dueDay: number;
    monthOffset: number;
  }[] = [
    { number: 'INV-2026-001', clientIdx: 0, status: 'PAID', total: 125000, currency: 'USD', invoiceDay: 2, dueDay: 17, monthOffset: 0 },
    { number: 'INV-2026-002', clientIdx: 1, status: 'PAID', total: 89000, currency: 'USD', invoiceDay: 5, dueDay: 20, monthOffset: 0 },
    { number: 'INV-2026-003', clientIdx: 2, status: 'SENT', total: 42000, currency: 'USD', invoiceDay: 8, dueDay: 23, monthOffset: 0 },
    { number: 'INV-2026-004', clientIdx: 0, status: 'PARTIALLY_PAID', total: 67000, currency: 'EUR', invoiceDay: 10, dueDay: 25, monthOffset: 0 },
    { number: 'INV-2026-005', clientIdx: 1, status: 'DRAFT', total: 34000, currency: 'USD', invoiceDay: 12, dueDay: 27, monthOffset: 0 },
    { number: 'INV-2025-110', clientIdx: 2, status: 'PAID', total: 98000, currency: 'USD', invoiceDay: 15, dueDay: 30, monthOffset: -1 },
    { number: 'INV-2025-111', clientIdx: 0, status: 'PAID', total: 156000, currency: 'GBP', invoiceDay: 18, dueDay: 3, monthOffset: -1 },
    { number: 'INV-2025-112', clientIdx: 1, status: 'OVERDUE', total: 55000, currency: 'USD', invoiceDay: 1, dueDay: 10, monthOffset: -2 },
    { number: 'INV-2026-006', clientIdx: 0, status: 'SENT', total: 28000, currency: 'PKR', invoiceDay: 14, dueDay: 1, monthOffset: -1 },
    { number: 'INV-2026-007', clientIdx: 2, status: 'DRAFT', total: 19000, currency: 'AED', invoiceDay: 16, dueDay: 5, monthOffset: 0 },
  ];

  for (const spec of invoiceSpecs) {
    const invMonth = month + spec.monthOffset;
    const invDate = dateOnly(year, invMonth, spec.invoiceDay);
    const dueDate = dateOnly(year, invMonth, spec.dueDay);
    const tax = spec.total * 0.1;

    await prisma.invoice.create({
      data: {
        invoiceNumber: spec.number,
        clientId: clients[spec.clientIdx].id,
        status: spec.status,
        invoiceDate: invDate,
        dueDate,
        paymentTermsDays: 15,
        currencyCode: spec.currency,
        subtotal: dec(spec.total),
        discountTotal: dec(0),
        taxableAmount: dec(spec.total),
        taxTotal: dec(tax),
        withholdingTotal: dec(0),
        totalDue: dec(spec.total + tax),
        issuedByUserId: financeManager.id,
        lineItems: {
          create: [
            {
              sortOrder: 1,
              description: 'Professional services',
              quantity: dec(1),
              unitPrice: dec(spec.total),
              discountPct: dec(0),
              taxType: 'GST',
              taxRatePct: dec(10),
              lineSubtotal: dec(spec.total),
              lineTaxAmount: dec(tax),
              lineTotal: dec(spec.total + tax),
            },
          ],
        },
      },
    });
  }

  const payrollCurrent = await prisma.payroll.create({
    data: {
      batchNumber: 'PAY-2026-01',
      periodStart: dateOnly(year, month, 1),
      periodEnd: dateOnly(year, month, 15),
      totalGross: dec(920000),
      totalNet: dec(845000),
      taxWithheld: dec(75000),
      employeeCount: 247,
      status: 'PENDING_APPROVAL',
      submittedByUserId: financeManager.id,
    },
  });

  await prisma.payroll.create({
    data: {
      batchNumber: 'PAY-2025-12',
      periodStart: dateOnly(year, month - 1, 16),
      periodEnd: dateOnly(year, month - 1, 28),
      totalGross: dec(880000),
      totalNet: dec(810000),
      taxWithheld: dec(70000),
      employeeCount: 245,
      status: 'PAID',
      submittedByUserId: financeManager.id,
      approvedByUserId: cfoUser.id,
      approvedAt: dateOnly(year, month - 1, 29),
      paidAt: dateOnly(year, month - 1, 30),
    },
  });

  await prisma.approvalTask.create({
    data: {
      assigneeUserId: cfoUser.id,
      requesterEmployeeId: hrEmployee.id,
      actionTitle: `Approve Payroll ${payrollCurrent.batchNumber}`,
      priority: 'HIGH',
      entityType: 'PAYROLL',
      entityId: payrollCurrent.id,
      dueAt: new Date(),
    },
  });

  await prisma.vendorPayment.createMany({
    data: [
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
        paidAt: dateOnly(year, month, 5),
        createdByUserId: financeManager.id,
      },
    ],
  });

  const pendingVendor = await prisma.vendorPayment.findFirst({
    where: { vendorReference: 'VP-9345' },
  });

  await prisma.approvalTask.create({
    data: {
      assigneeUserId: cfoUser.id,
      requesterEmployeeId: fmEmployee.id,
      actionTitle: `Approve Vendor Payment ${pendingVendor?.vendorReference ?? 'VP-9345'}`,
      priority: 'LOW',
      entityType: 'VENDOR_EXPENSE',
      entityId: pendingVendor?.id ?? 'vendor-exp-882',
      dueAt: new Date(),
    },
  });

  await prisma.financialActivity.createMany({
    data: [
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
    ],
  });

  await prisma.financialEvent.createMany({
    data: [
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
    ],
  });

  for (let m = -2; m <= 0; m++) {
    for (let d = 1; d <= 28; d += 3) {
      const invMonth = month + m;
      const dt = dateOnly(year, invMonth, d);
      const inflow = 20000 + Math.random() * 80000;
      const outflow = 10000 + Math.random() * 40000;
      await prisma.dailyCashflow.create({
        data: {
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
