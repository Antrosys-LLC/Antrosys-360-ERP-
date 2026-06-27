import { z } from 'zod';

export const onboardingParamsSchema = z.object({
  onboardingId: z.string().cuid(),
});

export const taskParamsSchema = z.object({
  taskId: z.string().cuid(),
});

export const createOnboardingBodySchema = z.object({
  employeeId: z.string().cuid(),
  buddyId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  templateType: z.string().max(100).optional(),
});

export const updateOnboardingBodySchema = z.object({
  phase: z.number().int().min(1).max(5).optional(),
  completion: z.number().int().min(0).max(100).optional(),
  buddyId: z.string().cuid().optional().nullable(),
  templateType: z.string().max(100).optional(),
});

export const toggleTaskBodySchema = z.object({
  done: z.boolean(),
});

export const communicateBodySchema = z.object({
  templateType: z.string().max(100),
  messageBody: z.string().min(1).max(5000),
  recipientEmail: z.string().email(),
});

export type OnboardingParams = z.infer<typeof onboardingParamsSchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;
export type CreateOnboardingBody = z.infer<typeof createOnboardingBodySchema>;
export type UpdateOnboardingBody = z.infer<typeof updateOnboardingBodySchema>;
export type ToggleTaskBody = z.infer<typeof toggleTaskBodySchema>;
export type CommunicateBody = z.infer<typeof communicateBodySchema>;
