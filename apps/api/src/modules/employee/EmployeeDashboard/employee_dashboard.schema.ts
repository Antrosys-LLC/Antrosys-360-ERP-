import { z } from 'zod';

export const calendarQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const payslipParamsSchema = z.object({
  payslipId: z.string().cuid(),
});

export const checkInBodySchema = z.object({
  location: z.string().max(200).optional(),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type PayslipParams = z.infer<typeof payslipParamsSchema>;
export type CheckInBody = z.infer<typeof checkInBodySchema>;
