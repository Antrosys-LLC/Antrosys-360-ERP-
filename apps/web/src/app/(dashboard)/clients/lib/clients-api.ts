import apiClient from '@/lib/api-client';

export interface ClientSummary {
  totalClients: number;
  activeClients: number;
  atRiskClients: number;
  totalAnnualRevenue: number | null;
  totalMonthlyRevenue: number | null;
  upcomingRenewals: number;
  prospectPipeline: number;
}

export interface ClientStatus {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface ClientRenewal {
  id: string;
  clientId: string;
  dueAt: string;
  completedAt: string | null;
  amount: number | null;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface ClientProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
}

export interface ClientTask {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  priority: string;
  status: string;
  createdAt: string;
}

export interface ClientTimelineEvent {
  id: string;
  clientId: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  metadata: unknown;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pipelineStage: string;
  monthlyRevenue: number | null;
  annualRevenue: number | null;
  currencyCode: string;
  renewalDueAt: string | null;
  isAtRisk: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { projects: number; tasks: number; invoices: number };
  statuses?: ClientStatus[];
  renewals?: ClientRenewal[];
  activities?: ClientActivity[];
  projects?: ClientProject[];
  tasks?: ClientTask[];
  timelineEvents?: ClientTimelineEvent[];
  invoices?: unknown[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Summary ──────────────────────────────────────────────────────────────

export async function fetchSummary(): Promise<ClientSummary> {
  const { data } = await apiClient.get('/clients/summary');
  return data.data;
}

// ── Client CRUD ──────────────────────────────────────────────────────────

export async function fetchClients(params?: {
  search?: string;
  pipelineStage?: string;
  isAtRisk?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<Client>> {
  const { data } = await apiClient.get('/clients', { params });
  return data.data;
}

export async function fetchClient(clientId: string): Promise<Client> {
  const { data } = await apiClient.get(`/clients/${clientId}`);
  return data.data;
}

export async function createClient(payload: {
  name: string;
  email?: string | null;
  phone?: string | null;
  pipelineStage?: string;
  monthlyRevenue?: number | null;
  annualRevenue?: number | null;
  currencyCode?: string;
  renewalDueAt?: string | null;
  isAtRisk?: boolean;
  isActive?: boolean;
}): Promise<Client> {
  const { data } = await apiClient.post('/clients', payload);
  return data.data;
}

export async function updateClient(clientId: string, payload: Partial<{
  name: string;
  email: string | null;
  phone: string | null;
  pipelineStage: string;
  monthlyRevenue: number | null;
  annualRevenue: number | null;
  currencyCode: string;
  renewalDueAt: string | null;
  isAtRisk: boolean;
  isActive: boolean;
}>): Promise<Client> {
  const { data } = await apiClient.patch(`/clients/${clientId}`, payload);
  return data.data;
}

export async function deleteClient(clientId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}`);
}

// ── Status ───────────────────────────────────────────────────────────────

export async function fetchStatuses(clientId: string): Promise<ClientStatus[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/statuses`);
  return data.data;
}

// ── Renewal ──────────────────────────────────────────────────────────────

export async function fetchRenewals(clientId: string): Promise<ClientRenewal[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/renewals`);
  return data.data;
}

export async function createRenewal(clientId: string, payload: { dueAt: string; amount?: number | null; note?: string | null }): Promise<ClientRenewal> {
  const { data } = await apiClient.post(`/clients/${clientId}/renewals`, payload);
  return data.data;
}

export async function updateRenewal(clientId: string, renewalId: string, payload: Partial<{ dueAt: string; completedAt: string | null; amount: number | null; status: string; note: string | null }>): Promise<ClientRenewal> {
  const { data } = await apiClient.patch(`/clients/${clientId}/renewals/${renewalId}`, payload);
  return data.data;
}

// ── Activity ─────────────────────────────────────────────────────────────

export async function fetchActivities(clientId: string): Promise<ClientActivity[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/activities`);
  return data.data;
}

export async function createActivity(clientId: string, payload: { type: string; title: string; description?: string | null }): Promise<ClientActivity> {
  const { data } = await apiClient.post(`/clients/${clientId}/activities`, payload);
  return data.data;
}

// ── Project ──────────────────────────────────────────────────────────────

export async function fetchProjects(clientId: string): Promise<ClientProject[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/projects`);
  return data.data;
}

export async function createProject(clientId: string, payload: { name: string; description?: string | null; status?: string; startDate?: string | null; endDate?: string | null; budget?: number | null }): Promise<ClientProject> {
  const { data } = await apiClient.post(`/clients/${clientId}/projects`, payload);
  return data.data;
}

export async function updateProject(clientId: string, projectId: string, payload: Partial<{ name: string; description: string | null; status: string; startDate: string | null; endDate: string | null; budget: number | null }>): Promise<ClientProject> {
  const { data } = await apiClient.patch(`/clients/${clientId}/projects/${projectId}`, payload);
  return data.data;
}

// ── Task ─────────────────────────────────────────────────────────────────

export async function fetchTasks(clientId: string): Promise<ClientTask[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/tasks`);
  return data.data;
}

export async function createTask(clientId: string, payload: { title: string; description?: string | null; dueAt?: string | null; priority?: string; status?: string }): Promise<ClientTask> {
  const { data } = await apiClient.post(`/clients/${clientId}/tasks`, payload);
  return data.data;
}

export async function updateTask(clientId: string, taskId: string, payload: Partial<{ title: string; description: string | null; dueAt: string | null; completedAt: string | null; priority: string; status: string }>): Promise<ClientTask> {
  const { data } = await apiClient.patch(`/clients/${clientId}/tasks/${taskId}`, payload);
  return data.data;
}

// ── Timeline ─────────────────────────────────────────────────────────────

export async function fetchTimeline(clientId: string, limit?: number): Promise<ClientTimelineEvent[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/timeline`, { params: { limit } });
  return data.data;
}
