import { FastifyReply, FastifyRequest } from 'fastify';
import {
  listClientsQuerySchema,
  clientParamsSchema,
  createClientBodySchema,
  updateClientBodySchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  taskParamsSchema,
} from './clients.schema';
import * as clientService from './clients.service';

export async function listClientsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listClientsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const result = await clientService.listClients(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getClientByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const client = await clientService.getClientById(parsed.data.clientId);
  if (!client) return reply.code(404).send({ status: 'error', error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: client });
}

export async function createClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createClientBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const created = await clientService.createClient(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: created });
}

export async function updateClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = updateClientBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await clientService.updateClient(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const deleted = await clientService.deleteClient(parsed.data.clientId, request.user.id);
  if (!deleted) return reply.code(404).send({ status: 'error', error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: { id: deleted.id } });
}

export async function getClientSummaryHandler(_request: FastifyRequest, reply: FastifyReply) {
  const summary = await clientService.getClientSummary();
  return reply.code(200).send({ status: 'success', data: summary });
}

export async function getClientPipelineHandler(_request: FastifyRequest, reply: FastifyReply) {
  const pipeline = await clientService.getClientPipeline();
  return reply.code(200).send({ status: 'success', data: pipeline });
}

export async function getClientTimelineHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const timeline = await clientService.getClientTimeline(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: timeline });
}

export async function getClientTasksHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const tasks = await clientService.getClientTasks(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: tasks });
}

export async function createClientTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = createTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const task = await clientService.createClientTask(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: task });
}

export async function updateClientTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = taskParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = updateTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await clientService.updateClientTask(paramsParsed.data.taskId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'Task not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}
