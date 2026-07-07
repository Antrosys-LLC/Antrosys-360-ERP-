import { z } from 'zod';

export const deptFilterSchema = z.enum(['All', 'Eng', 'Ops', 'Fin', 'HR']);

export const dashboardQuerySchema = z.object({
  department: deptFilterSchema.default('All'),
});

export const leaveParamsSchema = z.object({
  leaveId: z.string().cuid(),
});

export const updateLeaveStatusBodySchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  declineNote: z.string().max(500).optional(),
}).refine(
  (data) => !(data.status === 'REJECTED' && !data.declineNote),
  { message: 'declineNote is required when rejecting a request', path: ['declineNote'] },
);

export const employeeParamsSchema = z.object({
  employeeId: z.string().cuid(),
});

export const overrideAttendanceBodySchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON LEAVE']),
});

export const flagAttendanceBodySchema = z.object({
  isFlagged: z.boolean(),
});

export const raiseManpowerRequestBodySchema = z.object({
  department: z.enum(['ENGINEERING', 'OPERATIONS', 'FINANCE', 'HR', 'SALES', 'OTHER']),
  additionalHeadcount: z.coerce.number().int().min(1).max(50).default(1),
  notes: z.string().max(500).optional(),
});

export const listOpsLeavesQuerySchema = z.object({
  status: z.enum(['PENDING_OPS_HEAD', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type UpdateLeaveStatusBody = z.infer<typeof updateLeaveStatusBodySchema>;
export type OverrideAttendanceBody = z.infer<typeof overrideAttendanceBodySchema>;
export type FlagAttendanceBody = z.infer<typeof flagAttendanceBodySchema>;
export type RaiseManpowerRequestBody = z.infer<typeof raiseManpowerRequestBodySchema>;
export type ListOpsLeavesQuery = z.infer<typeof listOpsLeavesQuerySchema>;
export type DeptFilter = z.infer<typeof deptFilterSchema>;
