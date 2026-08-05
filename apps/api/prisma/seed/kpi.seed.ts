import { PrismaClient, Prisma, KpiStatus, Department } from '@prisma/client';

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function currentQuarter(): string {
  const now = new Date();
  return `Q${Math.min(4, Math.floor(now.getUTCMonth() / 3) + 1)}`;
}

type KpiSeedRow = {
  name: string;
  description: string;
  department: Department;
  unit: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  status: KpiStatus;
  trend: number[];
  quarter: string;
};

const KPI_ROWS: KpiSeedRow[] = [
  {
    name: 'Revenue Growth',
    description: 'Quarterly recurring revenue growth against board target.',
    department: Department.SALES,
    unit: 'M',
    targetValue: 2.5,
    currentValue: 2.4,
    progress: 96,
    status: KpiStatus.ON_TRACK,
    trend: [40, 50, 60, 75, 85, 95],
    quarter: currentQuarter(),
  },
  {
    name: 'Client Retention',
    description: 'Share of active clients renewed or retained in the period.',
    department: Department.SALES,
    unit: '%',
    targetValue: 95,
    currentValue: 98.5,
    progress: 100,
    status: KpiStatus.EXCEEDED,
    trend: [70, 75, 72, 85, 90, 98],
    quarter: currentQuarter(),
  },
  {
    name: 'Engineering Velocity',
    description: 'Story points delivered per sprint versus target.',
    department: Department.ENGINEERING,
    unit: 'pts',
    targetValue: 65,
    currentValue: 42,
    progress: 64,
    status: KpiStatus.OFF_TRACK,
    trend: [80, 70, 55, 45, 40, 42],
    quarter: currentQuarter(),
  },
  {
    name: 'Marketing ROI',
    description: 'Return on marketing spend (revenue per 1x spend).',
    department: Department.SALES,
    unit: 'x',
    targetValue: 3,
    currentValue: 2.1,
    progress: 70,
    status: KpiStatus.AT_RISK,
    trend: [45, 50, 55, 60, 65, 70],
    quarter: currentQuarter(),
  },
  {
    name: 'System Uptime',
    description: 'Operational uptime of production systems.',
    department: Department.OPERATIONS,
    unit: '%',
    targetValue: 99.9,
    currentValue: 99.9,
    progress: 100,
    status: KpiStatus.ON_TRACK,
    trend: [99.8, 99.9, 99.7, 99.9, 99.9, 99.9],
    quarter: currentQuarter(),
  },
  {
    name: 'Customer Satisfaction',
    description: 'Average CSAT rating across closed support tickets.',
    department: Department.OPERATIONS,
    unit: '/5',
    targetValue: 4.5,
    currentValue: 4.8,
    progress: 100,
    status: KpiStatus.ON_TRACK,
    trend: [4.2, 4.4, 4.5, 4.5, 4.7, 4.8],
    quarter: currentQuarter(),
  },
  {
    name: 'Lead Generation',
    description: 'Qualified marketing leads captured in the period.',
    department: Department.SALES,
    unit: '#',
    targetValue: 1200,
    currentValue: 840,
    progress: 70,
    status: KpiStatus.AT_RISK,
    trend: [900, 880, 850, 820, 830, 840],
    quarter: currentQuarter(),
  },
  {
    name: 'Hiring Target',
    description: 'Active hires completed against approved headcount.',
    department: Department.HR,
    unit: '#',
    targetValue: 15,
    currentValue: 12,
    progress: 80,
    status: KpiStatus.ON_TRACK,
    trend: [2, 4, 6, 8, 10, 12],
    quarter: currentQuarter(),
  },
  {
    name: 'Payroll Accuracy',
    description: 'Percentage of payslips issued without correction.',
    department: Department.FINANCE,
    unit: '%',
    targetValue: 95,
    currentValue: 98,
    progress: 100,
    status: KpiStatus.ON_TRACK,
    trend: [94, 95, 96, 97, 98, 98],
    quarter: currentQuarter(),
  },
  {
    name: 'Training Completion',
    description: 'Employees completing mandatory training on time.',
    department: Department.HR,
    unit: '%',
    targetValue: 90,
    currentValue: 82,
    progress: 91,
    status: KpiStatus.ON_TRACK,
    trend: [60, 66, 71, 75, 80, 82],
    quarter: currentQuarter(),
  },
];

export async function seedKpiData(prisma: PrismaClient) {
  console.log('📊 Seeding KPI Tracker data...');

  const year = new Date().getUTCFullYear();

  // Pick an owner employee per department when available so cards show real owners.
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, department: true, firstName: true, lastName: true },
  });
  const ownerByDepartment = new Map<Department | null, string>();
  for (const emp of employees) {
    if (emp.department && !ownerByDepartment.has(emp.department)) {
      ownerByDepartment.set(emp.department, emp.id);
    }
  }

  let created = 0;
  let skipped = 0;

  for (const row of KPI_ROWS) {
    const existing = await prisma.kpi.findFirst({
      where: { name: row.name, quarter: row.quarter, year },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.kpi.create({
      data: {
        name: row.name,
        description: row.description,
        department: row.department,
        ownerEmployeeId: ownerByDepartment.get(row.department) ?? null,
        unit: row.unit,
        targetValue: dec(row.targetValue),
        currentValue: dec(row.currentValue),
        progress: row.progress,
        status: row.status,
        trend: row.trend as Prisma.InputJsonValue,
        quarter: row.quarter,
        year,
      },
    });
    created += 1;
  }

  console.log(`   → ${created} created, ${skipped} already present (${year} ${currentQuarter()}).`);
}
