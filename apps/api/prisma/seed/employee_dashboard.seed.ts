import {
  PrismaClient,
  AttendanceStatus,
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

  const year = new Date().getUTCFullYear();

  for (const [leaveType, allocated, used, pending] of [
    [LeaveType.ANNUAL, 14, 2, 0],
    [LeaveType.SICK, 10, 3, 2],
    [LeaveType.CASUAL, 5, 2, 1],
  ] as const) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: {
          employeeId: sara.id,
          leaveType,
          year,
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
  await prisma.companyHoliday.createMany({
    data: [
      {
        title: 'Independence Day',
        date: utcDate(year, 5, 26),
        isNational: true,
      },
      {
        title: 'Eid-ul-Adha',
        date: utcDate(year, 6, 5),
        endDate: utcDate(year, 6, 6),
        isNational: true,
      },
      {
        title: 'National Holiday',
        date: utcDate(year, 8, 14),
        isNational: true,
      },
    ],
  });

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const monthYear = now.getUTCFullYear();

  const attendancePattern: { day: number; status: AttendanceStatus; hours: number }[] = [
    { day: 1, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 4, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 5, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 6, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 7, status: AttendanceStatus.HALF_DAY, hours: 3.5 },
    { day: 8, status: AttendanceStatus.PRESENT, hours: 8.5 },
    { day: 11, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 12, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 13, status: AttendanceStatus.PRESENT, hours: 8 },
    { day: 18, status: AttendanceStatus.ABSENT, hours: 0 },
  ];

  for (const entry of attendancePattern) {
    const date = utcDate(monthYear, month, entry.day);
    const checkIn = new Date(date);
    checkIn.setUTCHours(8, 45, 0, 0);
    const checkOut =
      entry.hours > 0
        ? new Date(checkIn.getTime() + entry.hours * 60 * 60 * 1000)
        : null;
    const overtime = Math.max(0, entry.hours - 8);

    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: sara.id, date } },
      update: {
        status: entry.status,
        hours: entry.hours,
        overtimeHours: overtime,
        checkIn: entry.hours > 0 ? checkIn : null,
        checkOut,
        checkInLocation: 'Office · Floor 3',
      },
      create: {
        employeeId: sara.id,
        date,
        status: entry.status,
        hours: entry.hours,
        overtimeHours: overtime,
        checkIn: entry.hours > 0 ? checkIn : null,
        checkOut,
        checkInLocation: 'Office · Floor 3',
      },
    });
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
