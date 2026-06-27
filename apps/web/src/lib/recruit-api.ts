import apiClient from '@/lib/api-client';

// ─── Enums ────────────────────────────────────────────────────────────────

export type PipelineStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

// ─── Shapes ───────────────────────────────────────────────────────────────

export interface ApiRequisition {
  id: string;
  title: string;
  department: string;
  status: string;
  applicants: number;
  pipeline: number[]; // [applied, screening, interview, offer, hired]
  postedAgo: string;
}

export interface ApiCandidate {
  id: string;
  jobRequisitionId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  experience?: string | null;
  rating?: string | null; // Decimal serialised as string
  ratingType: string;
  filesCount: number;
  tag?: string | null;
  tagColor?: string | null;
  pipelineStage: PipelineStage;
  pipelineProgress: number;
  skills: string[];
  interviewTitle?: string | null;
  interviewLocation?: string | null;
  interviewAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMetrics {
  totalApplicants: number;
  avgTimeToHire: string;
  offerAcceptance: string;
  openPositions: number;
  interviewsToday: number;
}

// ─── Requisitions ─────────────────────────────────────────────────────────

export async function fetchRequisitions(params?: {
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ApiRequisition[]; total: number }> {
  const { data } = await apiClient.get<{ status: string; data: { items: ApiRequisition[]; total: number } }>(
    '/recruit/requisitions',
    { params },
  );
  return data.data;
}

export async function createRequisition(body: {
  title: string;
  department: string;
  status?: string;
}): Promise<ApiRequisition> {
  const { data } = await apiClient.post<{ status: string; data: ApiRequisition }>(
    '/recruit/requisitions',
    body,
  );
  return data.data;
}

export async function updateRequisition(
  id: string,
  body: Partial<{ title: string; department: string; status: string }>,
): Promise<ApiRequisition> {
  const { data } = await apiClient.patch<{ status: string; data: ApiRequisition }>(
    `/recruit/requisitions/${id}`,
    body,
  );
  return data.data;
}

export async function deleteRequisition(id: string): Promise<void> {
  await apiClient.delete(`/recruit/requisitions/${id}`);
}

// ─── Candidates ───────────────────────────────────────────────────────────

export async function fetchCandidates(params?: {
  jobRequisitionId?: string;
  pipelineStage?: PipelineStage;
  page?: number;
  limit?: number;
}): Promise<{ items: ApiCandidate[]; total: number }> {
  const { data } = await apiClient.get<{ status: string; data: { items: ApiCandidate[]; total: number } }>(
    '/recruit/candidates',
    { params },
  );
  return data.data;
}

export async function createCandidate(
  body: Partial<ApiCandidate> & { jobRequisitionId: string; name: string },
): Promise<ApiCandidate> {
  const { data } = await apiClient.post<{ status: string; data: ApiCandidate }>(
    '/recruit/candidates',
    body,
  );
  return data.data;
}

export async function updateCandidateStage(
  candidateId: string,
  pipelineStage: PipelineStage,
): Promise<ApiCandidate> {
  const { data } = await apiClient.patch<{ status: string; data: ApiCandidate }>(
    `/recruit/candidates/${candidateId}/stage`,
    { pipelineStage },
  );
  return data.data;
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  await apiClient.delete(`/recruit/candidates/${candidateId}`);
}

// ─── Metrics ──────────────────────────────────────────────────────────────

export async function fetchRecruitMetrics(): Promise<ApiMetrics> {
  const { data } = await apiClient.get<{ status: string; data: ApiMetrics }>('/recruit/metrics');
  return data.data;
}
