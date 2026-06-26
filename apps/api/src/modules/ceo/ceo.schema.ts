import { z } from 'zod';

export const periodQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  compare: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export const revenueTrendQuerySchema = periodQuerySchema.extend({
  range: z.enum(['Monthly', 'Quarterly', 'Annual']).default('Monthly'),
});

export const exportQuerySchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
});

export const overrideParamsSchema = z.object({
  taskId: z.string().cuid(),
});

export const systemActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type RevenueTrendQuery = z.infer<typeof revenueTrendQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
export type OverrideParams = z.infer<typeof overrideParamsSchema>;
export type SystemActivityQuery = z.infer<typeof systemActivityQuerySchema>;
