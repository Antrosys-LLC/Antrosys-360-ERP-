import { z } from 'zod';

export const payrollLineStatusSchema = z.enum(['PENDING', 'PROCESSING', 'ON_HOLD', 'VERIFIED']);

export const payslipTemplateSchema = z.enum(['standard', 'detailed']);

export const dashboardQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  payrollId: z.string().min(1).optional(),
});

export const payrollParamsSchema = z.object({
  payrollId: z.string().min(1),
});

export const lineItemParamsSchema = z.object({
  payrollId: z.string().min(1),
  lineItemId: z.string().min(1),
});

export const listEmployeesQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: payrollLineStatusSchema.optional(),
  grade: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const runPayrollBodySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

export const updateLineItemBodySchema = z.object({
  status: payrollLineStatusSchema,
  holdReason: z.string().max(500).optional(),
});

export const approveLinesBodySchema = z.object({
  lineItemIds: z.array(z.string().min(1)).min(1),
});

export const payslipConfigBodySchema = z.object({
  email: z.boolean(),
  pdf: z.boolean(),
  whatsapp: z.boolean(),
  template: payslipTemplateSchema,
});

export const generatePayslipsBodySchema = z.object({
  scope: z.enum(['all', 'verified_only']).default('verified_only'),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type PayrollParams = z.infer<typeof payrollParamsSchema>;
export type LineItemParams = z.infer<typeof lineItemParamsSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type RunPayrollBody = z.infer<typeof runPayrollBodySchema>;
export type UpdateLineItemBody = z.infer<typeof updateLineItemBodySchema>;
export type ApproveLinesBody = z.infer<typeof approveLinesBodySchema>;
export type PayslipConfigBody = z.infer<typeof payslipConfigBodySchema>;
export type GeneratePayslipsBody = z.infer<typeof generatePayslipsBodySchema>;
