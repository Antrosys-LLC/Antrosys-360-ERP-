import apiClient from '@/lib/api-client';

export interface OnboardEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  grade?: string;
  employmentStatus?: string;
  phone?: string;
  joiningDate?: string;
  isActive: boolean;
  user: { email: string };
  teams?: { team: { id: string; name: string; department?: string } }[];
  tasks?: OnboardTask[];
  onboarding?: { status: string; startDate: string; targetEndDate?: string };
}

export interface OnboardTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  department?: string;
  members: { employee: { id: string; firstName: string; lastName: string; designation?: string } }[];
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: { email: string };
  recipient: { id: string; firstName: string; lastName: string; user: { email: string } };
}

export interface DashboardStats {
  activeOnboardings: number;
  avgCompletion: number;
  overdueTasks: number;
  completingSoon: number;
  completedOnboardings: number;
  totalEmployees: number;
  employeesWithOverdueTasks: number;
  departments: { department: string; count: number }[];
}

export interface PaginatedResponse<T> {
  employees: T[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchDashboardStats() {
  const { data } = await apiClient.get<{ status: string; data: DashboardStats }>('/onboard/stats');
  return data.data;
}

export async function fetchOnboardEmployees(params?: {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  search?: string;
}) {
  const { data } = await apiClient.get<{ status: string; data: PaginatedResponse<OnboardEmployee> }>('/onboard/employees', {
    params,
  });
  return data.data;
}

export async function fetchOnboardEmployee(id: string) {
  const { data } = await apiClient.get<{ status: string; data: OnboardEmployee }>(`/onboard/employees/${id}`);
  return data.data;
}

export async function createOnboardEmployee(payload: {
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  designation?: string;
  grade?: string;
  joiningDate?: string;
  phone?: string;
  teamIds?: string[];
}) {
  const { data } = await apiClient.post<{ status: string; data: OnboardEmployee }>('/onboard/employees', payload);
  return data.data;
}

export async function updateOnboardEmployee(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put<{ status: string; data: OnboardEmployee }>(`/onboard/employees/${id}`, payload);
  return data.data;
}

export async function deleteOnboardEmployee(id: string) {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean } }>(`/onboard/employees/${id}`);
  return data.data;
}

export async function fetchEmployeeTasks(employeeId: string) {
  const { data } = await apiClient.get<{ status: string; data: OnboardTask[] }>(`/onboard/employees/${employeeId}/tasks`);
  return data.data;
}

export async function createEmployeeTask(employeeId: string, payload: { title: string; description?: string; dueAt?: string }) {
  const { data } = await apiClient.post<{ status: string; data: OnboardTask }>(`/onboard/employees/${employeeId}/tasks`, payload);
  return data.data;
}

export async function updateTask(taskId: string, payload: { title?: string; status?: string }) {
  const { data } = await apiClient.patch<{ status: string; data: OnboardTask }>(`/onboard/tasks/${taskId}`, payload);
  return data.data;
}

export async function deleteTask(taskId: string) {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean } }>(`/onboard/tasks/${taskId}`);
  return data.data;
}

export async function fetchTeams() {
  const { data } = await apiClient.get<{ status: string; data: Team[] }>('/onboard/teams');
  return data.data;
}

export async function createTeam(payload: { name: string; description?: string; department?: string }) {
  const { data } = await apiClient.post<{ status: string; data: Team }>('/onboard/teams', payload);
  return data.data;
}

export async function addTeamMember(teamId: string, employeeId: string) {
  const { data } = await apiClient.post<{ status: string; data: unknown }>(`/onboard/teams/${teamId}/members`, { employeeId });
  return data.data;
}

export async function removeTeamMember(teamId: string, employeeId: string) {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean } }>(`/onboard/teams/${teamId}/members/${employeeId}`);
  return data.data;
}

export async function fetchMessages(employeeId?: string) {
  const { data } = await apiClient.get<{ status: string; data: Message[] }>('/onboard/messages', {
    params: { employeeId },
  });
  return data.data;
}

export async function sendMessage(payload: { recipientId: string; subject: string; body: string }) {
  const { data } = await apiClient.post<{ status: string; data: Message }>('/onboard/messages', payload);
  return data.data;
}

export async function markMessageRead(id: string) {
  const { data } = await apiClient.patch<{ status: string; data: Message }>(`/onboard/messages/${id}/read`);
  return data.data;
}
