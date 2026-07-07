import { z } from 'zod';

// ─── Enums ─────────────────────────────────────────────────────────────────

export const leaveTypeSchema = z.enum(['ANNUAL', 'SICK', 'CASUAL', 'WFH', 'UNPAID', 'OTHER']);

export const leaveStatusSchema = z.enum(['PENDING', 'PENDING_OPS_HEAD', 'APPROVED', 'REJECTED', 'CANCELLED']);

// ─── Leave Requests ────────────────────────────────────────────────────────

export const createLeaveRequestBodySchema = z.object({
  type: leaveTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(500).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'endDate must be on or after startDate', path: ['endDate'] },
);

export const updateLeaveStatusBodySchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  declineNote: z.string().max(500).optional(),
}).refine(
  (data) => !(data.status === 'REJECTED' && !data.declineNote),
  { message: 'declineNote is required when rejecting a request', path: ['declineNote'] },
);

export const leaveRequestParamsSchema = z.object({
  leaveId: z.string().min(1),
});

export const listLeaveRequestsQuerySchema = z.object({
  status: leaveStatusSchema.optional(),
  type: leaveTypeSchema.optional(),
  employeeId: z.string().optional(), // manager-scoped filter
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Inferred Types ────────────────────────────────────────────────────────

export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type LeaveStatus = z.infer<typeof leaveStatusSchema>;
export type CreateLeaveRequestBody = z.infer<typeof createLeaveRequestBodySchema>;
export type UpdateLeaveStatusBody = z.infer<typeof updateLeaveStatusBodySchema>;
export type LeaveRequestParams = z.infer<typeof leaveRequestParamsSchema>;
export type ListLeaveRequestsQuery = z.infer<typeof listLeaveRequestsQuerySchema>;
