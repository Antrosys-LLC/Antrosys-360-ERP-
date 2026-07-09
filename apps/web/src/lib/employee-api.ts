import apiClient from './api-client';

export interface EmployeeDashboardData {
  currentUser: {
    initials: string;
    name: string;
    title: string;
    greeting: string;
    subtitle: string;
    tenure: string;
    teamSize: number;
    location: string;
  };
  canManageTeam: boolean;
  attendanceToday: {
    currentTime: string;
    location: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    overtime: string;
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    needsMood?: boolean;
  };
  leaveBalances: {
    type: string;
    leaveType: string;
    value: number;
    bg: string;
    iconColor: string;
  }[];
  pendingLeaveRequest: {
    id: string;
    title: string;
    dateRange: string;
    status: string;
  } | null;
  latestPayslip: {
    id: string;
    label: string;
    period: string;
    netPayLabel: string;
    netPay: string;
    currencyCode: string;
    breakdownPct: number;
    legend: { label: string; color: string }[];
  } | null;
  teamAnnouncements: {
    id: string;
    title?: string;
    initials: string;
    name: string;
    message: string;
    time: string;
    isOwn?: boolean;
  }[];
  calendarMonth: CalendarMonthData;
  upcomingHolidays: {
    id: string;
    month: string;
    day: string;
    title: string;
    subtitle: string;
    highlighted: boolean;
    dateIso: string;
  }[];
}

export type DayStatus = 'present' | 'half' | 'absent' | 'holiday' | 'today' | 'none';

export interface CalendarMonthData {
  label: string;
  weekdays: string[];
  weeks: { day: number | null; status: DayStatus }[][];
  legend: { label: string; color: string }[];
}

export interface AttendanceActionResult {
  checkIn: string;
  checkOut: string;
  hours: string;
  overtime: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  location: string | null;
  needsMood?: boolean;
}

export async function fetchEmployeeDashboard() {
  const { data } = await apiClient.get<{ status: string; data: EmployeeDashboardData }>(
    '/employee/dashboard',
  );
  return data.data;
}

export async function fetchEmployeeCalendar(month: number, year: number) {
  const { data } = await apiClient.get<{ status: string; data: CalendarMonthData }>(
    '/employee/dashboard/calendar',
    { params: { month, year } },
  );
  return data.data;
}

export async function employeeCheckIn() {
  const { data } = await apiClient.post<{ status: string; data: AttendanceActionResult }>(
    '/employee/dashboard/check-in',
    {},
  );
  return data.data;
}

export async function employeeCheckOut() {
  const { data } = await apiClient.post<{ status: string; data: AttendanceActionResult }>(
    '/employee/dashboard/check-out',
    {},
  );
  return data.data;
}

export async function submitEmployeeMood(mood: 'HAPPY' | 'NEUTRAL' | 'STRESSED') {
  const { data } = await apiClient.post<{ status: string; data: { mood: string; submitted: boolean } }>(
    '/employee/dashboard/mood',
    { mood },
  );
  return data.data;
}

export async function createTeamAnnouncement(body: { title: string; content: string }) {
  const { data } = await apiClient.post('/employee/dashboard/announcements', body);
  return data.data;
}

export async function updateTeamAnnouncement(id: string, body: { title: string; content: string }) {
  const { data } = await apiClient.patch(`/employee/dashboard/announcements/${id}`, body);
  return data.data;
}

export async function deleteTeamAnnouncement(id: string) {
  await apiClient.delete(`/employee/dashboard/announcements/${id}`);
}

export async function createTeamHoliday(body: { title: string; date: string; endDate?: string }) {
  const { data } = await apiClient.post('/employee/dashboard/holidays', body);
  return data.data;
}

export async function updateTeamHoliday(id: string, body: { title: string; date: string; endDate?: string }) {
  const { data } = await apiClient.patch(`/employee/dashboard/holidays/${id}`, body);
  return data.data;
}

export async function deleteTeamHoliday(id: string) {
  await apiClient.delete(`/employee/dashboard/holidays/${id}`);
}

export async function downloadEmployeePayslip(payslipId: string) {
  const response = await apiClient.get(`/employee/dashboard/payslip/${payslipId}/download`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}
