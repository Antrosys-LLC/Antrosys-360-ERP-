import { Department, EmploymentStatus, Gender, PayslipStatus, AttendanceStatus, LeaveRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { enumOptions } from '../../shared/enum-labels';
import { normalizeDepartment, resolveDepartmentTeam } from '../../shared/department/department-utils';
import type {
  ListEmployeesQuery,
  UpdatePersonalBody,
  UpdateEmploymentBody,
  UpsertSkillBody,
  EmployeePayslipsQuery,
  ManagerOptionsQuery,
  EmployeeAttendanceQuery,
} from './employees.schema';
import { validateEmploymentDates } from '../../shared/validation/employment-dates';
import { APP_DEFAULT_CURRENCY } from '../../shared/currency/currency-constants';
import { formatCurrencyAmount, formatCurrencyCompact } from '../../shared/currency/format-currency';
import { buildPayslipPdf } from '../../shared/pdf/payslip-pdf';
import { buildExperienceCertificatePdf } from '../../shared/pdf/experience-certificate-pdf';
import { payslipPeriodLabel } from '../../shared/payslip/payslip-period-label';
import {
  buildAttendanceCalendarWeeks,
  type AttendanceDayRecord,
} from '../../shared/attendance/attendance-calendar';
import {
  formatAttendanceHours,
  formatAttendanceTime,
  formatMonthYearLabel,
  startOfUtcDay,
} from '../../shared/attendance/attendance-format';
import {
  countCalendarLegend,
  getAttendanceStatusPresentation,
  mapCalendarDayStatusToCode,
  mapCalendarDayStatusToLabel,
} from '../../shared/attendance/attendance-status-presentation';
import {
  attendanceCsvFilename,
  buildEmployeeAttendanceCsv,
} from '../../shared/attendance/attendance-csv';
import { getWorkScheduleConfig } from '../employee/EmployeeDashboard/employee_dashboard.service';

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
        select: { email: true, role: true, isActive: true, lastLoginAt: true },
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
  if (data.gender) {
    const gender = normalizeGender(data.gender);
    if (gender) updateData.gender = gender;
    else delete updateData.gender;
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { email: true, role: true, isActive: true, lastLoginAt: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });

  return updated;
}

export async function updateEmployeeEmployment(id: string, data: UpdateEmploymentBody) {
  if (data.managerId === id) {
    throw new Error('An employee cannot be their own line manager');
  }

  const existing = await prisma.employee.findUnique({
    where: { id },
    select: { joiningDate: true, probationEnd: true },
  });

  if (!existing) {
    return null;
  }

  if (data.managerId) {
    const manager = await prisma.employee.findFirst({
      where: { id: data.managerId, isActive: true },
    });
    if (!manager) {
      throw new Error('Selected line manager was not found');
    }
  }

  const effectiveJoiningDate =
    data.joiningDate !== undefined
      ? data.joiningDate
        ? new Date(data.joiningDate)
        : null
      : existing.joiningDate;
  const effectiveProbationEnd =
    data.probationEnd !== undefined
      ? data.probationEnd
        ? new Date(data.probationEnd)
        : null
      : existing.probationEnd;

  const dateValidationError = validateEmploymentDates(effectiveJoiningDate, effectiveProbationEnd);
  if (dateValidationError) {
    throw new Error(dateValidationError);
  }

  const updateData: Record<string, unknown> = {};

  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.grade !== undefined) updateData.grade = data.grade;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.employeeType !== undefined) updateData.employeeType = data.employeeType;
  if (data.contractType !== undefined) updateData.contractType = data.contractType;

  if (data.department !== undefined) {
    if (data.department === null || data.department === '') {
      updateData.department = null;
      updateData.teamId = null;
    } else {
      const department = normalizeDepartment(data.department);
      if (!department) {
        throw new Error('Invalid department value');
      }
      updateData.department = department;

      // Auto-assign to the team matching this department
      const team = await resolveDepartmentTeam(department);
      if (team) {
        updateData.teamId = team.id;
        // Only auto-assign manager if the caller didn't explicitly set one
        if (data.managerId === undefined && team.managerId) {
          updateData.managerId = team.managerId;
        }
      } else {
        // No team for this department — clear stale teamId
        updateData.teamId = null;
      }
    }
  }

  if (data.managerId !== undefined) {
    // Explicit managerId always wins over auto-assignment
    updateData.managerId = data.managerId;

    // When manager changes, sync teamId to match the new manager's team
    if (data.managerId) {
      const managersTeam = await prisma.team.findFirst({
        where: { managerId: data.managerId },
        select: { id: true },
      });
      updateData.teamId = managersTeam?.id ?? null;
    } else {
      updateData.teamId = null;
    }
  }

  if (data.employmentStatus !== undefined) {
    if (data.employmentStatus === null || data.employmentStatus === '') {
      // employmentStatus is required in the schema; ignore empty clears
    } else {
      const employmentStatus = normalizeEmploymentStatus(data.employmentStatus);
      if (!employmentStatus) {
        throw new Error('Invalid employment status value');
      }
      updateData.employmentStatus = employmentStatus;
    }
  }

  if (data.joiningDate) {
    updateData.joiningDate = new Date(data.joiningDate);
  } else if (data.joiningDate === null) {
    updateData.joiningDate = null;
  }

  if (data.probationEnd) {
    updateData.probationEnd = new Date(data.probationEnd);
  } else if (data.probationEnd === null) {
    updateData.probationEnd = null;
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { email: true, role: true, isActive: true, lastLoginAt: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });

  return updated;
}

