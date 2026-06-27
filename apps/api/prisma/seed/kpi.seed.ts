import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedKpiData() {
  console.log('📈 Seeding KPI cards...');

  const existing = await prisma.kpiCard.count();
  if (existing > 0) {
    console.log(`  ⏭️  ${existing} KPI cards already exist, skipping`);
    return;
  }

  await prisma.kpiCard.createMany({
    data: [
      {
        title: 'Revenue Growth',
        status: 'on-track',
        value: '$2.4M',
        target: '$2.5M',
        progress: 96,
        trendType: 'bar',
        trendData: [40, 50, 60, 75, 85, 95],
        category: 'revenue',
        period: 'Jun 30',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Client Retention',
        status: 'exceeded',
        value: '98.5%',
        target: '95%',
        progress: 100,
        trendType: 'bar',
        trendData: [70, 75, 72, 85, 90, 98],
        category: 'clients',
        period: 'Jul 15',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Eng Velocity',
        status: 'off-track',
        value: '42 pts',
        target: '65 pts',
        progress: 64,
        trendType: 'bar',
        trendData: [80, 70, 55, 45, 40, 42],
        badgeText: '14% below Q1 average',
        category: 'engineering',
        period: 'Weekly',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Marketing ROI',
        status: 'at-risk',
        value: '2.1x',
        target: '3.0x',
        progress: 70,
        trendType: 'bar',
        trendData: [45, 50, 55, 60, 65, 70],
        category: 'marketing',
        period: 'Aug 01',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'System Uptime',
        status: 'on-track',
        value: '99.9%',
        target: '99.9%',
        progress: 100,
        trendType: 'line',
        trendData: [99.8, 99.9, 99.7, 99.9, 99.9, 99.9],
        category: 'ops',
        period: 'Daily',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Customer Sat',
        status: 'on-track',
        value: '4.8',
        target: '4.5',
        progress: 100,
        trendType: 'line',
        trendData: [4.2, 4.4, 4.5, 4.5, 4.7, 4.8],
        category: 'clients',
        period: 'Monthly',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Lead Gen',
        status: 'at-risk',
        value: '840',
        target: '1200',
        progress: 70,
        trendType: 'line',
        trendData: [900, 880, 850, 820, 830, 840],
        category: 'marketing',
        period: 'Weekly',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      },
      {
        title: 'Hiring Target',
        status: 'on-track',
        value: '12',
        target: '15',
        progress: 80,
        trendType: 'line',
        trendData: [2, 4, 6, 8, 10, 12],
        category: 'hr',
        period: 'Monthly',
        quarter: 'Q2',
        assigneeUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      },
    ],
  });

  console.log('✅ 8 KPI cards seeded');
}
