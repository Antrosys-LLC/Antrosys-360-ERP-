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
  attendanceToday: {
    currentTime: string;
    location: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    overtime: string;
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
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
    initials: string;
    name: string;
    message: string;
    time: string;
  }[];
  calendarMonth: CalendarMonthData;
  upcomingHolidays: {
    id: string;
    month: string;
    day: string;
    title: string;
    subtitle: string;
    highlighted: boolean;
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

export async function downloadEmployeePayslip(payslipId: string) {
  const response = await apiClient.get(`/employee/dashboard/payslip/${payslipId}/download`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}
