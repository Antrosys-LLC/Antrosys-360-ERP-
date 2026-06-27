import { Prisma, ApplicationStage, Department, EmploymentStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { buildHrLetterPdf } from '../../shared/pdf/hr-letter-pdf';
import { sendMail } from '../../shared/email/mail.service';
import type {
  DashboardQuery,
  ExportQuery,
  HrLetterBody,
  StartOnboardingBody,
  EmployeeOptionsQuery,
} from './hr.schema';

const DEPARTMENT_ORDER: Department[] = [
  'ENGINEERING',
  'OPERATIONS',
  'SALES',
  'FINANCE',
  'HR',
  'OTHER',
];

const DEPARTMENT_LABELS: Record<Department, string> = {
  ENGINEERING: 'Engineering',
  OPERATIONS: 'Operations',
  SALES: 'Sales',
  FINANCE: 'Finance',
  HR: 'HR',
  OTHER: 'Other',
};

const FUNNEL_STAGES: { stage: ApplicationStage; label: string }[] = [
  { stage: 'APPLIED', label: 'Applied' },
  { stage: 'SCREENING', label: 'Screening' },
  { stage: 'INTERVIEW', label: 'Interview' },
  { stage: 'OFFER_SENT', label: 'Offer sent' },
  { stage: 'HIRED', label: 'Hired' },
];

const ACTIVE_HEADCOUNT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'ONBOARDING', 'OFFER_SIGNED'];

function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function quarterRange(reference: Date, offset = 0) {
  const month = reference.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3 + offset * 3;
  const year = reference.getUTCFullYear() + Math.floor(quarterStartMonth / 12);
  const normalizedMonth = ((quarterStartMonth % 12) + 12) % 12;
  const start = new Date(Date.UTC(year, normalizedMonth, 1));
  const end = new Date(Date.UTC(year, normalizedMonth + 3, 0, 23, 59, 59, 999));
  return { start, end };
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSignedDelta(current: number, previous: number, suffix: string): { text: string; type: string } {
  const delta = current - previous;
  if (delta === 0) return { text: `No change ${suffix}`, type: 'info' };
  const sign = delta > 0 ? '+' : '';
  return {
    text: `${sign}${delta} ${suffix}`,
    type: delta > 0 ? 'success' : 'danger',
  };
}

function employmentStatusLabel(status: EmploymentStatus): string {
  switch (status) {
    case 'OFFER_SIGNED':
      return 'Offer signed';
    case 'ONBOARDING':
      return 'Onboarding';
    case 'ACTIVE':
      return 'Active';
    case 'OFFBOARDING':
      return 'Offboarding';
    case 'TERMINATED':
      return 'Terminated';
    default:
      return status;
  }
}

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { userId, action, metadata },
  });
}

async function countActiveHeadcount(asOf?: Date) {
  const where: Prisma.EmployeeWhereInput = {
    isActive: true,
    employmentStatus: { in: ACTIVE_HEADCOUNT_STATUSES },
  };
  if (asOf) {
    where.joiningDate = { lte: asOf };
    where.OR = [{ terminatedAt: null }, { terminatedAt: { gt: asOf } }];
  }
  return prisma.employee.count({ where });
}

async function calculateAttritionRate(start: Date, end: Date) {
  const terminations = await prisma.employee.count({
    where: { terminatedAt: { gte: start, lte: end } },
  });
  const startCount = await countActiveHeadcount(start);
  const endCount = await countActiveHeadcount(end);
  const avgHeadcount = Math.max((startCount + endCount) / 2, 1);
  return (terminations / avgHeadcount) * 100;
}

function buildLetterContent(
  type: HrLetterBody['type'],
  employee: { firstName: string; lastName: string; designation: string | null; department: Department | null },
) {
  const name = `${employee.firstName} ${employee.lastName}`;
  const role = employee.designation ?? 'Team Member';
  const dept = employee.department ? DEPARTMENT_LABELS[employee.department] : 'Antrosys';

  switch (type) {
    case 'OFFER':
      return {
        subject: `Offer Letter — ${name}`,
        body: `We are pleased to offer you the position of ${role} in our ${dept} department at Antrosys.\n\nPlease review the attached terms and confirm your acceptance at your earliest convenience.`,
      };
    case 'APPOINTMENT':
      return {
        subject: `Appointment Letter — ${name}`,
        body: `This letter confirms your appointment as ${role} in the ${dept} department, effective immediately.\n\nWe look forward to your continued contributions to Antrosys.`,
      };
    case 'EXPERIENCE':
      return {
        subject: `Experience Certificate — ${name}`,
        body: `This is to certify that ${name} was employed with Antrosys as ${role} in the ${dept} department.\n\nDuring their tenure, they demonstrated professionalism and dedication to their responsibilities.`,
      };
    case 'SALARY_CERTIFICATE':
      return {
        subject: `Salary Certificate — ${name}`,
        body: `This is to certify that ${name}, ${role} in the ${dept} department, is a full-time employee of Antrosys.\n\nThis certificate is issued upon request for official purposes.`,
      };
    default:
      return {
        subject: `HR Letter — ${name}`,
        body: `This official HR correspondence is issued for ${name}, ${role} (${dept}).`,
      };
  }
}

