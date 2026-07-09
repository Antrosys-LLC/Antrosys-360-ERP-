import {
  PrismaClient,
  LeaveType,
  LeaveRequestStatus,
  Department,
} from '@prisma/client';

const prisma = new PrismaClient();

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

  await prisma.employee.update({
    where: { id: sara.id },
    data: {
      designation: 'Senior Frontend Developer',
      location: 'Islamabad',
      joiningDate: daysAgo(365 * 3),
    },
  });

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

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  for (const [leaveType, allocated, used, pending] of [
    [LeaveType.ANNUAL, 20, 2, 0],
    [LeaveType.SICK, 20, 3, 2],
    [LeaveType.CASUAL, 20, 2, 1],
  ] as const) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year_month: {
          employeeId: sara.id,
          leaveType,
          year,
          month,
        },
      },
      update: {
        allocatedDays: allocated,
        usedDays: used,
        pendingDays: pending,
      },
      create: {
        employeeId: sara.id,
        leaveType,
        year,
        month,
        allocatedDays: allocated,
        usedDays: used,
        pendingDays: pending,
      },
    });
  }

  await prisma.leaveRequest.deleteMany({ where: { employeeId: sara.id } });
  await prisma.leaveRequest.create({
    data: {
      employeeId: sara.id,
      type: LeaveType.ANNUAL,
      startDate: utcDate(year, 5, 21),
      endDate: utcDate(year, 5, 23),
      durationDays: 2,
      status: LeaveRequestStatus.PENDING,
      reason: 'Personal travel',
    },
  });

  await prisma.companyHoliday.deleteMany({});
  const saraTeam = await prisma.team.findFirst({
    where: { manager: { user: { email: 'sub_manager@antrosys.com' } } },
  });
  await prisma.companyHoliday.createMany({
    data: [
      {
        title: 'Independence Day',
        date: utcDate(year, 5, 26),
        isNational: true,
        teamId: saraTeam?.id,
      },
      {
        title: 'Eid-ul-Adha',
        date: utcDate(year, 6, 5),
        endDate: utcDate(year, 6, 6),
        isNational: true,
        teamId: saraTeam?.id,
      },
      {
        title: 'National Holiday',
        date: utcDate(year, 8, 14),
        isNational: true,
        teamId: saraTeam?.id,
      },
    ],
  });

  const demoEmails = [
    'sara.javed@antrosys.com',
    'fawad.khan@antrosys.com',
    'bilal.hassan@antrosys.com',
    'hina.baig@antrosys.com',
    'omar.mirza@antrosys.com',
    'maria.raza@antrosys.com',
    'nadia.qureshi@antrosys.com',
  ];
  for (const email of demoEmails) {
    const emp = await prisma.employee.findFirst({ where: { user: { email } } });
    if (emp) {
      await prisma.attendance.deleteMany({ where: { employeeId: emp.id } });
    }
  }

  const announcementSpecs = [
    {
      email: 'fawad.khan@antrosys.com',
      title: 'Engineering All-Hands',
      content: 'Q3 Engineering All-Hands meeting schedule update',
      hoursAgo: 2,
    },
    {
      email: 'bilal.hassan@antrosys.com',
      title: 'Firewall Protocol',
      content: 'Please review the new firewall deployment protocol',
      hoursAgo: 26,
    },
    {
      email: 'hina.baig@antrosys.com',
      title: 'Office Maintenance',
      content: 'Office maintenance scheduled for the 3rd floor next week',
      hoursAgo: 72,
    },
  ];

  for (const spec of announcementSpecs) {
    const author = await prisma.employee.findFirst({ where: { user: { email: spec.email } } });
    if (!author) continue;

    const existing = await prisma.announcement.findFirst({
      where: { authorId: author.id, content: spec.content },
    });
    if (existing) continue;

    await prisma.announcement.create({
      data: {
        title: spec.title,
        content: spec.content,
        authorId: author.id,
        department: Department.ENGINEERING,
        createdAt: new Date(Date.now() - spec.hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  console.log(`  ✅ Employee dashboard seed complete (${teamCount} team members under Sara)`);
}
