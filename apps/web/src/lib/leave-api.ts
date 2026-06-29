import apiClient from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────

export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'WFH' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApiLeaveBalance {
  type: LeaveType;
  totalDays: number;
  takenDays: number;
  remainingDays: number;
}

export interface ApiLeaveRequest {
  id: string;
  employeeId: string;
  employee: { firstName: string; lastName: string; designation?: string; department?: string };
  type: LeaveType;
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  durationDays: number;
  status: LeaveStatus;
  reason?: string | null;
  declineNote?: string | null;
  approvedById?: string | null;
  approvedBy?: { firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLeaveMetrics {
  pending: number;
  totalTaken: number;
  attendance: string;
  onLeaveToday: number;
}

// ─── API Methods ─────────────────────────────────────────────────────────

export async function fetchLeaveBalances(): Promise<ApiLeaveBalance[]> {
  const { data } = await apiClient.get<{ status: string; data: ApiLeaveBalance[] }>(
    '/operations/leave/balances'
  );
  return data.data;
}

export async function fetchLeaveMetrics(): Promise<ApiLeaveMetrics> {
  const { data } = await apiClient.get<{ status: string; data: ApiLeaveMetrics }>(
    '/operations/leave/metrics'
  );
  return data.data;
}

export async function fetchLeaveRequests(params?: {
  status?: LeaveStatus;
  type?: LeaveType;
  page?: number;
  limit?: number;
}): Promise<{ items: ApiLeaveRequest[]; total: number }> {
  const { data } = await apiClient.get<{ status: string; data: { items: ApiLeaveRequest[]; total: number } }>(
    '/operations/leave',
    { params }
  );
  return data.data;
}

export async function fetchPendingApprovals(): Promise<ApiLeaveRequest[]> {
  const { data } = await apiClient.get<{ status: string; data: ApiLeaveRequest[] }>(
    '/operations/leave/approvals'
  );
  return data.data;
}

export async function createLeaveRequest(body: {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<{ leaveRequest: ApiLeaveRequest; teamConflictCount: number }> {
  const { data } = await apiClient.post<{ status: string; data: { leaveRequest: ApiLeaveRequest; teamConflictCount: number } }>(
    '/operations/leave',
    body
  );
  return data.data;
}

export async function updateLeaveStatus(
  leaveId: string,
  body: { status: 'APPROVED' | 'REJECTED'; declineNote?: string }
): Promise<ApiLeaveRequest> {
  const { data } = await apiClient.patch<{ status: string; data: ApiLeaveRequest }>(
    `/operations/leave/${leaveId}/status`,
    body
  );
  return data.data;
}

export async function cancelLeaveRequest(leaveId: string): Promise<ApiLeaveRequest> {
  const { data } = await apiClient.delete<{ status: string; data: ApiLeaveRequest }>(
    `/operations/leave/${leaveId}`
  );
  return data.data;
}
