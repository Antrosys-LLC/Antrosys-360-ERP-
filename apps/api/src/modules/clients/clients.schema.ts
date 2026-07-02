import { z } from 'zod';

function emptyToNull(val: unknown) {
  if (val === '' || val === undefined) return null;
  return val;
}

// ─── Params ────────────────────────────────────────────────────────────────

export const clientParamsSchema = z.object({
  clientId: z.string().min(1),
});
export type ClientParams = z.infer<typeof clientParamsSchema>;

// ─── Client CRUD ───────────────────────────────────────────────────────────

export const listClientsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  pipelineStage: z.string().optional(),
  isAtRisk: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

export const createClientBodySchema = z.object({
  name: z.string().min(1).max(300),
  clientCode: z.preprocess(emptyToNull, z.string().max(20).nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().email().nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
  industry: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
  tier: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
  pipelineStage: z.enum(['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK']).default('PROSPECT'),
  salesStage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON']).optional().nullable(),
  currencyCode: z.string().length(3).default('PKR'),
  renewalDueAt: z.string().datetime().optional().nullable(),
  isAtRisk: z.boolean().default(false),
  isActive: z.boolean().default(true),
  healthScore: z.coerce.number().int().min(0).max(100).optional(),
  lifetimeValue: z.coerce.number().optional().nullable(),
});
export type CreateClientBody = z.infer<typeof createClientBodySchema>;

export const updateClientBodySchema = z.object({
  name: z.string().min(1).max(300).optional(),
  clientCode: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  tier: z.string().max(50).optional().nullable(),
  pipelineStage: z.enum(['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK']).optional(),
  salesStage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON']).optional().nullable(),
  currencyCode: z.string().length(3).optional(),
  renewalDueAt: z.string().datetime().optional().nullable(),
  isAtRisk: z.boolean().optional(),
  isActive: z.boolean().optional(),
  healthScore: z.coerce.number().int().min(0).max(100).optional(),
  lifetimeValue: z.coerce.number().optional().nullable(),
});
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;

// ─── Status ────────────────────────────────────────────────────────────────

export const createStatusBodySchema = z.object({
  status: z.string().min(1).max(50),
  note: z.string().max(500).optional().nullable(),
});
export type CreateStatusBody = z.infer<typeof createStatusBodySchema>;

// ─── Renewal ───────────────────────────────────────────────────────────────

export const createRenewalBodySchema = z.object({
  dueAt: z.string().datetime(),
  amount: z.coerce.number().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});
export type CreateRenewalBody = z.infer<typeof createRenewalBodySchema>;

export const updateRenewalBodySchema = z.object({
  dueAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional().nullable(),
  amount: z.coerce.number().optional().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  note: z.string().max(500).optional().nullable(),
});
export type UpdateRenewalBody = z.infer<typeof updateRenewalBodySchema>;

// ─── Activity ──────────────────────────────────────────────────────────────

export const createActivityBodySchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
});
export type CreateActivityBody = z.infer<typeof createActivityBodySchema>;

// ─── Project ───────────────────────────────────────────────────────────────

export const createProjectBodySchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
});
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const updateProjectBodySchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
});
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;

// ─── Task ──────────────────────────────────────────────────────────────────

export const createTaskBodySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
});
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

export const updateTaskBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

// ─── Timeline ──────────────────────────────────────────────────────────────

export const listTimelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;

// ─── Contact ───────────────────────────────────────────────────────────────

export const createContactBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().default(false),
});
export type CreateContactBody = z.infer<typeof createContactBodySchema>;

export const updateContactBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});
export type UpdateContactBody = z.infer<typeof updateContactBodySchema>;

export const updateSalesStageBodySchema = z.object({
  salesStage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON']),
});
export type UpdateSalesStageBody = z.infer<typeof updateSalesStageBodySchema>;
