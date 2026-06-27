import apiClient from '@/lib/api-client';

export interface BIReport {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  iconType: 'trend' | 'pipeline' | 'target' | 'turnover';
  isFavourite: boolean;
  isShared: boolean;
  config?: any;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface BISchedule {
  id: string;
  reportId: string;
  title: string;
  info: string;
  cronExpression: string;
  deliveryMethod: 'email' | 'pdf';
  isActive: boolean;
  icon: 'mail' | 'pdf';
}

export interface BIExecution {
  id: string;
  name: string;
  duration: string;
  status: string;
  failed: boolean;
  runAt: string;
}

export interface BIMiniMetric {
  title: string;
  lastRun: string;
  borderClass: string;
  sparklinePoints: string;
}

export interface BIDashboardData {
  reports: BIReport[];
  schedules: BISchedule[];
  recentActivity: BIExecution[];
  miniMetrics: BIMiniMetric[];
}

export async function fetchBiDashboard() {
  const { data } = await apiClient.get<{ status: string; data: BIDashboardData }>('/biz-intel');
  return data.data;
}

export async function fetchChartPreview(xAxis: string, yAxisList: string[]) {
  const { data } = await apiClient.get<{ status: string; data: any[] }>('/biz-intel/builder/chart-data', {
    params: {
      xAxis,
      yAxis: yAxisList.join(','),
    },
  });
  return data.data;
}

export async function createReport(report: {
  title: string;
  description?: string;
  category: string;
  iconType: 'trend' | 'pipeline' | 'target' | 'turnover';
  isFavourite?: boolean;
  isShared?: boolean;
  config?: any;
}) {
  const { data } = await apiClient.post<{ status: string; data: BIReport }>('/biz-intel/reports', report);
  return data.data;
}

export async function runReport(reportId: string) {
  const { data } = await apiClient.post<{ status: string; data: BIExecution }>(`/biz-intel/reports/${reportId}/run`);
  return data.data;
}

export async function toggleFavourite(reportId: string, isFavourite: boolean) {
  const { data } = await apiClient.post<{ status: string; data: BIReport }>(`/biz-intel/reports/${reportId}/favourite`, {
    isFavourite,
  });
  return data.data;
}

export async function deleteReport(reportId: string) {
  const { data } = await apiClient.delete<{ status: string; data: { id: string } }>(`/biz-intel/reports/${reportId}`);
  return data.data;
}

export async function createSchedule(schedule: {
  reportId: string;
  title: string;
  cronExpression: string;
  info: string;
  deliveryMethod: 'email' | 'pdf';
}) {
  const { data } = await apiClient.post<{ status: string; data: BISchedule }>('/biz-intel/schedules', schedule);
  return data.data;
}

export async function deleteSchedule(scheduleId: string) {
  const { data } = await apiClient.delete<{ status: string; data: { id: string } }>(`/biz-intel/schedules/${scheduleId}`);
  return data.data;
}
