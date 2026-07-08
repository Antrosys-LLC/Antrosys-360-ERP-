import { z } from 'zod';

export const ONBOARDING_PHASES = [
  'PENDING',
  'DOCUMENTATION',
  'IT_SETUP',
  'HR_ORIENTATION',
  'TEAM_INTRO',
  'COMPLETED',
] as const;

export const onboardingPhaseSchema = z.enum(ONBOARDING_PHASES);

export const onboardParamsSchema = z.object({
  id: z.string().min(1),
});

export type OnboardParams = z.infer<typeof onboardParamsSchema>;

export const listOnboardEmployeesQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 50)),
  department: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export type ListOnboardEmployeesQuery = z.infer<typeof listOnboardEmployeesQuerySchema>;

export const createEmployeeBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  department: z.string().optional(),
  designation: z.string().optional(),
  grade: z.string().optional(),
  employmentStatus: z.string().optional().default('ONBOARDING'),
  joiningDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
});

export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;

export const updateEmployeeBodySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  grade: z.string().optional(),
  employmentStatus: z.string().optional(),
  joiningDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
});

export type UpdateEmployeeBody = z.infer<typeof updateEmployeeBodySchema>;

export const createTaskBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  phase: onboardingPhaseSchema.optional(),
  dueAt: z.string().optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

export const updateTaskBodySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  phase: onboardingPhaseSchema.nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  dueAt: z.string().nullable().optional(),
});

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

export const updatePhaseBodySchema = z.object({
  currentPhase: onboardingPhaseSchema,
});

export type UpdatePhaseBody = z.infer<typeof updatePhaseBodySchema>;

// Meetings
export const createMeetingBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().min(1),
  durationMins: z.number().int().positive().optional(),
  location: z.string().optional(),
  phase: onboardingPhaseSchema.optional(),
});

export type CreateMeetingBody = z.infer<typeof createMeetingBodySchema>;

export const updateMeetingBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  scheduledAt: z.string().min(1).optional(),
  durationMins: z.number().int().positive().optional(),
  location: z.string().nullable().optional(),
  phase: onboardingPhaseSchema.nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export type UpdateMeetingBody = z.infer<typeof updateMeetingBodySchema>;

export const meetingParamsSchema = z.object({
  meetingId: z.string().min(1),
});

export type MeetingParams = z.infer<typeof meetingParamsSchema>;

export const taskParamsSchema = z.object({
  taskId: z.string().min(1),
});

export type TaskParams = z.infer<typeof taskParamsSchema>;

export const createTeamBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional(),
});

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>;

export const updateTeamBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  department: z.string().optional(),
});

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>;

export const teamMemberParamsSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
});

export type TeamMemberParams = z.infer<typeof teamMemberParamsSchema>;

export const addTeamMemberBodySchema = z.object({
  employeeId: z.string().min(1),
});

export type AddTeamMemberBody = z.infer<typeof addTeamMemberBodySchema>;

export const sendMessageBodySchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;

export const messageParamsSchema = z.object({
  id: z.string().min(1),
});

export type MessageParams = z.infer<typeof messageParamsSchema>;
