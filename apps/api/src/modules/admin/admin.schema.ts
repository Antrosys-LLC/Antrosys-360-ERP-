import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 50)),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userParamsSchema = z.object({
  id: z.string().min(1),
});

export type UserParams = z.infer<typeof userParamsSchema>;

export const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

export const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export const listAuditLogsQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 50)),
  userId: z.string().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

const ROLE_VALUES = [
  'CEO', 'CFO', 'OPERATIONS_HEAD', 'HR_HEAD', 'FINANCE_MANAGER',
  'PROJECT_MANAGER', 'MANAGER', 'TEAM_LEAD', 'EMPLOYEE', 'SUB_MANAGER',
] as const;

export const setModuleAccessBodySchema = z.object({
  role: z.enum(ROLE_VALUES),
  module: z.string().min(1).max(50),
  accessLevel: z.enum(['OFF', 'READ', 'FULL']),
});

export type SetModuleAccessBody = z.infer<typeof setModuleAccessBodySchema>;
