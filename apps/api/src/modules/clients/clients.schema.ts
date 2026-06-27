import { z } from 'zod';

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(100).optional(),
  status: z.enum(['Active', 'At Risk']).optional(),
  tier: z.string().optional(),
});

export const clientParamsSchema = z.object({
  clientId: z.string().cuid(),
});

export const taskParamsSchema = z.object({
  taskId: z.string().cuid(),
});

export const createClientBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  sector: z.string().max(100).optional(),
  tier: z.string().default('Mid-Market'),
  monthlyRevenue: z.coerce.number().nonnegative().optional(),
  annualRevenue: z.coerce.number().nonnegative().optional(),
  currencyCode: z.string().length(3).default('USD'),
  renewalDueAt: z.coerce.date().optional(),
});

export const updateClientBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  sector: z.string().max(100).optional(),
  tier: z.string().optional(),
  monthlyRevenue: z.coerce.number().nonnegative().optional(),
  annualRevenue: z.coerce.number().nonnegative().optional(),
  currencyCode: z.string().length(3).optional(),
  renewalDueAt: z.coerce.date().optional(),
  isAtRisk: z.boolean().optional(),
  pipelineStage: z.enum(['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK']).optional(),
});

export const createTaskBodySchema = z.object({
  text: z.string().min(1).max(500),
  date: z.string().optional(),
  urgent: z.boolean().default(false),
});

export const updateTaskBodySchema = z.object({
  done: z.boolean().optional(),
  text: z.string().min(1).max(500).optional(),
  date: z.string().optional(),
  urgent: z.boolean().optional(),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type ClientParams = z.infer<typeof clientParamsSchema>;
export type CreateClientBody = z.infer<typeof createClientBodySchema>;
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
