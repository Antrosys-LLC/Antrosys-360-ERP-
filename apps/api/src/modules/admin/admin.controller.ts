import { FastifyRequest, FastifyReply } from 'fastify';
import {
  listUsersQuerySchema,
  userParamsSchema,
  createUserBodySchema,
  updateUserBodySchema,
  listAuditLogsQuerySchema,
} from './admin.schema';
import * as adminService from './admin.service';

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listUsersQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await adminService.listUsers(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = userParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const user = await adminService.getUser(parsed.data.id);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return reply.code(200).send({ status: 'success', data: user });
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createUserBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const existing = await adminService.listUsers({ email: parsed.data.email } as any);
  if (existing.total > 0) {
    return reply.code(409).send({ error: 'Email already in use' });
  }

  const user = await adminService.createUser(parsed.data);
  return reply.code(201).send({ status: 'success', data: user });
}

export async function updateUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = userParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateUserBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const updated = await adminService.updateUser(paramsParsed.data.id, bodyParsed.data);
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = userParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await adminService.deleteUser(parsed.data.id);
  if (!deleted) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function listAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listAuditLogsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await adminService.listAuditLogs(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}
