import { Department, EmploymentStatus, Gender, PayslipStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  ListEmployeesQuery,
  UpdatePersonalBody,
  UpsertSkillBody,
  EmployeePayslipsQuery,
} from './employees.schema';
import { APP_DEFAULT_CURRENCY } from '../../shared/currency/currency-constants';
import { formatCurrencyAmount, formatCurrencyCompact } from '../../shared/currency/format-currency';
import { buildPayslipPdf } from '../../shared/pdf/payslip-pdf';

const DEPARTMENT_ALIASES: Record<string, Department> = {
  engineering: 'ENGINEERING',
  operations: 'OPERATIONS',
  sales: 'SALES',
  finance: 'FINANCE',
  hr: 'HR',
  other: 'OTHER',
  unassigned: 'OTHER',
};

function normalizeDepartment(value: string): Department | undefined {
  const key = value.trim().toLowerCase().replace(/\s+dept$/i, '');
  if (DEPARTMENT_ALIASES[key]) return DEPARTMENT_ALIASES[key];
  const upper = value.trim().toUpperCase().replace(/\s+/g, '_');
  if (upper in DEPARTMENT_ALIASES) return DEPARTMENT_ALIASES[upper.toLowerCase()];
  return Object.values(Department).find((d) => d === upper) as Department | undefined;
}

function normalizeGender(value: string): Gender | undefined {
  const map: Record<string, Gender> = {
    male: 'MALE',
    female: 'FEMALE',
    other: 'OTHER',
    'prefer not to say': 'PREFER_NOT_TO_SAY',
  };
  const key = value.trim().toLowerCase();
  if (map[key]) return map[key];
  return Object.values(Gender).find((g) => g === value.toUpperCase()) as Gender | undefined;
}

function normalizeEmploymentStatus(value: string): EmploymentStatus | undefined {
  const map: Record<string, EmploymentStatus> = {
    active: 'ACTIVE',
    onboarding: 'ONBOARDING',
    'offer signed': 'OFFER_SIGNED',
    offer_signed: 'OFFER_SIGNED',
    offboarding: 'OFFBOARDING',
    terminated: 'TERMINATED',
  };
  const key = value.trim().toLowerCase();
  if (map[key]) return map[key];
  return Object.values(EmploymentStatus).find((s) => s === value.toUpperCase()) as EmploymentStatus | undefined;
}

// ============================================================================
// LIST – all employees (grouped by department on the frontend)
// ============================================================================

export async function listEmployees(query: ListEmployeesQuery) {
  const where: Record<string, unknown> = {};
  if (query.department) {
    const department = normalizeDepartment(query.department);
    if (department) where.department = department;
  }
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
        isActive: true,
        user: { select: { email: true } },
      },
      orderBy: [{ department: 'asc' }, { firstName: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page: query.page, limit: query.limit };
}

// ============================================================================
// GET BY ID – full employee profile (hero banner + personal tab)
// ============================================================================

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, role: true, isActive: true },
      },
      manager: {
        select: { id: true, firstName: true, lastName: true },
      },
      skills: {
        orderBy: { createdAt: 'asc' },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  return employee;
}

// ============================================================================
// UPDATE – personal / employment fields
// ============================================================================

export async function updateEmployee(id: string, data: UpdatePersonalBody) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }
  if (data.department) {
    const department = normalizeDepartment(data.department);
    if (department) updateData.department = department;
    else delete updateData.department;
  }
  if (data.gender) {
    const gender = normalizeGender(data.gender);
    if (gender) updateData.gender = gender;
    else delete updateData.gender;
  }
  if (data.employmentStatus) {
    const employmentStatus = normalizeEmploymentStatus(data.employmentStatus);
    if (employmentStatus) updateData.employmentStatus = employmentStatus;
    else delete updateData.employmentStatus;
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });

  return updated;
}

// ============================================================================
// SKILLS – add / update
// ============================================================================

export async function upsertSkill(employeeId: string, data: UpsertSkillBody) {
  // Check if skill with same name already exists for this employee
  const existing = await prisma.employeeSkill.findFirst({
    where: { employeeId, skillName: data.skillName },
  });

  if (existing) {
    return prisma.employeeSkill.update({
      where: { id: existing.id },
      data: { percentage: data.percentage ?? null },
    });
  }

  return prisma.employeeSkill.create({
    data: {
      employeeId,
      skillName: data.skillName,
      percentage: data.percentage ?? null,
    },
  });
}

// ============================================================================
// SKILLS – delete
// ============================================================================

