import apiClient from '@/lib/api-client';

export type RevenueRange = 'Monthly' | 'Quarterly' | 'Annual';

export interface CeoPeriodParams {
  month?: number;
  year?: number;
  compare?: boolean;
}

export async function fetchCeoDashboard(params: CeoPeriodParams) {
  const { data } = await apiClient.get<{ status: string; data: { header: CeoHeader; kpiCards: CeoKpiCards } }>(
    '/ceo/dashboard',
    { params },
  );
  return data.data;
}

export interface CeoHeader {
  greeting: string;
  subtitle: string;
  periodLabel: string;
  badges: { id: string; label: string; value: string; tone: 'green' | 'purple' | 'orange' }[];
}

export interface CeoKpiCards {
  revenue: {
    label: string;
    compareLabel: string;
    value: string;
    deltaLabel: string;
    progressPct: number;
    footnote: string;
    sparkline: number[];
  };
  headcount: {
    label: string;
    value: number;
    deltaLabel: string;
    ringPct: string;
    ringFootnote: string;
    deptTags: { label: string; bg: string; text: string }[];
  };
  clients: {
    label: string;
    value: number;
    deltaLabel: string;
    riskTags: { label: string; bg: string; text: string }[];
    footnote: string;
  };
  burnRate: {
    label: string;
    value: string;
    deltaLabel: string;
    runwayLabel: string;
    barPct: number;
    footnote: string;
  };
}

export async function fetchCeoRevenueTrend(params: CeoPeriodParams & { range: RevenueRange }) {
  const { data } = await apiClient.get<{ status: string; data: RevenueTrendData }>('/ceo/revenue-trend', { params });
  return data.data;
}

export interface RevenueTrendData {
  totalLabel: string;
  months: string[];
  revenue: number[];
  payrollCost: number[];
  peakMonth: { label: string; value: string };
  ytd: { label: string; value: string };
  avgMonthly: { label: string; value: string };
  yoyGrowth: { label: string; value: string };
}

export async function fetchCeoCostBreakdown(params: CeoPeriodParams) {
  const { data } = await apiClient.get<{ status: string; data: CostBreakdownData }>('/ceo/cost-breakdown', { params });
  return data.data;
}

export interface CostBreakdownData {
  totalLabel: string;
  totalCostLabel: string;
  totalCostValue: string;
  items: { label: string; pct: number; value: string; dot: string }[];
  vsLastMonth: { label: string; delta: string; positive: boolean }[];
  periodLabel: string;
}

export async function fetchCeoClientPipeline() {
  const { data } = await apiClient.get<{ status: string; data: ClientPipelineData }>('/ceo/client-pipeline');
  return data.data;
}

export interface ClientPipelineData {
  totalLabel: string;
  stages: { label: string; count: number; max: number }[];
  footerStats: { label: string; value: string }[];
  topClientLabel: string;
}

export async function fetchCeoQuickActions() {
  const { data } = await apiClient.get<{ status: string; data: QuickAction[] }>('/ceo/quick-actions');
  return data.data;
}

export interface QuickAction {
  id: string;
  title: string;
  meta: string;
  tone: 'default' | 'urgent';
  href: string;
}

export async function fetchCeoSystemActivity() {
  const { data } = await apiClient.get<{ status: string; data: SystemActivityItem[] }>('/ceo/system-activity');
  return data.data;
}

export interface SystemActivityItem {
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  title: string;
  meta: string;
  time: string;
}

export async function fetchCeoSystemHealth() {
  const { data } = await apiClient.get<{ status: string; data: SystemHealthData }>('/ceo/system-health');
  return data.data;
}

export interface SystemHealthData {
  services: { label: string; status: 'Operational' | 'Degraded' }[];
  uptime: { pct: string; period: string; lastChecked: string };
}

export async function fetchCeoOverrides() {
  const { data } = await apiClient.get<{ status: string; data: { id: string; actionTitle: string }[] }>('/ceo/overrides');
  return data.data;
}

export async function approveCeoOverride(taskId: string) {
  const { data } = await apiClient.patch(`/ceo/overrides/${taskId}/approve`);
  return data;
}

export async function rejectCeoOverride(taskId: string) {
  const { data } = await apiClient.patch(`/ceo/overrides/${taskId}/reject`);
  return data;
}

export async function exportCeoBoardReport(fromDate: string, toDate: string) {
  const response = await apiClient.get('/ceo/export/board-report', {
    params: { fromDate, toDate },
    responseType: 'blob',
  });
  return response.data as Blob;
}