export async function getDashboard(query: DashboardQuery) {
  const { start: periodStart, end: periodEnd } = monthRange(query.month, query.year);
  const now = new Date();
  const { start: currentQuarterStart, end: currentQuarterEnd } = quarterRange(now, 0);
  const { start: prevQuarterStart, end: prevQuarterEnd } = quarterRange(now, -1);
  const lastMonth = monthRange(query.month === 1 ? 12 : query.month - 1, query.month === 1 ? query.year - 1 : query.year);
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const [
    openRoles,
    openRolesLastMonth,
    totalHeadcount,
    headcountQuarterStart,
    onboardingPipeline,
    onboardingStartingThisWeek,
    currentAttrition,
    previousAttrition,
    periodApplications,
    allActiveApplications,
    departmentGroups,
    genderGroups,
    recentHires,
    applicantCount,
    offersSent,
    offersAccepted,
    hiredInPeriod,
    interviewsThisWeek,
    activePipelines,
  ] = await Promise.all([
    prisma.jobPosting.count({ where: { status: 'OPEN' } }),
    prisma.jobPosting.count({
      where: {
        status: 'OPEN',
        postedAt: { lte: lastMonth.end },
        OR: [{ closedAt: null }, { closedAt: { gt: lastMonth.end } }],
      },
    }),
    countActiveHeadcount(),
    countActiveHeadcount(currentQuarterStart),
    prisma.employee.count({ where: { employmentStatus: 'ONBOARDING', isActive: true } }),
    prisma.onboardingRecord.count({
      where: { startDate: { gte: weekStart, lte: weekEnd }, status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
    }),
    calculateAttritionRate(currentQuarterStart, currentQuarterEnd),
    calculateAttritionRate(prevQuarterStart, prevQuarterEnd),
    prisma.jobApplication.findMany({
      where: { appliedAt: { gte: periodStart, lte: periodEnd } },
      select: { stage: true, appliedAt: true, hiredAt: true, offerSentAt: true, offerAcceptedAt: true },
    }),
    prisma.jobApplication.findMany({
      where: { stage: { notIn: ['REJECTED', 'WITHDRAWN'] } },
      select: { stage: true },
    }),
    prisma.employee.groupBy({
      by: ['department'],
      where: { isActive: true, employmentStatus: { in: ACTIVE_HEADCOUNT_STATUSES } },
      _count: { _all: true },
    }),
    prisma.employee.groupBy({
      by: ['gender'],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.employee.findMany({
      where: { joiningDate: { gte: periodStart, lte: periodEnd } },
      orderBy: { joiningDate: 'desc' },
      take: 10,
      select: {
        firstName: true,
        lastName: true,
        designation: true,
        employmentStatus: true,
        joiningDate: true,
      },
    }),
    prisma.jobApplication.count({
      where: { stage: { in: ['APPLIED', 'SCREENING', 'INTERVIEW'] } },
    }),
    prisma.jobApplication.count({ where: { offerSentAt: { not: null } } }),
    prisma.jobApplication.count({ where: { offerAcceptedAt: { not: null } } }),
    prisma.jobApplication.findMany({
      where: { hiredAt: { gte: periodStart, lte: periodEnd } },
      select: { appliedAt: true, hiredAt: true },
    }),
    prisma.jobApplication.count({
      where: {
        stage: 'INTERVIEW',
        interviewAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.jobPosting.count({
      where: {
        status: 'OPEN',
        applications: { some: { stage: { notIn: ['HIRED', 'REJECTED', 'WITHDRAWN'] } } },
      },
    }),
  ]);

  const openRolesDelta = formatSignedDelta(openRoles, openRolesLastMonth, 'vs last month');
  const headcountDelta = formatSignedDelta(totalHeadcount, headcountQuarterStart, 'this quarter');
  const attritionDelta = currentAttrition - previousAttrition;
  const attritionDeltaText = `${attritionDelta >= 0 ? '+' : ''}${attritionDelta.toFixed(1)}% vs last qtr`;

  const funnelSource = periodApplications.length > 0 ? periodApplications : allActiveApplications;
  const funnelTotal = funnelSource.length || 1;
  const stageCounts = FUNNEL_STAGES.map(({ stage, label }) => {
    const count = funnelSource.filter((a) => a.stage === stage).length;
    const percentage = Math.round((count / funnelTotal) * 100);
    return { label, count, percentage };
  });

  const avgTimeToHireDays =
    hiredInPeriod.length > 0
      ? Math.round(
          hiredInPeriod.reduce((sum, h) => {
            if (!h.hiredAt) return sum;
            return sum + (h.hiredAt.getTime() - h.appliedAt.getTime()) / 86400000;
          }, 0) / hiredInPeriod.length,
        )
      : 0;

  const offerAcceptanceRate = offersSent > 0 ? Math.round((offersAccepted / offersSent) * 100) : 0;

  const deptMap = new Map(departmentGroups.map((g) => [g.department, g._count._all]));
  const maxDeptCount = Math.max(...DEPARTMENT_ORDER.map((d) => deptMap.get(d) ?? 0), 1);
  const departmentHeadcount = DEPARTMENT_ORDER.map((dept) => {
    const count = deptMap.get(dept) ?? 0;
    return {
      name: DEPARTMENT_LABELS[dept],
      count,
      percentage: Math.round((count / maxDeptCount) * 100),
    };
  });

  const genderTotal = genderGroups.reduce((sum, g) => sum + g._count._all, 0) || 1;
  const genderSplit = {
    male: Math.round(((genderGroups.find((g) => g.gender === 'MALE')?._count._all ?? 0) / genderTotal) * 100),
    female: Math.round(((genderGroups.find((g) => g.gender === 'FEMALE')?._count._all ?? 0) / genderTotal) * 100),
    other: Math.round(
      (((genderGroups.find((g) => g.gender === 'OTHER')?._count._all ?? 0) +
        (genderGroups.find((g) => g.gender === 'PREFER_NOT_TO_SAY')?._count._all ?? 0)) /
        genderTotal) *
        100,
    ),
  };

  const periodLabel = new Date(Date.UTC(query.year, query.month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    periodLabel,
    kpis: [
      {
        title: 'OPEN ROLES',
        value: String(openRoles),
        metricText: openRolesDelta.text,
        metricType: openRolesDelta.type,
      },
      {
        title: 'TOTAL HEADCOUNT',
        value: String(totalHeadcount),
        metricText: headcountDelta.text,
        metricType: headcountDelta.type,
      },
      {
        title: 'ONBOARDING PIPELINE',
        value: String(onboardingPipeline),
        metricText: `${onboardingStartingThisWeek} starting this week`,
        metricType: 'info',
      },
      {
        title: 'ATTRITION RATE',
        value: formatPercent(currentAttrition),
        metricText: attritionDeltaText,
        metricType: attritionDelta > 0 ? 'danger' : 'success',
      },
    ],
    funnel: {
      rows: stageCounts.map((row, idx) => ({
        ...row,
        color: idx < 2 ? 'bg-[#7B68EE]' : idx === 2 ? 'bg-[#EEEDFE]' : idx === 3 ? 'bg-[#EEEDFE]/50' : 'bg-[#EEEDFE]/30',
      })),
      metrics: [
        { label: 'Avg. time to hire', value: avgTimeToHireDays > 0 ? `${avgTimeToHireDays} days` : '—' },
        { label: 'Offer acceptance', value: `${offerAcceptanceRate}%`, highlight: 'text-[#27500A]' },
        { label: 'Active pipelines', value: String(activePipelines) },
        { label: 'Interviews this week', value: String(interviewsThisWeek), highlight: 'text-[#534AB7]' },
      ],
    },
    departmentHeadcount,
    genderSplit,
    recentHires: recentHires.map((hire) => ({
      name: `${hire.firstName} ${hire.lastName}`,
      role: hire.designation ?? 'Staff',
      status: employmentStatusLabel(hire.employmentStatus),
      date: hire.joiningDate
        ? hire.joiningDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : '—',
    })),
    applicantCount,
  };
}

export async function buildDashboardExportCsv(query: ExportQuery) {
  const dashboard = await getDashboard(query);
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: [{ department: 'asc' }, { lastName: 'asc' }],
    select: {
      firstName: true,
      lastName: true,
      department: true,
      designation: true,
      employmentStatus: true,
      gender: true,
      joiningDate: true,
      user: { select: { email: true } },
    },
  });

  const lines = [
    'Antrosys ERP — HR Dashboard Export',
    `Period,${dashboard.periodLabel}`,
    `Generated,${new Date().toISOString()}`,
    '',
    'KPI SUMMARY',
    ...dashboard.kpis.map((k) => `${k.title},${k.value},${k.metricText}`),
    '',
    'RECRUITMENT FUNNEL',
    ...dashboard.funnel.rows.map((r) => `${r.label},${r.count},${r.percentage}%`),
    '',
    'DEPARTMENT HEADCOUNT',
    ...dashboard.departmentHeadcount.map((d) => `${d.name},${d.count}`),
    '',
    'GENDER SPLIT',
    `Male,${dashboard.genderSplit.male}%`,
    `Female,${dashboard.genderSplit.female}%`,
    `Other,${dashboard.genderSplit.other}%`,
    '',
    'RECENT HIRES',
    'Name,Role,Status,Start Date',
    ...dashboard.recentHires.map((h) => `${h.name},${h.role},${h.status},${h.date}`),
    '',
    'EMPLOYEE DIRECTORY',
    'Name,Email,Department,Designation,Status,Gender,Joining Date',
    ...employees.map((e) =>
      [
        `${e.firstName} ${e.lastName}`,
        e.user.email,
        e.department ? DEPARTMENT_LABELS[e.department] : '',
        e.designation ?? '',
        employmentStatusLabel(e.employmentStatus),
        e.gender,
        e.joiningDate?.toISOString().slice(0, 10) ?? '',
      ].join(','),
    ),
  ];

  return lines.join('\n');
}

export async function getEmployeeOptions(query: EmployeeOptionsQuery) {
  const statusFilter =
    query.status === 'ALL'
      ? { in: ACTIVE_HEADCOUNT_STATUSES }
      : query.status;

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(query.status === 'ALL'
        ? { employmentStatus: { in: ACTIVE_HEADCOUNT_STATUSES } }
        : { employmentStatus: statusFilter as EmploymentStatus }),
    },
    orderBy: { lastName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      employmentStatus: true,
      user: { select: { email: true } },
    },
  });

  return employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    role: e.designation ?? 'Staff',
    email: e.user.email,
    status: employmentStatusLabel(e.employmentStatus),
  }));
}

