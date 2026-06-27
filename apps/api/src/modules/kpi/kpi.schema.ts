import { z } from 'zod';

export const listKpisQuerySchema = z.object({
  quarter: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['All Status', 'Off Track']).optional(),
});

export const kpiParamsSchema = z.object({
  kpiId: z.string().cuid(),
});

export const createKpiBodySchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['on-track', 'exceeded', 'off-track', 'at-risk']).default('on-track'),
  value: z.string().min(1).max(50),
  target: z.string().min(1).max(50),
  progress: z.number().int().min(0).max(100).default(0),
  trendType: z.enum(['bar', 'line']).default('bar'),
  trendData: z.array(z.number()).default([]),
  category: z.string().max(100).optional(),
  period: z.string().max(50).default('Monthly'),
  quarter: z.string().max(10).optional(),
  department: z.string().max(100).optional(),
  assigneeUrl: z.string().url().optional().or(z.literal('')),
  badgeText: z.string().max(200).optional(),
});

export const updateKpiBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['on-track', 'exceeded', 'off-track', 'at-risk']).optional(),
  value: z.string().min(1).max(50).optional(),
  target: z.string().min(1).max(50).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  trendType: z.enum(['bar', 'line']).optional(),
  trendData: z.array(z.number()).optional(),
  category: z.string().max(100).optional(),
  period: z.string().max(50).optional(),
  quarter: z.string().max(10).optional(),
  department: z.string().max(100).optional(),
  assigneeUrl: z.string().url().optional().nullable(),
  badgeText: z.string().max(200).optional().nullable(),
});

export type ListKpisQuery = z.infer<typeof listKpisQuerySchema>;
export type KpiParams = z.infer<typeof kpiParamsSchema>;
export type CreateKpiBody = z.infer<typeof createKpiBodySchema>;
export type UpdateKpiBody = z.infer<typeof updateKpiBodySchema>;
