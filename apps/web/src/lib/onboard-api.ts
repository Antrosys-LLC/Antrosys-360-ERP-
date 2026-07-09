import apiClient from '@/lib/api-client';

export type OnboardingPhase =
  | 'PENDING'
  | 'DOCUMENTATION'
  | 'IT_SETUP'
  | 'HR_ORIENTATION'
  | 'TEAM_INTRO'
  | 'COMPLETED';

export const ONBOARDING_PHASES: OnboardingPhase[] = [
  'PENDING',
  'DOCUMENTATION',
  'IT_SETUP',
  'HR_ORIENTATION',
  'TEAM_INTRO',
  'COMPLETED',
];

export const PHASE_LABELS: Record<OnboardingPhase, string> = {
  PENDING: 'Pending',
  DOCUMENTATION: 'Documentation',
  IT_SETUP: 'IT Setup',
  HR_ORIENTATION: 'HR Orientation',
  TEAM_INTRO: 'Team Intro',
  COMPLETED: 'Completed',
};

export interface OnboardingRecord {
  id: string;
  status: string;
  currentPhase: OnboardingPhase;
  startDate: string;
  targetEndDate?: string;
  completedAt?: string;
}

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
  onboarding?: OnboardingRecord;
  onboardingMeetings?: OnboardMeeting[];
}

export interface OnboardTask {
  id: string;
  title: string;
  description?: string;
  phase?: OnboardingPhase | null;
  status: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface OnboardMeeting {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMins: number;
  location?: string | null;
  phase?: OnboardingPhase | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
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
  phaseDistribution: { phase: OnboardingPhase; count: number }[];
  departments: { department: string; count: number }[];
}

export interface MyOnboarding {
  hasProfile: boolean;
  hasOnboarding: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
    joiningDate?: string;
    user: { email: string; role: string };
    manager?: { id: string; firstName: string; lastName: string; designation?: string } | null;
    teams?: { team: { id: string; name: string; department?: string } }[];
    onboarding?: OnboardingRecord | null;
    tasks: OnboardTask[];
    onboardingMeetings: OnboardMeeting[];
    receivedMessages: {
      id: string;
      subject: string;
      body: string;
      isRead: boolean;
      createdAt: string;
      sender: { email: string };
    }[];
  } | null;
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

export async function createEmployeeTask(
  employeeId: string,
  payload: { title: string; description?: string; phase?: OnboardingPhase; dueAt?: string },
) {
  const { data } = await apiClient.post<{ status: string; data: OnboardTask }>(`/onboard/employees/${employeeId}/tasks`, payload);
  return data.data;
}

export async function updateTask(
  taskId: string,
  payload: { title?: string; status?: string; phase?: OnboardingPhase | null },
) {
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

// ----- Pipeline phase -----

export async function updateOnboardingPhase(employeeId: string, currentPhase: OnboardingPhase) {
  const { data } = await apiClient.patch<{ status: string; data: OnboardingRecord }>(
    `/onboard/employees/${employeeId}/phase`,
    { currentPhase },
  );
  return data.data;
}

// ----- Meetings -----

export async function fetchMeetings(employeeId: string) {
  const { data } = await apiClient.get<{ status: string; data: OnboardMeeting[] }>(
    `/onboard/employees/${employeeId}/meetings`,
  );
  return data.data;
}

export async function createMeeting(
  employeeId: string,
  payload: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMins?: number;
    location?: string;
    phase?: OnboardingPhase;
  },
) {
  const { data } = await apiClient.post<{ status: string; data: OnboardMeeting }>(
    `/onboard/employees/${employeeId}/meetings`,
    payload,
  );
  return data.data;
}

export async function updateMeeting(
  meetingId: string,
  payload: Partial<{
    title: string;
    description: string | null;
    scheduledAt: string;
    durationMins: number;
    location: string | null;
    phase: OnboardingPhase | null;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  }>,
) {
  const { data } = await apiClient.patch<{ status: string; data: OnboardMeeting }>(
    `/onboard/meetings/${meetingId}`,
    payload,
  );
  return data.data;
}

export async function deleteMeeting(meetingId: string) {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean } }>(
    `/onboard/meetings/${meetingId}`,
  );
  return data.data;
}

// ----- Employee self-service -----

export async function fetchMyOnboarding() {
  const { data } = await apiClient.get<{ status: string; data: MyOnboarding }>('/onboard/me');
  return data.data;
}

export async function updateMyTask(taskId: string, payload: { status: string }) {
  const { data } = await apiClient.patch<{ status: string; data: OnboardTask }>(
    `/onboard/me/tasks/${taskId}`,
    payload,
  );
  return data.data;
}
