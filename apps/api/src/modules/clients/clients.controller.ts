import { FastifyReply, FastifyRequest } from 'fastify';
import {
  clientParamsSchema,
  listClientsQuerySchema,
  createClientBodySchema,
  updateClientBodySchema,
  createStatusBodySchema,
  createRenewalBodySchema,
  updateRenewalBodySchema,
  createActivityBodySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  listTimelineQuerySchema,
} from './clients.schema';
import * as clientsService from './clients.service';

function validationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({ error: 'Validation failed', details: error });
}

// ─── Client CRUD ───────────────────────────────────────────────────────────

export async function listClientsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listClientsQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const result = await clientsService.listClients(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const client = await clientsService.getClientById(parsed.data.clientId);
  if (!client) return reply.code(404).send({ error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: client });
}

export async function createClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createClientBodySchema.safeParse(request.body);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const client = await clientsService.createClient(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: client });
}

export async function updateClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateClientBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const updated = await clientsService.updateClient(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteClientHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const deleted = await clientsService.deleteClient(parsed.data.clientId, request.user.id);
  if (!deleted) return reply.code(404).send({ error: 'Client not found' });
  return reply.code(200).send({ status: 'success', data: deleted });
}

// ─── Status ────────────────────────────────────────────────────────────────

export async function listStatusesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const statuses = await clientsService.listStatuses(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: statuses });
}

// ─── Renewal ───────────────────────────────────────────────────────────────

export async function listRenewalsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const renewals = await clientsService.listRenewals(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: renewals });
}

export async function createRenewalHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = createRenewalBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const renewal = await clientsService.createRenewal(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: renewal });
}

export async function updateRenewalHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params as any);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateRenewalBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const { renewalId, clientId } = request.params as any;
  const updated = await clientsService.updateRenewal(renewalId, clientId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ error: 'Renewal not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

// ─── Activity ──────────────────────────────────────────────────────────────

export async function listActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const activities = await clientsService.listActivities(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: activities });
}

export async function createActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = createActivityBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const activity = await clientsService.createActivity(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: activity });
}

// ─── Project ───────────────────────────────────────────────────────────────

export async function listProjectsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const projects = await clientsService.listProjects(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: projects });
}

export async function createProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = createProjectBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const project = await clientsService.createProject(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: project });
}

export async function updateProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params as any);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateProjectBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const { projectId, clientId } = request.params as any;
  const updated = await clientsService.updateProject(projectId, clientId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ error: 'Project not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

// ─── Task ──────────────────────────────────────────────────────────────────

export async function listTasksHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const tasks = await clientsService.listTasks(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: tasks });
}

export async function createTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = createTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const task = await clientsService.createTask(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: task });
}

export async function updateTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params as any);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const { taskId, clientId } = request.params as any;
  const updated = await clientsService.updateTask(taskId, clientId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ error: 'Task not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

// ─── Timeline ──────────────────────────────────────────────────────────────

export async function listTimelineHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const queryParsed = listTimelineQuerySchema.safeParse(request.query);
  if (!queryParsed.success) return validationError(reply, queryParsed.error.flatten());
  const timeline = await clientsService.listTimeline(paramsParsed.data.clientId, queryParsed.data);
  return reply.code(200).send({ status: 'success', data: timeline });
}

// ─── Dashboard Summary ─────────────────────────────────────────────────────

export async function getSummaryHandler(_request: FastifyRequest, reply: FastifyReply) {
  const summary = await clientsService.getSummary();
  return reply.code(200).send({ status: 'success', data: summary });
}