export async function deleteSkill(employeeId: string, skillId: string) {
  // Verify the skill belongs to this employee before deleting
  const skill = await prisma.employeeSkill.findFirst({
    where: { id: skillId, employeeId },
  });

  if (!skill) return null;

  await prisma.employeeSkill.delete({ where: { id: skillId } });
  return skill;
}

// ============================================================================
// PAYSLIPS – list by year
// ============================================================================

const PAYSLIP_STATUS_LABEL: Record<PayslipStatus, string> = {
  PROCESSING: 'Processing',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const PAYSLIP_STATUS_COLOR: Record<PayslipStatus, string> = {
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-100',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-rose-50 text-rose-500 border-rose-100',
};

function payslipPeriodLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function getEmployeePayslips(employeeId: string, query: EmployeePayslipsQuery) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) return null;

  const allPayslips = await prisma.employeePayslip.findMany({
    where: { employeeId, status: { not: 'CANCELLED' } },
    select: { periodMonth: true, currencyCode: true },
    orderBy: { periodMonth: 'desc' },
  });

  const availableYears = [
    ...new Set(allPayslips.map((p) => new Date(p.periodMonth).getUTCFullYear())),
  ].sort((a, b) => b - a);

  const selectedYear =
    availableYears.length > 0 && !availableYears.includes(query.year)
      ? availableYears[0]
      : query.year;

  const yearStart = new Date(Date.UTC(selectedYear, 0, 1));
  const yearEnd = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));

  const payslips = await prisma.employeePayslip.findMany({
    where: {
      employeeId,
      periodMonth: { gte: yearStart, lte: yearEnd },
      status: { not: 'CANCELLED' },
    },
    orderBy: { periodMonth: 'desc' },
  });

  const currencyCode = payslips[0]?.currencyCode ?? APP_DEFAULT_CURRENCY;

  let ytdGross = 0;
  let ytdDeductions = 0;
  let ytdNet = 0;
  for (const p of payslips) {
    ytdGross += Number(p.grossAmount);
    ytdDeductions += Number(p.deductionsAmount);
    ytdNet += Number(p.netAmount);
  }

  return {
    availableYears: availableYears.length > 0 ? availableYears : [selectedYear],
    selectedYear,
    currencyCode,
    rows: payslips.map((p) => ({
      id: p.id,
      month: payslipPeriodLabel(new Date(p.periodMonth)),
      gross: formatCurrencyAmount(Number(p.grossAmount), p.currencyCode),
      deductions: formatCurrencyAmount(Number(p.deductionsAmount), p.currencyCode),
      tax: formatCurrencyAmount(Number(p.taxAmount), p.currencyCode),
      net: formatCurrencyAmount(Number(p.netAmount), p.currencyCode),
      status: PAYSLIP_STATUS_LABEL[p.status],
      color: PAYSLIP_STATUS_COLOR[p.status],
      downloadable: true,
    })),
    ytd: {
      gross: formatCurrencyCompact(ytdGross, currencyCode),
      deductions: formatCurrencyCompact(ytdDeductions, currencyCode),
      net: formatCurrencyCompact(ytdNet, currencyCode),
    },
  };
}

// ============================================================================
// PAYSLIPS – download PDF
// ============================================================================

export async function downloadEmployeePayslip(employeeId: string, payslipId: string) {
  const payslip = await prisma.employeePayslip.findFirst({
    where: { id: payslipId, employeeId },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: true,
          designation: true,
        },
      },
    },
  });

  if (!payslip) return null;

  const employeeName = `${payslip.employee.firstName} ${payslip.employee.lastName}`;
  const periodLabel = payslipPeriodLabel(new Date(payslip.periodMonth));
  const filename = `payslip-${payslip.employee.employeeCode ?? employeeId}-${periodLabel.replace(/\s+/g, '-')}.pdf`;

  const buffer = await buildPayslipPdf({
    employeeName,
    employeeCode: payslip.employee.employeeCode,
    department: payslip.employee.department?.replace(/_/g, ' ') ?? null,
    designation: payslip.employee.designation,
    periodLabel,
    grossAmount: Number(payslip.grossAmount),
    deductionsAmount: Number(payslip.deductionsAmount),
    taxAmount: Number(payslip.taxAmount),
    netAmount: Number(payslip.netAmount),
    currencyCode: payslip.currencyCode,
    status: PAYSLIP_STATUS_LABEL[payslip.status],
    generatedAt: new Date(),
  });

  return { buffer, filename };
}
