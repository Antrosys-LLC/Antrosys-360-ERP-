import { z } from 'zod';

export const cashflowPeriodSchema = z.enum(['year', 'quarter', 'month']);

export const dashboardQuerySchema = z.object({
  invoicePeriod: z.enum(['month', 'quarter', 'year']).default('month'),
});

export const cashflowQuerySchema = z.object({
  period: cashflowPeriodSchema.default('year'),
  offset: z.coerce.number().int().default(0),
});

export const invoiceStatusQuerySchema = z.object({
  period: z.enum(['month', 'quarter', 'year']).default('month'),
});

export const activitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const eventsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  calendarOffset: z.coerce.number().int().default(0),
});

export const exportQuerySchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
});

export const taskParamsSchema = z.object({
  taskId: z.string().cuid(),
});

export const eventParamsSchema = z.object({
  eventId: z.string().cuid(),
});

export const createEventBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional().nullable(),
  isHighlighted: z.boolean().optional().default(false),
});

export const updateEventBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional().nullable(),
  isHighlighted: z.boolean().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type CashflowQuery = z.infer<typeof cashflowQuerySchema>;
export type InvoiceStatusQuery = z.infer<typeof invoiceStatusQuerySchema>;
export type ActivitiesQuery = z.infer<typeof activitiesQuerySchema>;
export type EventsQuery = z.infer<typeof eventsQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;
export type EventParams = z.infer<typeof eventParamsSchema>;
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
