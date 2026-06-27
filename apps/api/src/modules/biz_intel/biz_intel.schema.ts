import { z } from 'zod';

export const customReportConfigSchema = z.object({
  xAxis: z.string().min(1),
  yAxis: z.array(z.string()).min(1),
  settings: z.object({
    showDataLabels: z.boolean().default(true),
    showLegend: z.boolean().default(true),
    trendline: z.boolean().default(false),
  }).default({
    showDataLabels: true,
    showLegend: true,
    trendline: false,
  }),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).default([]),
  exportFormat: z.string().default('pdf'),
});

export const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  iconType: z.enum(['trend', 'pipeline', 'target', 'turnover']).default('trend'),
  isFavourite: z.boolean().optional().default(false),
  isShared: z.boolean().optional().default(false),
  config: customReportConfigSchema.optional(),
});

export const createScheduleSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  title: z.string().min(1, 'Title is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  info: z.string().min(1, 'Schedule summary is required'),
  deliveryMethod: z.enum(['email', 'pdf']).default('pdf'),
  isActive: z.boolean().optional().default(true),
});

export const reportIdParamSchema = z.object({
  id: z.string().min(1),
});

export const toggleFavouriteSchema = z.object({
  isFavourite: z.boolean(),
});

export const chartQuerySchema = z.object({
  xAxis: z.string().min(1),
  yAxis: z.string().min(1), // comma separated values
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type ToggleFavouriteInput = z.infer<typeof toggleFavouriteSchema>;
export type ChartQueryInput = z.infer<typeof chartQuerySchema>;
