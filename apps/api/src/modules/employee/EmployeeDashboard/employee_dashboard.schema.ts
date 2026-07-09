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

export const submitMoodBodySchema = z.object({
  mood: z.enum(['HAPPY', 'NEUTRAL', 'STRESSED']),
});

export const announcementBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
});

export const announcementParamsSchema = z.object({
  announcementId: z.string().cuid(),
});

export const teamHolidayBodySchema = z.object({
  title: z.string().min(1).max(200),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const holidayParamsSchema = z.object({
  holidayId: z.string().cuid(),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type PayslipParams = z.infer<typeof payslipParamsSchema>;
export type CheckInBody = z.infer<typeof checkInBodySchema>;
export type SubmitMoodBody = z.infer<typeof submitMoodBodySchema>;
export type AnnouncementBody = z.infer<typeof announcementBodySchema>;
export type TeamHolidayBody = z.infer<typeof teamHolidayBodySchema>;
