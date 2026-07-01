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
      : 0;

  const avgPerformance =
    scoredMembers.length > 0
      ? Math.round(
          scoredMembers.reduce(
            (sum, member) => sum + (member.performanceScore ?? member.kpiScore ?? 0),
            0,
          ) / scoredMembers.length,
        )
      : 0;

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

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(cells: (string | number)[]): string {
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
  const generatedAt = new Date().toISOString();
  const sections = reports.map((report) => {
    const lines = [
      csvRow(['Team KPI Report']),
      csvRow(['Team Name', report.teamName]),
      csvRow(['Team ID', report.teamId]),
      csvRow(['Team Size', report.memberCount]),
      csvRow(['Manager', report.managerName ?? 'Unassigned']),
      csvRow(['Generated At', generatedAt]),
      '',
      csvRow(['Attendance Snapshot (Today)']),
      csvRow(['Present', report.schedule.presentCount]),
      csvRow(['On Leave', report.schedule.onLeaveToday]),
      csvRow(['Absent', report.schedule.absentCount]),
      csvRow(['Attendance Rate', `${report.schedule.attendance}%`]),
      csvRow(['Pending Leave Requests', report.schedule.pending]),
      csvRow(['Approved Leaves (Active/Future)', report.schedule.totalTaken]),
      '',
      csvRow(['KPI Metrics']),
      csvRow(['Metric', 'Value']),
      csvRow(['Sprint Velocity', `${report.kpis.sprintVelocity}%`]),
      csvRow(['Bug Resolution', `${report.kpis.bugResolution}%`]),
      csvRow(['Code Review', `${report.kpis.codeReview}%`]),
      csvRow(['Delivery On Time', `${report.kpis.deliveryOnTime}%`]),
      csvRow(['Team Utilization', `${report.kpis.teamUtilization}%`]),
      csvRow(['Open Tickets (Pending Leaves)', report.kpis.openTickets]),
      csvRow(['Documentation', `${report.kpis.documentation}%`]),
    ];
    return lines.join('\n');
  });

  return sections.join('\n\n');
}
