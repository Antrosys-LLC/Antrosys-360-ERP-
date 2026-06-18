import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const mfaSchema = z.object({
  token: z.string().length(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MfaInput = z.infer<typeof mfaSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
