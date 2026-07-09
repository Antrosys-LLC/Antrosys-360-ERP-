import apiClient from '@/lib/api-client';

export type DeptFilter = 'All' | 'Eng' | 'Ops' | 'Fin' | 'HR';

export interface OpsDashboardData {
  pageHeader: { title: string; subtitle: string; liveLabel: string };
  attendanceRate: {
    label: string;
    value: string;
    progressPct: number;
    breakdown: { label: string; count: number; color: string }[];
  };
  pendingLeave: {
    label: string;
    value: number;
    valueColor: string;
    types: { label: string; count: number }[];
    ctaLabel: string;
  };
  manpowerGapsSummary: {
    label: string;
    value: number;
    valueColor: string;
    items: { label: string; tone: 'danger' | 'neutral' }[];
  };
  rosterCoverage: {
    label: string;
    value: string;
    days: { day: string; coveragePct: number }[];
  };
  attendanceDots: ('present' | 'late' | 'absent')[];
  todayAttendanceRows: {
    employeeId: string;
    name: string;
    dept: string;
    checkIn: string;
    status: 'Present' | 'Late' | 'Absent';
    isFlagged: boolean;
  }[];
  leaveApprovals: {
    id: string;
    initials: string;
    name: string;
    type: string;
    days: number;
    reason: string | null;
  }[];
  manpowerGapsDetail: { dept: string; level: 'Critical' | 'Standard'; count: number }[];
  pendingOpsHeadCount: number;
  recentManpowerRequests: {
    id: string;
    department: string;
    headcount: number;
    status: string;
    notes: string | null;
    createdAt: string;
  }[];
}

export interface OpsLeaveRequest {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    designation?: string | null;
    department?: string | null;
  };
  type: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
  reason: string | null;
  declineNote?: string | null;
  requiresOpsHeadApproval: boolean;
  managerApprovedBy?: { firstName: string; lastName: string } | null;
  managerApprovedAt?: string | null;
  createdAt: string;
}

export async function fetchOpsDashboard(department: DeptFilter = 'All'): Promise<OpsDashboardData> {
  const { data } = await apiClient.get<{ status: string; data: OpsDashboardData }>(
    '/operation-head/dashboard',
    { params: { department } },
  );
  return data.data;
}

export async function fetchOpsHeadLeaves(params?: {
  status?: 'PENDING_OPS_HEAD' | 'APPROVED' | 'REJECTED';
  page?: number;
  limit?: number;
}): Promise<{ items: OpsLeaveRequest[]; total: number; page: number; limit: number }> {
  const { data } = await apiClient.get<{
    status: string;
    data: { items: OpsLeaveRequest[]; total: number; page: number; limit: number };
  }>('/operation-head/leaves', { params });
  return data.data;
}

export async function updateOpsHeadLeaveStatus(
  leaveId: string,
  body: { status: 'APPROVED' | 'REJECTED'; declineNote?: string },
): Promise<OpsLeaveRequest> {
  const { data } = await apiClient.patch<{ status: string; data: OpsLeaveRequest }>(
    `/operation-head/leaves/${leaveId}`,
    body,
  );
  return data.data;
}

export async function toggleOpsAttendanceFlag(
  employeeId: string,
  isFlagged: boolean,
): Promise<unknown> {
  const { data } = await apiClient.post<{ status: string; data: unknown }>(
    `/operation-head/attendance/${employeeId}/flag`,
    { isFlagged },
  );
  return data.data;
}

export async function overrideOpsAttendanceStatus(
  employeeId: string,
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON LEAVE',
): Promise<unknown> {
  const { data } = await apiClient.put<{ status: string; data: unknown }>(
    `/operation-head/attendance/${employeeId}`,
    { status },
  );
  return data.data;
}

export async function raiseManpowerRequest(body: {
  department: string;
  additionalHeadcount?: number;
  notes?: string;
}): Promise<unknown> {
  const { data } = await apiClient.post<{ status: string; data: unknown }>(
    '/operation-head/manpower-requests',
    body,
  );
  return data.data;
}