export async function listManagerOptions(query: ManagerOptionsQuery) {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      user: { role: { not: 'EMPLOYEE' } },
      ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  return employees.map((employee) => ({
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    designation: employee.designation,
    department: employee.department,
  }));
}

export async function getEmploymentFieldOptions() {
  const [contractTypeRows, employeeTypeRows] = await Promise.all([
    prisma.employee.findMany({
      where: { contractType: { not: null } },
      select: { contractType: true },
      distinct: ['contractType'],
      orderBy: { contractType: 'asc' },
    }),
    prisma.employee.findMany({
      where: { employeeType: { not: null } },
      select: { employeeType: true },
      distinct: ['employeeType'],
      orderBy: { employeeType: 'asc' },
    }),
  ]);

  return {
    departments: enumOptions(Object.values(Department)),
    employmentStatuses: enumOptions(Object.values(EmploymentStatus)),
    contractTypes: contractTypeRows
      .map((row) => row.contractType)
      .filter((value): value is string => Boolean(value?.trim())),
    employeeTypes: employeeTypeRows
      .map((row) => row.employeeType)
      .filter((value): value is string => Boolean(value?.trim())),
  };
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

export async function getEmployeePayslips(employeeId: string, query: EmployeePayslipsQuery) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) return null;

  const allPayslips = await prisma.employeePayslip.findMany({
    where: { employeeId, status: { not: 'CANCELLED' } },
    select: { periodStart: true, currencyCode: true },
    orderBy: { periodStart: 'desc' },
  });

  const availableYears = [
    ...new Set(allPayslips.map((p) => new Date(p.periodStart).getUTCFullYear())),
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
      periodStart: { gte: yearStart, lte: yearEnd },
      status: { not: 'CANCELLED' },
    },
    orderBy: { periodStart: 'desc' },
  });

  const currencyCode = payslips[0]?.currencyCode ?? APP_DEFAULT_CURRENCY;

  let ytdGross = 0;
  let ytdDeductions = 0;
  let ytdNet = 0;
  for (const p of payslips) {
    ytdGross += Number(p.grossPay);
    ytdDeductions += Number(p.deductionsTotal);
    ytdNet += Number(p.netPay);
  }

  return {
    availableYears: availableYears.length > 0 ? availableYears : [selectedYear],
    selectedYear,
    currencyCode,
    rows: payslips.map((p) => ({
      id: p.id,
      month: payslipPeriodLabel(new Date(p.periodStart)),
      gross: formatCurrencyAmount(Number(p.grossPay), p.currencyCode),
      deductions: formatCurrencyAmount(Number(p.deductionsTotal), p.currencyCode),
      tax: formatCurrencyAmount(Number(p.taxAmount), p.currencyCode),
      net: formatCurrencyAmount(Number(p.netPay), p.currencyCode),
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
          employeeType: true,
          location: true,
          joiningDate: true,
        },
      },
      payroll: {
        select: {
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  if (!payslip) return null;

  const employee = payslip.employee;
  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const periodLabel = payslipPeriodLabel(new Date(payslip.periodStart));
  const periodStart = payslip.payroll?.periodStart ?? payslip.periodStart;
  const periodEnd = payslip.payroll?.periodEnd ?? payslip.periodEnd;

  const filename = `payslip-${employee.employeeCode ?? employeeId}-${periodLabel.replace(/\s+/g, '-')}.pdf`;

  const lineItem = await prisma.payrollLineItem.findUnique({
    where: { payslipId: payslip.id },
    select: {
      baseSalary: true,
      allowances: true,
      overtime: true,
      bonuses: true,
      incomeTax: true,
      providentFund: true,
      healthInsurance: true,
    },
  });

  const year = new Date(payslip.periodStart).getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const yearPayslips = await prisma.employeePayslip.findMany({
    where: {
      employeeId,
      periodStart: { gte: yearStart, lte: yearEnd },
    },
    select: { grossPay: true, deductionsTotal: true, netPay: true },
  });
  let ytdGross = 0;
  let ytdDeductions = 0;
  let ytdNet = 0;
  for (const p of yearPayslips) {
    ytdGross += Number(p.grossPay);
    ytdDeductions += Number(p.deductionsTotal);
    ytdNet += Number(p.netPay);
  }

  const monthStr = String(periodStart.getMonth() + 1).padStart(2, '0');
  const yearStr = String(periodStart.getFullYear());
  const payslipNumber = `PSL-${employee.employeeCode ?? 'EMP'}-${monthStr}${yearStr}`;

  const buffer = await buildPayslipPdf({
    employeeName,
    employeeCode: employee.employeeCode,
    department: employee.department?.replace(/_/g, ' ') ?? null,
    designation: employee.designation,
    employeeType: employee.employeeType ?? null,
    workLocation: employee.location ?? null,
    joiningDate: employee.joiningDate,
    periodStart,
    periodEnd,
    periodLabel,
    payslipNumber,
    paymentDate: payslip.paidAt ?? payslip.createdAt,
    currencyCode: payslip.currencyCode,
    status: PAYSLIP_STATUS_LABEL[payslip.status],
    basicSalary: Number(lineItem?.baseSalary ?? payslip.grossPay),
    allowances: Number(lineItem?.allowances ?? 0),
    overtime: Number(lineItem?.overtime ?? 0),
    bonuses: Number(lineItem?.bonuses ?? 0),
    grossPay: Number(payslip.grossPay),
    incomeTax: Number(lineItem?.incomeTax ?? payslip.taxAmount),
    providentFund: Number(lineItem?.providentFund ?? 0),
    healthInsurance: Number(lineItem?.healthInsurance ?? 0),
    deductionsTotal: Number(payslip.deductionsTotal),
    netPay: Number(payslip.netPay),
    ytdGross,
    ytdDeductions,
    ytdNet,
  });

  return { buffer, filename };
}

// ============================================================================
// ATTENDANCE – monthly logs + CSV export
// ============================================================================

function attendanceMonthBounds(month: number, year: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return { monthStart, monthEnd };
}

function attendanceMonthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function addAttendanceMonthsToSet(
  monthKeys: Set<string>,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
) {
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    monthKeys.add(attendanceMonthKey(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
}

function listAvailableAttendanceMonths(joiningDate: Date | null) {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;

  let startYear = endYear;
  let startMonth = endMonth - 11;
  while (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }

  if (joiningDate) {
    const joinYear = joiningDate.getUTCFullYear();
    const joinMonth = joiningDate.getUTCMonth() + 1;
    if (joinYear > startYear || (joinYear === startYear && joinMonth > startMonth)) {
      startYear = joinYear;
      startMonth = joinMonth;
    }
  }

  const monthKeys = new Set<string>();
  addAttendanceMonthsToSet(monthKeys, startYear, startMonth, endYear, endMonth);
  monthKeys.add(attendanceMonthKey(endYear, endMonth));

  return Array.from(monthKeys)
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      return { month, year, label: formatMonthYearLabel(month, year) };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function countPastWorkingDays(
  month: number,
  year: number,
  holidays: { date: Date; endDate: Date | null }[],
) {
  const today = startOfUtcDay(new Date());
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(Date.UTC(year, month - 1, day));
    if (cellDate.getTime() >= today.getTime()) continue;

    const dayOfWeek = cellDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const isHoliday = holidays.some((holiday) => {
      const start = startOfUtcDay(holiday.date).getTime();
      const end = startOfUtcDay(holiday.endDate ?? holiday.date).getTime();
      const current = cellDate.getTime();
      return current >= start && current <= end;
    });

    if (!isHoliday) count += 1;
  }

  return count;
}

async function leaveDayNumbersForMonth(
  employeeId: string,
  month: number,
  year: number,
): Promise<Set<number>> {
  const { monthStart, monthEnd } = attendanceMonthBounds(month, year);
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: LeaveRequestStatus.APPROVED,
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    select: { startDate: true, endDate: true },
  });

  const days = new Set<number>();
  for (const leave of leaves) {
    const start = startOfUtcDay(leave.startDate);
    const end = startOfUtcDay(leave.endDate);
    for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      if (cursor.getUTCFullYear() === year && cursor.getUTCMonth() + 1 === month) {
        days.add(cursor.getUTCDate());
      }
    }
  }
  return days;
}

async function fetchEmployeeAttendanceRecords(employeeId: string, month: number, year: number) {
  const { monthStart, monthEnd } = attendanceMonthBounds(month, year);
  return prisma.attendance.findMany({
    where: { employeeId, date: { gte: monthStart, lte: monthEnd } },
    orderBy: { date: 'desc' },
  });
}

export async function getEmployeeAttendanceLogs(employeeId: string, query: EmployeeAttendanceQuery) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, joiningDate: true },
  });

  if (!employee) {
    return null;
  }

  const schedule = await getWorkScheduleConfig();
  const halfDayThreshold = Number(schedule.halfDayThresholdHours);
  const { monthStart, monthEnd } = attendanceMonthBounds(query.month, query.year);
  const availableMonths = listAvailableAttendanceMonths(employee.joiningDate);

  const [attendanceRecords, holidays, leaveDayNumbers] = await Promise.all([
    fetchEmployeeAttendanceRecords(employeeId, query.month, query.year),
    prisma.companyHoliday.findMany({
      where: {
        OR: [
          { date: { gte: monthStart, lte: monthEnd } },
          { endDate: { gte: monthStart }, date: { lte: monthEnd } },
        ],
      },
    }),
    leaveDayNumbersForMonth(employeeId, query.month, query.year),
  ]);

  const holidayRanges = holidays.map((holiday) => ({
    date: holiday.date,
    endDate: holiday.endDate,
  }));

  const attendanceMap = new Map<number, AttendanceDayRecord>();
  for (const record of attendanceRecords) {
    attendanceMap.set(new Date(record.date).getUTCDate(), {
      status: record.status,
      hours: record.hours,
    });
  }

  const calendar = buildAttendanceCalendarWeeks(
    query.month,
    query.year,
    attendanceMap,
    holidayRanges,
    halfDayThreshold,
    leaveDayNumbers,
  );

  const profileWeeks = calendar.weeks.map((week) =>
    week.map((cell) => ({
      day: cell.day,
      code: cell.day ? mapCalendarDayStatusToCode(cell.status) : null,
      label: cell.day ? mapCalendarDayStatusToLabel(cell.status) : '',
      status: cell.status,
    })),
  );

  const rows = attendanceRecords.map((record) => {
    const date = new Date(record.date);
    const hours = record.hours ? Number(record.hours) : 0;
    const overtime = record.overtimeHours ? Number(record.overtimeHours) : 0;
    const presentation = getAttendanceStatusPresentation(record.status);

    return {
      id: record.id,
      date: date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      checkIn: formatAttendanceTime(record.checkIn),
      checkOut: formatAttendanceTime(record.checkOut),
      total: formatAttendanceHours(hours),
      ot: formatAttendanceHours(overtime),
      status: presentation.label,
      color: presentation.color,
      textColor: presentation.textColor,
    };
  });

  let totalHours = 0;
  let totalOvertime = 0;
  let attendedDays = 0;

  for (const record of attendanceRecords) {
    totalHours += record.hours ? Number(record.hours) : 0;
    totalOvertime += record.overtimeHours ? Number(record.overtimeHours) : 0;

    if (
      record.status === AttendanceStatus.PRESENT ||
      record.status === AttendanceStatus.LATE ||
      record.status === AttendanceStatus.HALF_DAY
    ) {
      attendedDays += 1;
    }
  }

  const workingDaysPast = countPastWorkingDays(query.month, query.year, holidayRanges);
  const attendancePercentage =
    workingDaysPast > 0 ? Math.round((attendedDays / workingDaysPast) * 100) : 0;

  return {
    selectedMonth: {
      month: query.month,
      year: query.year,
      label: formatMonthYearLabel(query.month, query.year),
    },
    availableMonths,
    calendar: {
      label: calendar.label,
      weekdays: calendar.weekdays,
      weeks: profileWeeks,
      legend: countCalendarLegend(calendar.weeks),
    },
    rows,
    summary: {
      totalHours: formatAttendanceHours(totalHours),
      overtimeHours: formatAttendanceHours(totalOvertime),
      attendancePercentage,
    },
  };
}

