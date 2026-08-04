import { Department, PrismaClient } from '@prisma/client';

export async function seedOperationHeadData(prisma: PrismaClient) {
  console.log('🏭 Seeding Operation Head data...');

  const headcountPlans: { department: Department; targetHeadcount: number; criticalGapThreshold: number }[] = [
    { department: 'ENGINEERING', targetHeadcount: 12, criticalGapThreshold: 2 },
    { department: 'OPERATIONS', targetHeadcount: 8, criticalGapThreshold: 2 },
    { department: 'FINANCE', targetHeadcount: 6, criticalGapThreshold: 2 },
    { department: 'HR', targetHeadcount: 5, criticalGapThreshold: 2 },
    { department: 'SALES', targetHeadcount: 4, criticalGapThreshold: 2 },
  ];

  for (const plan of headcountPlans) {
    await prisma.departmentHeadcountPlan.upsert({
      where: { department: plan.department },
      update: { targetHeadcount: plan.targetHeadcount, criticalGapThreshold: plan.criticalGapThreshold },
      create: plan,
    });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const day = today.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() + diff);

  const rosterValues = [
    { required: 50, assigned: 47 },
    { required: 50, assigned: 48 },
    { required: 50, assigned: 46 },
    { required: 50, assigned: 49 },
    { required: 50, assigned: 47 },
  ];

  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + i);
    const roster = rosterValues[i];

    const existing = await prisma.rosterDayCoverage.findFirst({
      where: { date, department: null },
    });

    if (existing) {
      await prisma.rosterDayCoverage.update({
        where: { id: existing.id },
        data: { requiredStaff: roster.required, assignedStaff: roster.assigned },
      });
    } else {
      await prisma.rosterDayCoverage.create({
        data: {
          date,
          department: null,
          requiredStaff: roster.required,
          assignedStaff: roster.assigned,
        },
      });
    }
  }

  console.log('✅ Operation Head data seeded!');
}
