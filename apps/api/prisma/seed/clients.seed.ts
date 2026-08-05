import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 86400000);
}

const health = (productUsage: number, supportTickets: number, paymentHistory: number, engagement: number, nps: number) => ({
  productUsage,
  supportTickets,
  paymentHistory,
  engagement,
  nps,
});

export async function seedClientsData() {
  console.log('🤝 Seeding client management dashboard data...');

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const clients: Prisma.ClientCreateInput[] = [
    {
      clientCode: 'CLT-001',
      name: 'Nexus Corp',
      email: 'billing@nexus.com',
      industry: 'Technology & SaaS',
      tier: 'Enterprise',
      pipelineStage: 'ACTIVE' as const,
      monthlyRevenue: dec(3500000),
      annualRevenue: dec(42000000),
      lifetimeValue: dec(147000000),
      healthScore: 92,
      healthMetrics: health(95, 90, 98, 88, 92),
      renewalDueAt: dateOnly(year, 6, 30),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-002',
      name: 'Apex Holdings',
      email: 'finance@apex.com',
      industry: 'Finance',
      tier: 'Enterprise',
      pipelineStage: 'ACTIVE' as const,
      monthlyRevenue: dec(2333333),
      annualRevenue: dec(28000000),
      lifetimeValue: dec(84000000),
      healthScore: 88,
      healthMetrics: health(88, 85, 92, 86, 90),
      renewalDueAt: dateOnly(year, 8, 15),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-003',
      name: 'Vanta AI',
      email: 'ops@vanta.ai',
      industry: 'Software',
      tier: 'Growth',
      pipelineStage: 'AT_RISK' as const,
      monthlyRevenue: dec(1250000),
      annualRevenue: dec(15000000),
      lifetimeValue: dec(45000000),
      healthScore: 45,
      healthMetrics: health(40, 35, 55, 42, 48),
      renewalDueAt: dateOnly(year, month, 30),
      isAtRisk: true,
      isActive: true,
    },
    {
      clientCode: 'CLT-004',
      name: 'BrightX Corp',
      email: 'ap@brightx.com',
      industry: 'Media',
      tier: 'Growth',
      pipelineStage: 'AT_RISK' as const,
      monthlyRevenue: dec(1750000),
      annualRevenue: dec(21000000),
      lifetimeValue: dec(63000000),
      healthScore: 38,
      healthMetrics: health(35, 30, 45, 38, 40),
      renewalDueAt: dateOnly(year, 6, 12),
      isAtRisk: true,
      isActive: true,
    },
    {
      clientCode: 'CLT-005',
      name: 'OrbitTech',
      email: 'hello@orbittech.io',
      industry: 'Technology',
      tier: 'SMB',
      pipelineStage: 'PROSPECT' as const,
      salesStage: 'INITIAL_CONTACT' as const,
      annualRevenue: dec(12000000),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-006',
      name: 'Zenith Corp',
      email: 'team@zenith.com',
      industry: 'Consulting',
      tier: 'SMB',
      pipelineStage: 'PROSPECT' as const,
      salesStage: 'INITIAL_CONTACT' as const,
      annualRevenue: dec(3000000),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-007',
      name: 'CloudSync',
      email: 'sales@cloudsync.io',
      industry: 'Cloud Infrastructure',
      tier: 'Enterprise',
      pipelineStage: 'PROPOSAL' as const,
      salesStage: 'PROPOSAL' as const,
      annualRevenue: dec(45000000),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-008',
      name: 'ByteForge',
      email: 'deals@byteforge.dev',
      industry: 'Software',
      tier: 'Enterprise',
      pipelineStage: 'NEGOTIATION' as const,
      salesStage: 'NEGOTIATION' as const,
      annualRevenue: dec(38000000),
      isAtRisk: false,
      isActive: true,
    },
    {
      clientCode: 'CLT-009',
      name: 'GlobalNet',
      email: 'legal@globalnet.com',
      industry: 'Telecom',
      tier: 'Enterprise',
      pipelineStage: 'NEGOTIATION' as const,
      salesStage: 'CONTRACT_REVIEW' as const,
      annualRevenue: dec(18000000),
      isAtRisk: false,
      isActive: true,
    },
  ];

  for (let i = 0; i < 25; i++) {
    clients.push({
      clientCode: `CLT-${String(10 + i).padStart(3, '0')}`,
      name: `Client ${10 + i}`,
      email: `client${10 + i}@example.com`,
      industry: ['Technology', 'Finance', 'Healthcare', 'Retail'][i % 4],
      tier: ['SMB', 'Growth', 'Enterprise'][i % 3],
      pipelineStage: (i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'PROSPECT' : 'PROPOSAL') as 'ACTIVE' | 'PROSPECT' | 'PROPOSAL',
      monthlyRevenue: dec(500000 + i * 100000),
      annualRevenue: dec(6000000 + i * 1200000),
      lifetimeValue: dec(18000000 + i * 3600000),
      healthScore: 60 + (i % 35),
      healthMetrics: health(70 + (i % 20), 65 + (i % 25), 75 + (i % 15), 68 + (i % 22), 72 + (i % 18)),
      renewalDueAt: i % 4 === 0 ? dateOnly(year, month + (i % 6), 1 + (i % 28)) : undefined,
      isAtRisk: false,
      isActive: true,
    });
  }

  const createdClients: Record<string, string> = {};

  for (const c of clients) {
    const client = await prisma.client.upsert({
      where: { clientCode: c.clientCode! },
      update: {},
      create: {
        clientCode: c.clientCode,
        name: c.name,
        email: c.email,
        industry: c.industry,
        tier: c.tier,
        pipelineStage: c.pipelineStage,
        salesStage: 'salesStage' in c ? c.salesStage : null,
        monthlyRevenue: c.monthlyRevenue ?? null,
        annualRevenue: c.annualRevenue ?? null,
        lifetimeValue: c.lifetimeValue ?? null,
        healthScore: c.healthScore ?? 75,
        healthMetrics: c.healthMetrics ?? health(70, 70, 70, 70, 70),
        renewalDueAt: c.renewalDueAt ?? undefined,
        isAtRisk: c.isAtRisk ?? false,
        isActive: c.isActive ?? true,
        currencyCode: 'PKR',
      },
    });
    createdClients[c.name] = client.id;

    const existingStatus = await prisma.clientStatus.findFirst({
      where: { clientId: client.id, status: c.pipelineStage! },
    });
    if (!existingStatus) {
      await prisma.clientStatus.create({
        data: { clientId: client.id, status: c.pipelineStage!, note: 'Initial status' },
      });
    }
  }

  const nexusId = createdClients['Nexus Corp'];
  const apexId = createdClients['Apex Holdings'];
  const vantaId = createdClients['Vanta AI'];
  const brightxId = createdClients['BrightX Corp'];
  const cloudSyncId = createdClients['CloudSync'];

  // Onboarding records — demo the client onboarding module
  const onboardingItems = (completedTitles: string[]) => {
    const all = [
      { title: 'Schedule kickoff call', description: 'Book the initial kickoff meeting with key client stakeholders.', category: 'KICKOFF', sortOrder: 10 },
      { title: 'Confirm key stakeholders & contacts', description: 'Capture the primary and secondary contacts in the client account.', category: 'KICKOFF', sortOrder: 20 },
      { title: 'Align on goals & success metrics', description: 'Document the client objectives and measurable success criteria.', category: 'KICKOFF', sortOrder: 30 },
      { title: 'Create account & user access', description: 'Provision accounts, roles, and credentials for the client team.', category: 'SETUP', sortOrder: 40 },
      { title: 'Set up project workspace', description: 'Create the project(s) and configure engagement settings.', category: 'SETUP', sortOrder: 50 },
      { title: 'Configure billing & payment terms', description: 'Set currency, payment terms, and the first renewal date.', category: 'SETUP', sortOrder: 60 },
      { title: 'Collect onboarding documents', description: 'Gather signed agreements, PO, and compliance documents.', category: 'SETUP', sortOrder: 70 },
      { title: 'Deliver initial onboarding report', description: 'Share the kickoff summary and roadmap with the client.', category: 'HANDBACK', sortOrder: 80 },
      { title: 'Schedule QBR / handover session', description: 'Book the first business review and hand the account to the account owner.', category: 'HANDBACK', sortOrder: 90 },
      { title: 'Mark client as active', description: 'Finalize onboarding and move the client to ACTIVE.', category: 'HANDBACK', sortOrder: 100 },
    ];
    return all.map((item) => ({
      ...item,
      completedAt: completedTitles.includes(item.title) ? daysAgo(1) : null,
    }));
  };

  const onboardingSpecs = [
    { code: 'CLT-007', phase: 'KICKOFF', startedDaysAgo: 2, completedTitles: [] },
    {
      code: 'CLT-008',
      phase: 'SETUP',
      startedDaysAgo: 7,
      completedTitles: ['Schedule kickoff call', 'Confirm key stakeholders & contacts', 'Align on goals & success metrics'],
    },
  ];
  for (const spec of onboardingSpecs) {
    const client = await prisma.client.findUnique({ where: { clientCode: spec.code } });
    if (!client) continue;
    const existing = await prisma.clientOnboarding.findUnique({ where: { clientId: client.id } });
    if (existing) continue;
    await prisma.client.update({ where: { id: client.id }, data: { pipelineStage: 'ONBOARDING' as const } });
    const existingStatus = await prisma.clientStatus.findFirst({
      where: { clientId: client.id, status: 'ONBOARDING' },
    });
    if (!existingStatus) {
      await prisma.clientStatus.create({
        data: { clientId: client.id, status: 'ONBOARDING', note: 'Deal won, onboarding in progress' },
      });
    }
    await prisma.clientOnboarding.create({
      data: {
        clientId: client.id,
        status: 'IN_PROGRESS',
        currentPhase: spec.phase as 'KICKOFF' | 'SETUP',
        startDate: daysAgo(spec.startedDaysAgo),
        items: { create: onboardingItems(spec.completedTitles) },
      },
    });
  }

  const contacts = [
    { clientId: nexusId, name: 'Sarah Chen', email: 'sarah@nexus.com', phone: '+92 300 1112233', role: 'VP Engineering', isPrimary: true },
    { clientId: nexusId, name: 'James Park', email: 'james@nexus.com', role: 'Finance Director', isPrimary: false },
    { clientId: apexId, name: 'Maria Lopez', email: 'maria@apex.com', role: 'CFO', isPrimary: true },
    { clientId: vantaId, name: 'Alex Kim', email: 'alex@vanta.ai', role: 'CTO', isPrimary: true },
    { clientId: brightxId, name: 'Emma Wilson', email: 'emma@brightx.com', role: 'Head of Ops', isPrimary: true },
  ];
  for (const contact of contacts) {
    const existing = await prisma.clientContact.findFirst({
      where: { clientId: contact.clientId, email: contact.email },
    });
    if (existing) continue;
    await prisma.clientContact.create({ data: contact });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const wed = new Date();
  wed.setDate(wed.getDate() + 3);
  const thu = new Date();
  thu.setDate(thu.getDate() + 4);

  const tasks = [
    { clientId: brightxId, title: 'Urgent check-in call with BrightX', priority: 'URGENT', status: 'PENDING', dueAt: new Date(year, month - 1, now.getDate(), 14, 0) },
    { clientId: nexusId, title: 'Send Q3 invoice to Nexus', priority: 'MEDIUM', status: 'PENDING', dueAt: tomorrow },
    { clientId: vantaId, title: 'Review support tickets for Vanta', priority: 'URGENT', status: 'PENDING', dueAt: tomorrow },
    { clientId: createdClients['ByteForge'], title: 'Follow up on ByteForge negotiation', priority: 'HIGH', status: 'PENDING', dueAt: wed },
    { clientId: createdClients['OrbitTech'], title: 'Initial sync with Orbital', priority: 'MEDIUM', status: 'PENDING', dueAt: thu },
  ];
  for (const task of tasks) {
    const existing = await prisma.clientTask.findFirst({
      where: { clientId: task.clientId, title: task.title },
    });
    if (existing) continue;
    await prisma.clientTask.create({ data: task });
  }

  const timelineEvents = [
    { clientId: nexusId, eventType: 'EMAIL', title: 'Email sent to Sarah Chen re: Q3 roadmap', description: 'Follow-up on quarterly planning', eventDate: hoursAgo(2) },
    { clientId: vantaId, eventType: 'ALERT', title: 'Usage alert triggered for Vanta AI', description: 'Product usage dropped 40% this month', eventDate: hoursAgo(5) },
    { clientId: apexId, eventType: 'PAYMENT', title: 'Payment received from Apex Holdings', description: 'PKR 2.3M invoice #INV-2024-089 paid', eventDate: daysAgo(1) },
    { clientId: brightxId, eventType: 'STATUS', title: 'BrightX Corp marked at-risk', description: 'Health score dropped below 50', eventDate: daysAgo(1) },
    { clientId: cloudSyncId, eventType: 'PROPOSAL', title: 'Proposal viewed by CloudSync team', description: '3 stakeholders viewed the proposal document', eventDate: daysAgo(2) },
  ];
  for (const event of timelineEvents) {
    const existing = await prisma.clientTimelineEvent.findFirst({
      where: { clientId: event.clientId, title: event.title },
    });
    if (existing) continue;
    await prisma.clientTimelineEvent.create({ data: event });
  }

  const activities = [
    { clientId: nexusId, type: 'EMAIL', title: 'Q3 roadmap discussion', description: 'Sent follow-up email to Sarah Chen' },
    { clientId: vantaId, type: 'ALERT', title: 'Usage drop alert', description: 'Automated usage monitoring alert' },
    { clientId: apexId, type: 'PAYMENT', title: 'Invoice payment received', description: 'PKR 2.3M received' },
  ];
  for (const activity of activities) {
    const existing = await prisma.clientActivity.findFirst({
      where: { clientId: activity.clientId, title: activity.title },
    });
    if (existing) continue;
    await prisma.clientActivity.create({ data: activity });
  }

  // Finance invoices — sole owner of the invoice domain (upsert by invoice number).
  const financeManager = await prisma.user.findUnique({
    where: { email: 'finance_manager@antrosys.com' },
  });
  if (financeManager) {
    const invoiceClients = [
      createdClients['Nexus Corp'] ?? nexusId,
      createdClients['Apex Holdings'] ?? apexId,
      createdClients['Vanta AI'] ?? vantaId,
    ].filter(Boolean);

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
      const clientId = invoiceClients[spec.clientIdx % invoiceClients.length];
      if (!clientId) continue;
      const invMonth = month + spec.monthOffset;
      const invDate = dateOnly(year, invMonth, spec.invoiceDay);
      const dueDate = dateOnly(year, invMonth, spec.dueDay);
      const tax = spec.total * 0.1;

      const existing = await prisma.invoice.findUnique({
        where: { invoiceNumber: spec.number },
      });
      if (existing) continue;

      await prisma.invoice.create({
        data: {
          invoiceNumber: spec.number,
          clientId,
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

    const cfoUser = await prisma.user.findUnique({ where: { email: 'cfo@antrosys.com' } });
    const fmEmployee = await prisma.employee.findFirst({
      where: { user: { email: 'finance_manager@antrosys.com' } },
    });
    const sentInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: 'INV-2026-003' },
    });
    if (cfoUser && fmEmployee && sentInvoice) {
      const existingTask = await prisma.approvalTask.findFirst({
        where: {
          assigneeUserId: cfoUser.id,
          entityType: 'INVOICE',
          entityId: sentInvoice.id,
          actionTitle: `Review Invoice ${sentInvoice.invoiceNumber}`,
        },
      });
      if (!existingTask) {
        await prisma.approvalTask.create({
          data: {
            assigneeUserId: cfoUser.id,
            requesterEmployeeId: fmEmployee.id,
            actionTitle: `Review Invoice ${sentInvoice.invoiceNumber}`,
            priority: 'MEDIUM',
            entityType: 'INVOICE',
            entityId: sentInvoice.id,
            dueAt: new Date(),
          },
        });
      }
      const existingActivity = await prisma.financialActivity.findFirst({
        where: { category: 'INVOICE', title: `Sent invoice ${sentInvoice.invoiceNumber}` },
      });
      if (!existingActivity) {
        await prisma.financialActivity.create({
          data: {
            category: 'INVOICE',
            title: `Sent invoice ${sentInvoice.invoiceNumber}`,
            occurredAt: new Date(),
            metadata: { invoiceId: sentInvoice.id },
          },
        });
      }
    }
  }

  console.log('✅ Client management dashboard seed data created');
}