export async function exportEmployeeAttendanceCsv(
  employeeId: string,
  query: EmployeeAttendanceQuery,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      department: true,
      joiningDate: true,
    },
  });

  if (!employee) {
    return null;
  }

  const logs = await getEmployeeAttendanceLogs(employeeId, query);
  if (!logs) {
    return null;
  }

  const attendanceRecords = await fetchEmployeeAttendanceRecords(employeeId, query.month, query.year);

  let totalHours = 0;
  let totalOvertime = 0;
  for (const record of attendanceRecords) {
    totalHours += record.hours ? Number(record.hours) : 0;
    totalOvertime += record.overtimeHours ? Number(record.overtimeHours) : 0;
  }

  const csvEmployee = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    employeeCode: employee.employeeCode,
    department: employee.department,
  };

  const csv = buildEmployeeAttendanceCsv(
    csvEmployee,
    query.month,
    query.year,
    attendanceRecords,
    {
      totalHours,
      totalOvertime,
      attendancePercentage: logs.summary.attendancePercentage,
    },
  );

  return {
    csv,
    filename: attendanceCsvFilename(csvEmployee, query.month, query.year),
  };
}

// ============================================================================
// HR LETTER – download experience certificate PDF
// ============================================================================

export async function downloadEmployeeLetter(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { email: true } } },
  });

  if (!employee) return null;

  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const empCode = employee.employeeCode ?? 'N/A';
  const filename = `HR_Letter_${employeeName.replace(/\s+/g, '_')}.pdf`;

  const departmentLabel = employee.department
    ? employee.department.replace(/_/g, ' ')
    : 'N/A';

  const buffer = await buildExperienceCertificatePdf({
    employeeName,
    employeeCode: empCode,
    designation: employee.designation ?? 'N/A',
    department: departmentLabel,
    employeeType: employee.employeeType ?? 'N/A',
    contractType: employee.contractType ?? 'N/A',
    employmentStatus: employee.employmentStatus.replace(/_/g, ' '),
    joiningDate: employee.joiningDate,
    workLocation: employee.location ?? 'N/A',
    officialEmail: employee.user.email,
    contactNumber: employee.phone ?? 'N/A',
    generatedAt: new Date(),
  });

  return { buffer, filename };
}
