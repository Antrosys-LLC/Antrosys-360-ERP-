import { FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema, mfaSchema, refreshSchema } from './auth.schema';
import * as authService from './auth.service';

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await authService.validateCredentials(email, password);

  if (!user) {
    return reply.code(401).send({ error: 'Invalid email or password' });
  }

  if (user.mfaEnabled) {
    // Return partial response indicating MFA is required
    return reply.code(200).send({
      mfaRequired: true,
      userId: user.id,
    });
  }

  const tokens = await authService.generateTokenPair(user.id, user.role);
  return reply.code(200).send({
    mfaRequired: false,
    ...tokens,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const userId = await authService.verifyRefreshToken(parsed.data.refreshToken);
  if (!userId) {
    return reply.code(401).send({ error: 'Invalid or expired refresh token' });
  }

  const { PrismaClient } = await import('@prisma/client');
  const { prisma } = await import('../../config/database');
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    return reply.code(401).send({ error: 'User not found or inactive' });
  }

  const tokens = await authService.generateTokenPair(user.id, user.role);
  return reply.code(200).send(tokens);
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  await authService.invalidateSession(request.user.id);
  return reply.code(200).send({ message: 'Logged out successfully' });
}

export async function mfaSetupHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.generateMfaSecret(request.user.id);
  return reply.code(200).send(result);
}

export async function mfaVerifyHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = mfaSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const isValid = await authService.verifyMfaToken(request.user.id, parsed.data.token);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid MFA token' });
  }

  return reply.code(200).send({ verified: true });
}
