import { AttendanceStatus, LeaveRequest, Prisma } from '@prisma/client';

export type TeamEmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  kpiScore: number | null;
  performanceScore: number | null;
};

export type AttendanceTableRow = {
  employeeId: string;
  name: string;
  role: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hours: number;
  isFlagged: boolean;
};

export type TeamScheduleStats = {
  pending: number;
  totalTaken: number;
  attendance: number;
  onLeaveToday: number;
  presentCount: number;
  absentCount: number;
};

export type TeamKpiMetrics = {
  sprintVelocity: number;
  bugResolution: number;
  codeReview: number;
  deliveryOnTime: number;
  teamUtilization: number;
  openTickets: number;
  documentation: number;
};

export function getTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

export function buildAttendanceTable(
  teamEmployees: TeamEmployeeRow[],
  attendancesToday: {
    employeeId: string;
    checkIn: Date | null;
    checkOut: Date | null;
    status: AttendanceStatus;
    hours: Prisma.Decimal | null;
    isFlagged: boolean;
  }[],
): AttendanceTableRow[] {
  const attendanceMap = new Map(attendancesToday.map((a) => [a.employeeId, a]));

  return teamEmployees.map((emp) => {
    const att = attendanceMap.get(emp.id);
    return {
      employeeId: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      role: emp.designation || 'Staff',
      checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
      checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
      status: att?.status || 'ABSENT',
      hours: att?.hours ? Number(att.hours) : 0,
      isFlagged: att?.isFlagged || false,
    };
  });
}

