import { z } from 'zod';

export const updateLeaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const overrideAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON LEAVE']),
});

export const flagMemberSchema = z.object({
  isFlagged: z.boolean(),
});

export const postAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>;
export type OverrideAttendanceInput = z.infer<typeof overrideAttendanceSchema>;
export type FlagMemberInput = z.infer<typeof flagMemberSchema>;
export type PostAnnouncementInput = z.infer<typeof postAnnouncementSchema>;

export const teamReportQuerySchema = z.object({
  teamId: z.string().cuid().optional(),
});

export type TeamReportQuery = z.infer<typeof teamReportQuerySchema>;
