import apiClient from '@/lib/api-client';

export interface HrKpi {
  title: string;
  value: string;
  metricText: string;
  metricType: string;
}

export interface HrFunnelRow {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HrFunnelMetric {
  label: string;
  value: string;
  highlight?: string;
}

export interface HrDepartmentHeadcount {
  name: string;
  count: number;
  percentage: number;
}

export interface HrRecentHire {
  name: string;
  role: string;
  status: string;
  date: string;
}

export interface HrDashboardData {
  periodLabel: string;
  kpis: HrKpi[];
  funnel: {
    rows: HrFunnelRow[];
    metrics: HrFunnelMetric[];
  };
  departmentHeadcount: HrDepartmentHeadcount[];
  genderSplit: { male: number; female: number; other: number };
  recentHires: HrRecentHire[];
  applicantCount: number;
}

export interface HrEmployeeOption {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
}

export type HrLetterType = 'OFFER' | 'APPOINTMENT' | 'EXPERIENCE' | 'SALARY_CERTIFICATE' | 'OTHER';

export async function fetchHrDashboard(month?: number, year?: number) {
  const { data } = await apiClient.get<{ status: string; data: HrDashboardData }>('/hr/dashboard', {
    params: { month, year },
  });
  return data.data;
}

export async function exportHrDashboard(month?: number, year?: number) {
  const response = await apiClient.get('/hr/export', {
    params: { month, year },
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hr-dashboard-${year ?? new Date().getFullYear()}-${String(month ?? new Date().getMonth() + 1).padStart(2, '0')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchHrEmployeeOptions(status: 'ACTIVE' | 'ONBOARDING' | 'OFFER_SIGNED' | 'ALL' = 'ALL') {
  const { data } = await apiClient.get<{ status: string; data: HrEmployeeOption[] }>('/hr/employees/options', {
    params: { status },
  });
  return data.data;
}

export async function generateHrLetter(payload: {
  employeeId: string;
  type: HrLetterType;
  subject?: string;
  body?: string;
  recipientEmail?: string;
}) {
  const { data } = await apiClient.post<{ status: string; data: { letterId: string; recipientEmail: string; mailMode: string } }>(
    '/hr/letters',
    payload,
  );
  return data.data;
}

export async function startOnboarding(payload: {
  employeeId: string;
  startDate: string;
  targetEndDate?: string;
}) {
  const { data } = await apiClient.post<{ status: string; data: { onboardingId: string; employeeName: string } }>(
    '/hr/onboarding',
    payload,
  );
  return data.data;
}
