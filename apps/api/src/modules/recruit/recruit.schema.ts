import { z } from 'zod';

// ─── Enums ─────────────────────────────────────────────────────────────────

export const pipelineStageSchema = z.enum([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
]);

export const requisitionStatusSchema = z.enum(['ACTIVE', 'CLOSED', 'DRAFT']);

// ─── Job Requisitions ──────────────────────────────────────────────────────

export const createRequisitionBodySchema = z.object({
  title: z.string().min(2).max(200),
  department: z.string().min(2).max(100),
  status: requisitionStatusSchema.default('ACTIVE'),
});

export const updateRequisitionBodySchema = createRequisitionBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const requisitionParamsSchema = z.object({
  requisitionId: z.string(),
});

export const listRequisitionsQuerySchema = z.object({
  status: requisitionStatusSchema.optional(),
  department: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Candidates ────────────────────────────────────────────────────────────

export const createCandidateBodySchema = z.object({
  jobRequisitionId: z.string(),
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  role: z.string().max(100).optional(),
  experience: z.string().max(50).optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingType: z.enum(['default', 'primary']).default('default'),
  filesCount: z.number().int().min(0).default(0),
  tag: z.string().max(50).optional(),
  tagColor: z.string().max(100).optional(),
  pipelineStage: pipelineStageSchema.default('APPLIED'),
  pipelineProgress: z.number().int().min(1).max(5).default(1),
  skills: z.array(z.string().max(100)).max(30).default([]),
  interviewTitle: z.string().max(200).optional(),
  interviewLocation: z.string().max(100).optional(),
  interviewAt: z.coerce.date().optional(),
});

export const updateCandidateStageBodySchema = z.object({
  pipelineStage: pipelineStageSchema,
});

export const candidateParamsSchema = z.object({
  candidateId: z.string(),
});

export const listCandidatesQuerySchema = z.object({
  jobRequisitionId: z.string().optional(),
  pipelineStage: pipelineStageSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// ─── Metrics ───────────────────────────────────────────────────────────────

// (no query params needed – metrics are aggregated over all active data)

// ─── Inferred Types ────────────────────────────────────────────────────────

export type CreateRequisitionBody = z.infer<typeof createRequisitionBodySchema>;
export type UpdateRequisitionBody = z.infer<typeof updateRequisitionBodySchema>;
export type RequisitionParams = z.infer<typeof requisitionParamsSchema>;
export type ListRequisitionsQuery = z.infer<typeof listRequisitionsQuerySchema>;

export type CreateCandidateBody = z.infer<typeof createCandidateBodySchema>;
export type UpdateCandidateStageBody = z.infer<typeof updateCandidateStageBodySchema>;
export type CandidateParams = z.infer<typeof candidateParamsSchema>;
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>;
