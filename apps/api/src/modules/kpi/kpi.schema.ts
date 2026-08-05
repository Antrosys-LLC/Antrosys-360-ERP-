import { z } from 'zod';

export const departmentSchema = z.enum([
  'ENGINEERING',
  'OPERATIONS',
  'SALES',
  'FINANCE',
  'HR',
  'OTHER',
]);

export const statusSchema = z.enum(['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'EXCEEDED']);

export const quarterSchema = z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3 or Q4');

const nullableString = z.string().trim().nullable().optional();

// ============================================================================
// PARAMS
// ============================================================================

export const kpiParamsSchema = z.object({
  id: z.string().min(1, 'KPI ID is required'),
});

export type KpiParams = z.infer<typeof kpiParamsSchema>;

// ============================================================================
// QUERY – list / overview / export
// ============================================================================

const numericField = (max: number, label: string) =>
  z
    .string()
    .optional()
    .refine((v) => (v ? /^\d+$/.test(v) : true), `${label} must be a number`)
    .transform((v) => (v ? parseInt(v, 10) : undefined));

export const listKpisQuerySchema = z.object({
  department: departmentSchema.optional(),
  quarter: quarterSchema.optional(),
  year: numericField(2100, 'year'),
  status: statusSchema.optional(),
  search: z.string().trim().optional(),
  page: numericField(1_000_000, 'page').transform((v) => v ?? 1),
  limit: numericField(100, 'limit').transform((v) => v ?? 50),
});

export type ListKpisQuery = z.infer<typeof listKpisQuerySchema>;

// ============================================================================
// BODY – create
// ============================================================================

export const createKpiBodySchema = z
  .object({
    name: z.string().trim().min(1, 'KPI name is required').max(120),
    description: nullableString,
    department: departmentSchema.nullable().optional(),
    ownerEmployeeId: z.string().cuid().nullable().optional(),
    unit: nullableString,
    targetValue: z.number().nullable().optional(),
    currentValue: z.number().nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    status: statusSchema.optional(),
    trend: z.array(z.number()).max(120).optional(),
    quarter: quarterSchema.optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.progress != null && data.currentValue != null && data.targetValue != null && data.targetValue > 0) {
      const derived = Math.round((data.currentValue / data.targetValue) * 100);
      const supplied = data.progress;
      if (Math.abs(derived - supplied) > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['progress'],
          message: `Progress (${supplied}%) does not match current/target ratio (${derived}%). Set it explicitly or leave it blank to auto-calculate.`,
        });
      }
    }
  });

export type CreateKpiBody = z.infer<typeof createKpiBodySchema>;

// ============================================================================
// BODY – update (all fields optional)
// ============================================================================

export const updateKpiBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: nullableString,
    department: departmentSchema.nullable().optional(),
    ownerEmployeeId: z.string().cuid().nullable().optional(),
    unit: nullableString,
    targetValue: z.number().nullable().optional(),
    currentValue: z.number().nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    status: statusSchema.optional(),
    trend: z.array(z.number()).max(120).optional(),
    quarter: quarterSchema.optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided');

export type UpdateKpiBody = z.infer<typeof updateKpiBodySchema>;

export type KpiQueryFilters = {
  department?: z.infer<typeof departmentSchema>;
  quarter?: string;
  year?: number;
  status?: z.infer<typeof statusSchema>;
  search?: string;
};
