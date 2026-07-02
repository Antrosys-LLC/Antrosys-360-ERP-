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

  await prisma.clientTimelineEvent.deleteMany();
  await prisma.clientTask.deleteMany();
  await prisma.clientActivity.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.clientRenewal.deleteMany();
  await prisma.clientStatus.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.document.updateMany({ where: { clientId: { not: null } }, data: { clientId: null } });
  await prisma.clientProject.deleteMany();
  await prisma.client.deleteMany();

  const clients = [
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
      renewalDueAt: i % 4 === 0 ? dateOnly(year, month + (i % 6), 1 + (i % 28)) : null,
      isAtRisk: false,
      isActive: true,
    });
  }

  const createdClients: Record<string, string> = {};

  for (const c of clients) {
    const client = await prisma.client.create({
      data: {
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

    await prisma.clientStatus.create({
      data: { clientId: client.id, status: c.pipelineStage, note: 'Initial status' },
    });
  }

  const nexusId = createdClients['Nexus Corp'];
  const apexId = createdClients['Apex Holdings'];
  const vantaId = createdClients['Vanta AI'];
  const brightxId = createdClients['BrightX Corp'];
  const cloudSyncId = createdClients['CloudSync'];

  await prisma.clientContact.createMany({
    data: [
      { clientId: nexusId, name: 'Sarah Chen', email: 'sarah@nexus.com', phone: '+92 300 1112233', role: 'VP Engineering', isPrimary: true },
      { clientId: nexusId, name: 'James Park', email: 'james@nexus.com', role: 'Finance Director', isPrimary: false },
      { clientId: apexId, name: 'Maria Lopez', email: 'maria@apex.com', role: 'CFO', isPrimary: true },
      { clientId: vantaId, name: 'Alex Kim', email: 'alex@vanta.ai', role: 'CTO', isPrimary: true },
      { clientId: brightxId, name: 'Emma Wilson', email: 'emma@brightx.com', role: 'Head of Ops', isPrimary: true },
    ],
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const wed = new Date();
  wed.setDate(wed.getDate() + 3);
  const thu = new Date();
  thu.setDate(thu.getDate() + 4);

  await prisma.clientTask.createMany({
    data: [
      { clientId: brightxId, title: 'Urgent check-in call with BrightX', priority: 'URGENT', status: 'PENDING', dueAt: new Date(year, month - 1, now.getDate(), 14, 0) },
      { clientId: nexusId, title: 'Send Q3 invoice to Nexus', priority: 'MEDIUM', status: 'PENDING', dueAt: tomorrow },
      { clientId: vantaId, title: 'Review support tickets for Vanta', priority: 'URGENT', status: 'PENDING', dueAt: tomorrow },
      { clientId: createdClients['ByteForge'], title: 'Follow up on ByteForge negotiation', priority: 'HIGH', status: 'PENDING', dueAt: wed },
      { clientId: createdClients['OrbitTech'], title: 'Initial sync with Orbital', priority: 'MEDIUM', status: 'PENDING', dueAt: thu },
    ],
  });

  await prisma.clientTimelineEvent.createMany({
    data: [
      { clientId: nexusId, eventType: 'EMAIL', title: 'Email sent to Sarah Chen re: Q3 roadmap', description: 'Follow-up on quarterly planning', eventDate: hoursAgo(2) },
      { clientId: vantaId, eventType: 'ALERT', title: 'Usage alert triggered for Vanta AI', description: 'Product usage dropped 40% this month', eventDate: hoursAgo(5) },
      { clientId: apexId, eventType: 'PAYMENT', title: 'Payment received from Apex Holdings', description: 'PKR 2.3M invoice #INV-2024-089 paid', eventDate: daysAgo(1) },
      { clientId: brightxId, eventType: 'STATUS', title: 'BrightX Corp marked at-risk', description: 'Health score dropped below 50', eventDate: daysAgo(1) },
      { clientId: cloudSyncId, eventType: 'PROPOSAL', title: 'Proposal viewed by CloudSync team', description: '3 stakeholders viewed the proposal document', eventDate: daysAgo(2) },
    ],
  });

  await prisma.clientActivity.createMany({
    data: [
      { clientId: nexusId, type: 'EMAIL', title: 'Q3 roadmap discussion', description: 'Sent follow-up email to Sarah Chen' },
      { clientId: vantaId, type: 'ALERT', title: 'Usage drop alert', description: 'Automated usage monitoring alert' },
      { clientId: apexId, type: 'PAYMENT', title: 'Invoice payment received', description: 'PKR 2.3M received' },
    ],
  });

  console.log('✅ Client management dashboard seed data created');
}
