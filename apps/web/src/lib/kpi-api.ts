import apiClient from '@/lib/api-client';

export type KpiStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'EXCEEDED';

export type KpiDepartment =
  | 'ENGINEERING'
  | 'OPERATIONS'
  | 'SALES'
  | 'FINANCE'
  | 'HR'
  | 'OTHER';

export interface KpiOwner {
  id: string;
  name: string | null;
  initials: string;
  designation: string | null;
}

export interface Kpi {
  id: string;
  name: string;
  description: string | null;
  department: KpiDepartment | null;
  unit: string | null;
  targetValue: number | null;
  currentValue: number | null;
  progress: number;
  status: KpiStatus;
  trend: number[];
  quarter: string | null;
  year: number | null;
  owner: KpiOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiOverview {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  exceeded: number;
  avgProgress: number;
  onTrackPct: number;
}

export interface KpiDepartmentAggregate {
  department: KpiDepartment | null;
  count: number;
  avgProgress: number;
  status: KpiStatus;
}

export interface KpiListResult {
  items: Kpi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KpiQueryParams {
  department?: string;
  quarter?: string;
  year?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface KpiPayload {
  name: string;
  description?: string | null;
  department?: KpiDepartment | null;
  ownerEmployeeId?: string | null;
  unit?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  progress?: number;
  status?: KpiStatus;
  trend?: number[];
  quarter?: string;
  year?: number;
}

export async function fetchKpis(params?: KpiQueryParams): Promise<KpiListResult> {
  const { data } = await apiClient.get<{ status: string; data: KpiListResult }>('/kpi', {
    params,
  });
  return data.data;
}

export async function fetchKpiOverview(params?: KpiQueryParams): Promise<KpiOverview> {
  const { data } = await apiClient.get<{ status: string; data: KpiOverview }>('/kpi/overview', {
    params,
  });
  return data.data;
}

export async function fetchDepartmentAggregates(
  params?: KpiQueryParams,
): Promise<KpiDepartmentAggregate[]> {
  const { data } = await apiClient.get<{ status: string; data: KpiDepartmentAggregate[] }>(
    '/kpi/departments',
    { params },
  );
  return data.data;
}

export async function createKpi(payload: KpiPayload): Promise<Kpi> {
  const { data } = await apiClient.post<{ status: string; data: Kpi }>('/kpi', payload);
  return data.data;
}

export async function updateKpi(id: string, payload: Partial<KpiPayload>): Promise<Kpi> {
  const { data } = await apiClient.patch<{ status: string; data: Kpi }>(`/kpi/${id}`, payload);
  return data.data;
}

export async function deleteKpi(id: string): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean; id: string } }>(
    `/kpi/${id}`,
  );
  return data.data;
}

export interface KpiOwnerOption {
  id: string;
  name: string;
  initials: string;
  department: KpiDepartment | null;
  designation: string | null;
}

export async function fetchKpiOwners(): Promise<KpiOwnerOption[]> {
  const { data } = await apiClient.get<{ status: string; data: KpiOwnerOption[] }>('/kpi/owners');
  return data.data;
}

export async function exportKpisCsv(params?: KpiQueryParams) {
  const response = await apiClient.get('/kpi/export', { params, responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kpi-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