export async function generateAndSendHrLetter(input: HrLetterBody, userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    include: { user: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const template = buildLetterContent(input.type, employee);
  const subject = input.subject ?? template.subject;
  const body = input.body ?? template.body;
  const recipientEmail = input.recipientEmail ?? employee.user.email;
  const employeeName = `${employee.firstName} ${employee.lastName}`;

  const pdfBuffer = await buildHrLetterPdf({
    subject,
    body,
    employeeName,
    letterType: input.type,
    generatedAt: new Date(),
  });

  const filename = `hr-letter-${employee.id}-${Date.now()}.pdf`;

  const mailResult = await sendMail({
    to: recipientEmail,
    subject,
    text: `${body}\n\n— Antrosys Human Resources`,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p><p>— Antrosys Human Resources</p>`,
    attachments: [{ filename, content: pdfBuffer }],
  });

  const record = await prisma.$transaction(async (tx) => {
    const letter = await tx.hrLetter.create({
      data: {
        type: input.type,
        employeeId: employee.id,
        subject,
        body,
        generatedByUserId: userId,
      },
    });

    await writeAuditLog(tx, userId, 'HR_LETTER_GENERATE', {
      letterId: letter.id,
      employeeId: employee.id,
      type: input.type,
      recipientEmail,
      mailMode: mailResult.mode,
    });

    return letter;
  });

  return {
    letterId: record.id,
    recipientEmail,
    mailMode: mailResult.mode,
    pdfFilename: filename,
  };
}

export async function startOnboarding(input: StartOnboardingBody, userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    include: { onboarding: true, user: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (employee.onboarding && employee.onboarding.status !== 'COMPLETED') {
    throw new Error('Employee already has an active onboarding record');
  }

  const record = await prisma.$transaction(async (tx) => {
    const onboarding = await tx.onboardingRecord.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        startDate: input.startDate,
        targetEndDate: input.targetEndDate,
        createdByUserId: userId,
        checklist: {
          tasks: [
            { id: 'docs', label: 'Submit identity documents', done: false },
            { id: 'equipment', label: 'Equipment provisioning', done: false },
            { id: 'orientation', label: 'HR orientation session', done: false },
          ],
        },
      },
      update: {
        status: 'IN_PROGRESS',
        startDate: input.startDate,
        targetEndDate: input.targetEndDate,
        completedAt: null,
      },
    });

    await tx.employee.update({
      where: { id: employee.id },
      data: { employmentStatus: 'ONBOARDING' },
    });

    await writeAuditLog(tx, userId, 'HR_ONBOARDING_START', {
      onboardingId: onboarding.id,
      employeeId: employee.id,
      startDate: input.startDate.toISOString(),
    });

    return onboarding;
  });

  return {
    onboardingId: record.id,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    startDate: record.startDate.toISOString().slice(0, 10),
    status: record.status,
  };
}
