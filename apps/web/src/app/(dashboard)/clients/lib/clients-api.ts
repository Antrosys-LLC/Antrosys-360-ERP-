import apiClient from '@/lib/api-client';

export interface ClientSummary {
  totalClients: number;
  activeClients: number;
  atRiskClients: number;
  totalAnnualRevenue: number | null;
  totalMonthlyRevenue: number | null;
  upcomingRenewals: number;
  prospectPipeline: number;
  lifecycleDistribution: { active: number; prospect: number; atRisk: number };
  atRiskClientNames: string[];
}

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
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
  priority: string;
  projectManager: string | null;
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

export interface GlobalTimelineEvent {
  id: string;
  clientId: string;
  clientName: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
}

export interface GlobalTask {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  priority: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface SalesPipelineCard {
  id: string;
  name: string;
  annualRevenue: number | null;
  currencyCode: string;
}

export type SalesPipeline = Record<string, SalesPipelineCard[]>;

export interface ClientAlerts {
  message: string | null;
  clients: { name: string; healthScore: number; renewalDueAt: string | null }[];
}

export interface Client {
  id: string;
  clientCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  industry: string | null;
  tier: string | null;
  pipelineStage: string;
  salesStage: string | null;
  monthlyRevenue: number | null;
  annualRevenue: number | null;
  lifetimeValue: number | null;
  currencyCode: string;
  healthScore: number;
  healthMetrics: unknown;
  renewalDueAt: string | null;
  isAtRisk: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { projects: number; tasks: number; invoices: number; contacts: number };
  contacts?: ClientContact[];
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

// ── Summary & Dashboard ──────────────────────────────────────────────────

export async function fetchSummary(): Promise<ClientSummary> {
  const { data } = await apiClient.get('/clients/summary');
  return data.data;
}

export async function fetchSalesPipeline(): Promise<SalesPipeline> {
  const { data } = await apiClient.get('/clients/pipeline');
  return data.data;
}

export async function fetchRecentTimeline(limit = 10): Promise<GlobalTimelineEvent[]> {
  const { data } = await apiClient.get('/clients/recent-timeline', { params: { limit } });
  return data.data;
}

export async function fetchUpcomingTasks(limit = 10): Promise<GlobalTask[]> {
  const { data } = await apiClient.get('/clients/upcoming-tasks', { params: { limit } });
  return data.data;
}

export async function fetchAlerts(): Promise<ClientAlerts> {
  const { data } = await apiClient.get('/clients/alerts');
  return data.data;
}

export async function exportClients(): Promise<Blob> {
  const { data } = await apiClient.get('/clients/export', { responseType: 'blob' });
  return data;
}

export async function importClients(csv: string): Promise<{ imported: number }> {
  const { data } = await apiClient.post('/clients/import', { csv });
  return data.data;
}

export async function updateSalesStage(clientId: string, salesStage: string): Promise<Client> {
  const { data } = await apiClient.patch(`/clients/${clientId}/sales-stage`, { salesStage });
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
  clientCode?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  tier?: string | null;
  pipelineStage?: string;
  salesStage?: string | null;
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
  clientCode: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  tier: string | null;
  pipelineStage: string;
  salesStage: string | null;
  monthlyRevenue: number | null;
  annualRevenue: number | null;
  currencyCode: string;
  renewalDueAt: string | null;
  isAtRisk: boolean;
  isActive: boolean;
  healthScore: number;
  lifetimeValue: number | null;
}>): Promise<Client> {
  const { data } = await apiClient.patch(`/clients/${clientId}`, payload);
  return data.data;
}

export async function deleteClient(clientId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}`);
}

// ── Contacts ───────────────────────────────────────────────────────────────

export async function fetchContacts(clientId: string): Promise<ClientContact[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/contacts`);
  return data.data;
}

export async function createContact(clientId: string, payload: {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}): Promise<ClientContact> {
  const { data } = await apiClient.post(`/clients/${clientId}/contacts`, payload);
  return data.data;
}

export async function updateContact(clientId: string, contactId: string, payload: Partial<{
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}>): Promise<ClientContact> {
  const { data } = await apiClient.patch(`/clients/${clientId}/contacts/${contactId}`, payload);
  return data.data;
}

export async function deleteContact(clientId: string, contactId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/contacts/${contactId}`);
}

// ── Invoice ──────────────────────────────────────────────────────────────

export async function createInvoice(payload: {
  invoiceNumber: string;
  clientId: string;
  projectId: string;
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays?: number;
  currencyCode?: string;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    discountPct?: number;
    taxType?: string;
    taxRatePct?: number;
  }>;
}) {
  const { data } = await apiClient.post('/invoices', payload);
  return data.data;
}

export async function updateInvoice(invoiceId: string, payload: Partial<{
  status: string;
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays: number;
  currencyCode: string;
  notes: string | null;
}>) {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}`, payload);
  return data.data;
}

export async function deleteInvoice(invoiceId: string) {
  await apiClient.delete(`/invoices/${invoiceId}`);
}

export async function sendInvoice(invoiceId: string) {
  const { data } = await apiClient.post(`/invoices/${invoiceId}/send`, { markAsSent: true });
  return data.data;
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

export async function createProject(clientId: string, payload: { name: string; description?: string | null; status?: string; priority?: string; projectManager?: string | null; startDate?: string | null; endDate?: string | null; budget?: number | null }): Promise<ClientProject> {
  const { data } = await apiClient.post(`/clients/${clientId}/projects`, payload);
  return data.data;
}

export async function updateProject(clientId: string, projectId: string, payload: Partial<{ name: string; description: string | null; status: string; priority: string; projectManager: string | null; startDate: string | null; endDate: string | null; budget: number | null }>): Promise<ClientProject> {
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
