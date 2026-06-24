import apiClient from '@/lib/api-client';

export interface CfoMetric {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface CfoInvoiceSegment {
  label: string;
  count: number;
  left: number;
  color: string;
}

export interface CfoCashflowMonth {
  name: string;
  days: { label: string; activeDots: number }[];
}

export interface CfoTask {
  id: string;
  user: { name: string; role: string; avatar: string };
  action: string;
  priority: string;
  date: string;
  time: string;
}

export interface CfoActivityGroup {
  category: string;
  items: { id: string; title: string; timestamp: string }[];
}

export interface CfoEvent {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  date: string;
  unit: string;
  highlighted: boolean;
}

export interface CfoDashboardData {
  greeting: string;
  date: string;
  metrics: CfoMetric[];
  invoiceStatus: { total: number; segments: CfoInvoiceSegment[] };
  cashflowSummary: { percentage: string; periodLabel: string };
}

export async function fetchCfoDashboard(invoicePeriod = 'month') {
  const { data } = await apiClient.get<{ status: string; data: CfoDashboardData }>(
    '/cfo/dashboard',
    { params: { invoicePeriod } },
  );
  return data.data;
}

export async function fetchCfoCashflow(period: string, offset: number) {
  const { data } = await apiClient.get<{
    status: string;
    data: {
      percentage: string;
      periodLabel: string;
      months: CfoCashflowMonth[];
    };
  }>('/cfo/cashflow', { params: { period, offset } });
  return data.data;
}

export async function fetchCfoInvoiceStatus(period: string) {
  const { data } = await apiClient.get<{
    status: string;
    data: { total: number; segments: CfoInvoiceSegment[] };
  }>('/cfo/invoice-status', { params: { period } });
  return data.data;
}

export async function fetchCfoTasks() {
  const { data } = await apiClient.get<{ status: string; data: CfoTask[] }>('/cfo/tasks');
  return data.data;
}

export async function fetchCfoActivities() {
  const { data } = await apiClient.get<{ status: string; data: CfoActivityGroup[] }>(
    '/cfo/activities',
  );
  return data.data;
}

export async function fetchCfoEvents(calendarOffset: number) {
  const { data } = await apiClient.get<{
    status: string;
    data: {
      calendar: { label: string; days: { day: string; num: number; active: boolean }[] };
      events: CfoEvent[];
    };
  }>('/cfo/events', { params: { calendarOffset } });
  return data.data;
}

export async function acceptCfoTask(taskId: string) {
  const { data } = await apiClient.patch(`/cfo/tasks/${taskId}/accept`);
  return data;
}

export async function cancelCfoTask(taskId: string) {
  const { data } = await apiClient.patch(`/cfo/tasks/${taskId}/cancel`);
  return data;
}

export async function exportCfoReport(fromDate: string, toDate: string) {
  const response = await apiClient.get('/cfo/export', {
    params: { fromDate, toDate },
    responseType: 'blob',
  });
  return response.data as Blob;
}
