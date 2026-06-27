import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(new Date().getUTCMonth() + 1),
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getUTCFullYear()),
});

export const exportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(new Date().getUTCMonth() + 1),
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getUTCFullYear()),
});

export const hrLetterBodySchema = z.object({
  employeeId: z.string().cuid(),
  type: z.enum(['OFFER', 'APPOINTMENT', 'EXPERIENCE', 'SALARY_CERTIFICATE', 'OTHER']),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  recipientEmail: z.string().email().optional(),
});

export const startOnboardingBodySchema = z.object({
  employeeId: z.string().cuid(),
  startDate: z.coerce.date(),
  targetEndDate: z.coerce.date().optional(),
});

export const employeeOptionsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'ONBOARDING', 'OFFER_SIGNED', 'ALL']).default('ALL'),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
export type HrLetterBody = z.infer<typeof hrLetterBodySchema>;
export type StartOnboardingBody = z.infer<typeof startOnboardingBodySchema>;
export type EmployeeOptionsQuery = z.infer<typeof employeeOptionsQuerySchema>;
