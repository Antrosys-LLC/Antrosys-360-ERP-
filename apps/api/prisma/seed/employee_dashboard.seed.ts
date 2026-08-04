import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function seedEmployeeDashboardData() {
  console.log('🧑‍💼 Seeding employee dashboard data...');

  await prisma.workScheduleConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      standardHoursPerDay: 8,
      halfDayThresholdHours: 4,
      overtimeEnabled: true,
      lateAfterHour: 9,
      lateAfterMinute: 0,
    },
  });

  const sara = await prisma.employee.findFirst({
    where: { user: { email: 'sara.javed@antrosys.com' } },
    include: { user: true },
  });

  if (!sara) {
    console.warn('  ⚠️ Sara Javed employee not found — skipping employee dashboard seed');
    return;
  }

  // Demo team: Sara is the manager of these employees (idempotent assignment).
  const teamEmails = ['fawad.khan@antrosys.com', 'bilal.hassan@antrosys.com', 'hina.baig@antrosys.com'];
  let teamCount = 0;
  for (const email of teamEmails) {
    const emp = await prisma.employee.findFirst({ where: { user: { email } } });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { managerId: sara.id },
      });
      teamCount += 1;
    }
  }

  const year = new Date().getUTCFullYear();

  // Company holidays — created once, keyed by title (no deletion on re-run).
  const holidays = [
    {
      title: 'Pakistan Day',
      date: utcDate(year, 3, 23),
      isNational: true,
    },
    {
      title: 'Eid-ul-Adha',
      date: utcDate(year, 6, 5),
      endDate: utcDate(year, 6, 6),
      isNational: true,
    },
    {
      title: 'Independence Day',
      date: utcDate(year, 8, 14),
      isNational: true,
    },
  ];

  const saraTeam = await prisma.team.findFirst({
    where: { manager: { user: { email: 'sub_manager@antrosys.com' } } },
  });

  for (const holiday of holidays) {
    const existing = await prisma.companyHoliday.findFirst({
      where: { title: holiday.title },
    });
    if (existing) continue;
    await prisma.companyHoliday.create({
      data: {
        ...holiday,
        endDate: holiday.endDate ?? null,
        teamId: saraTeam?.id,
      },
    });
  }

  console.log(`  ✅ Employee dashboard seed complete (${teamCount} team members under Sara)`);
}