export function isLeaveActiveOnDate(leave: Pick<LeaveRequest, 'startDate' | 'endDate'>, day: Date): boolean {
  const dayTime = day.getTime();
  const start = new Date(leave.startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(leave.endDate);
  end.setUTCHours(23, 59, 59, 999);
  return dayTime >= start.getTime() && dayTime <= end.getTime();
}

export function computeTeamScheduleStats(
  attendanceTable: AttendanceTableRow[],
  approvedTeamLeaves: LeaveRequest[],
  pendingLeaveCount: number,
  today: Date,
): TeamScheduleStats {
  const totalEmployees = attendanceTable.length;
  const presentCount = attendanceTable.filter(
    (row) => row.status === 'PRESENT' || row.status === 'LATE',
  ).length;

  const onLeaveEmployeeIds = new Set(
    attendanceTable.filter((row) => row.status === 'LEAVE').map((row) => row.employeeId),
  );

  for (const leave of approvedTeamLeaves) {
    if (isLeaveActiveOnDate(leave, today)) {
      onLeaveEmployeeIds.add(leave.employeeId);
    }
  }

  const onLeaveToday = onLeaveEmployeeIds.size;
  const absentCount = attendanceTable.filter((row) => row.status === 'ABSENT').length;
  const attendance =
    totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  return {
    pending: pendingLeaveCount,
    totalTaken: approvedTeamLeaves.length,
    attendance,
    onLeaveToday,
    presentCount,
    absentCount,
  };
}

export function computeTeamKpis(
  members: Pick<TeamEmployeeRow, 'kpiScore' | 'performanceScore'>[],
  teamSchedule: TeamScheduleStats,
  pendingLeaveCount: number,
  fallbackBenchmark: { kpi: number; performance: number } = { kpi: 0, performance: 0 }
): TeamKpiMetrics {
  const scoredMembers = members.filter(
    (member) => member.kpiScore != null || member.performanceScore != null,
  );

  const avgKpi =
    scoredMembers.length > 0
      ? Math.round(
          scoredMembers.reduce((sum, member) => sum + (member.kpiScore ?? member.performanceScore ?? 0), 0) /
            scoredMembers.length,
        )
      : fallbackBenchmark.kpi;

  const avgPerformance =
    scoredMembers.length > 0
      ? Math.round(
          scoredMembers.reduce(
            (sum, member) => sum + (member.performanceScore ?? member.kpiScore ?? 0),
            0,
          ) / scoredMembers.length,
        )
      : fallbackBenchmark.performance;

  return {
    sprintVelocity: avgKpi,
    bugResolution: avgPerformance,
    codeReview: Math.round((avgKpi + avgPerformance) / 2),
    deliveryOnTime: avgPerformance,
    teamUtilization: teamSchedule.attendance,
    openTickets: pendingLeaveCount,
    documentation: avgKpi > 0 ? Math.min(100, Math.round(avgKpi * 0.9)) : 0,
  };
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return '""';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return `"${text}"`;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

export type TeamKpiReport = {
  teamId: string;
  teamName: string;
  memberCount: number;
  managerName: string | null;
  schedule: TeamScheduleStats;
  kpis: TeamKpiMetrics;
};

export function buildTeamKpiReportCsv(reports: TeamKpiReport[]): string {
  const now = new Date();
  const dateIso = now.toISOString();
  const dateFormatted = dateIso.replace('T', ' ').substring(0, 16) + ' UTC';

  const rows: string[] = [];

  // 1. REPORT METADATA HEADER BLOCK
  rows.push(csvRow(['ANTROSYS 360 ERP — TEAM PERFORMANCE & KPI ANALYTICS REPORT']));
  rows.push(csvRow(['Report Ref', `KPI-RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`]));
  rows.push(csvRow(['Generated Date', dateFormatted]));
  rows.push(csvRow(['Total Teams Included', reports.length]));
  rows.push('');

  // 2. EXECUTIVE TABULAR SUMMARY TABLE (Excel & BI Ready)
  rows.push(csvRow(['EXECUTIVE SUMMARY DATASET']));
  rows.push(
    csvRow([
      'Team Name',
      'Manager',
      'Team Size',
      'Attendance Rate (%)',
      'Present Count',
      'Absent Count',
      'On Leave Count',
      'Pending Leaves',
      'Sprint Velocity (%)',
      'Bug Resolution (%)',
      'Code Review (%)',
      'Delivery On Time (%)',
      'Team Utilization (%)',
      'Open Tickets',
      'Documentation Score (%)',
      'Overall Team KPI (%)',
    ]),
  );

  let grandTotalMembers = 0;
  let grandTotalPresent = 0;
  let grandTotalAbsent = 0;
  let grandTotalOnLeave = 0;
  let grandTotalPending = 0;

  for (const report of reports) {
    const kpiAvg = Math.round(
      (report.kpis.sprintVelocity + report.kpis.bugResolution + report.kpis.codeReview) / 3,
    );

    grandTotalMembers += report.memberCount;
    grandTotalPresent += report.schedule.presentCount;
    grandTotalAbsent += report.schedule.absentCount;
    grandTotalOnLeave += report.schedule.onLeaveToday;
    grandTotalPending += report.schedule.pending;

    rows.push(
      csvRow([
        report.teamName,
        report.managerName ?? 'Unassigned',
        report.memberCount,
        `${report.schedule.attendance}%`,
        report.schedule.presentCount,
        report.schedule.absentCount,
        report.schedule.onLeaveToday,
        report.schedule.pending,
        `${report.kpis.sprintVelocity}%`,
        `${report.kpis.bugResolution}%`,
        `${report.kpis.codeReview}%`,
        `${report.kpis.deliveryOnTime}%`,
        `${report.kpis.teamUtilization}%`,
        report.kpis.openTickets,
        `${report.kpis.documentation}%`,
        `${kpiAvg}%`,
      ]),
    );
  }

  // 3. DEPARTMENT TOTALS / AGGREGATES ROW
  const deptAvgKpi =
    reports.length > 0
      ? Math.round(
          reports.reduce(
            (sum, r) => sum + (r.kpis.sprintVelocity + r.kpis.bugResolution + r.kpis.codeReview) / 3,
            0,
          ) / reports.length,
        )
      : 0;

  const deptAttendanceRate =
    grandTotalMembers > 0 ? Math.round((grandTotalPresent / grandTotalMembers) * 100) : 0;

  rows.push(
    csvRow([
      'DEPARTMENT OVERALL TOTALS',
      '—',
      grandTotalMembers,
      `${deptAttendanceRate}%`,
      grandTotalPresent,
      grandTotalAbsent,
      grandTotalOnLeave,
      grandTotalPending,
      '—',
      '—',
      '—',
      '—',
      '—',
      '—',
      '—',
      `${deptAvgKpi}%`,
    ]),
  );

  rows.push('');
  rows.push(csvRow(['DETAILED TEAM BREAKDOWN CARDS']));

  // 4. PER-TEAM DETAILED SNAPSHOT SECTIONS
  for (const report of reports) {
    const kpiAvg = Math.round(
      (report.kpis.sprintVelocity + report.kpis.bugResolution + report.kpis.codeReview) / 3,
    );

    rows.push(csvRow(['==================================================']));
    rows.push(csvRow(['TEAM NAME', report.teamName]));
    rows.push(csvRow(['Team ID', report.teamId]));
    rows.push(csvRow(['Manager', report.managerName ?? 'Unassigned']));
    rows.push(csvRow(['Member Count', report.memberCount]));
    rows.push(csvRow(['Overall Team KPI Rating', `${kpiAvg}%`]));
    rows.push('');
    rows.push(csvRow(['ATTENDANCE SNAPSHOT (TODAY)']));
    rows.push(csvRow(['Present Count', report.schedule.presentCount]));
    rows.push(csvRow(['Absent Count', report.schedule.absentCount]));
    rows.push(csvRow(['On Leave Count', report.schedule.onLeaveToday]));
    rows.push(csvRow(['Attendance Rate', `${report.schedule.attendance}%`]));
    rows.push(csvRow(['Pending Leave Requests', report.schedule.pending]));
    rows.push(csvRow(['Approved Leaves (Active/Future)', report.schedule.totalTaken]));
    rows.push('');
    rows.push(csvRow(['PERFORMANCE & KPI METRICS']));
    rows.push(csvRow(['Sprint Velocity', `${report.kpis.sprintVelocity}%`]));
    rows.push(csvRow(['Bug Resolution', `${report.kpis.bugResolution}%`]));
    rows.push(csvRow(['Code Review Rate', `${report.kpis.codeReview}%`]));
    rows.push(csvRow(['Delivery On Time', `${report.kpis.deliveryOnTime}%`]));
    rows.push(csvRow(['Team Utilization', `${report.kpis.teamUtilization}%`]));
    rows.push(csvRow(['Open Tickets (Pending Leaves)', report.kpis.openTickets]));
    rows.push(csvRow(['Documentation Score', `${report.kpis.documentation}%`]));
    rows.push('');
  }

  rows.push(csvRow(['==================================================']));
  rows.push(csvRow(['CONFIDENTIAL — FOR INTERNAL MANAGEMENT USE ONLY — ANTROSYS 360 ERP']));

  return rows.join('\r\n');
}
