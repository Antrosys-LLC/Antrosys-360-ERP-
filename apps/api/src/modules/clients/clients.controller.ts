import { FastifyReply, FastifyRequest } from 'fastify';
import {
  clientParamsSchema,
  listClientsQuerySchema,
  createClientBodySchema,
  updateClientBodySchema,
  createRenewalBodySchema,
  updateRenewalBodySchema,
  createActivityBodySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  listTimelineQuerySchema,
  createContactBodySchema,
  updateContactBodySchema,
  updateSalesStageBodySchema,
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
  try {
    const client = await clientsService.createClient(parsed.data, request.user.id);
    return reply.code(201).send({ status: 'success', data: client });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return reply.code(409).send({ error: 'A client with this code already exists' });
    }
    request.log.error({ err }, 'Failed to create client');
    return reply.code(500).send({ error: 'Failed to create client' });
  }
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

export async function getSalesPipelineHandler(_request: FastifyRequest, reply: FastifyReply) {
  const pipeline = await clientsService.getSalesPipeline();
  return reply.code(200).send({ status: 'success', data: pipeline });
}

export async function getRecentTimelineHandler(request: FastifyRequest, reply: FastifyReply) {
  const limit = Number((request.query as { limit?: string }).limit) || 10;
  const timeline = await clientsService.getRecentTimeline(limit);
  return reply.code(200).send({ status: 'success', data: timeline });
}

export async function getUpcomingTasksHandler(request: FastifyRequest, reply: FastifyReply) {
  const limit = Number((request.query as { limit?: string }).limit) || 10;
  const tasks = await clientsService.getUpcomingTasks(limit);
  return reply.code(200).send({ status: 'success', data: tasks });
}

export async function getAlertsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const alerts = await clientsService.getAlerts();
  return reply.code(200).send({ status: 'success', data: alerts });
}

export async function exportClientsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const csv = await clientsService.exportClients();
  return reply
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', 'attachment; filename="clients-export.csv"')
    .code(200)
    .send(csv);
}

export async function importClientsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const body = request.body as { csv?: string };
  if (!body?.csv) return reply.code(400).send({ error: 'CSV content required' });
  const result = await clientsService.importClients(body.csv, request.user.id);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function updateSalesStageHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateSalesStageBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const updated = await clientsService.updateClientSalesStage(
    paramsParsed.data.clientId,
    bodyParsed.data.salesStage,
    request.user.id,
  );
  return reply.code(200).send({ status: 'success', data: updated });
}

// ─── Contacts ──────────────────────────────────────────────────────────────

export async function listContactsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = clientParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  const contacts = await clientsService.listContacts(parsed.data.clientId);
  return reply.code(200).send({ status: 'success', data: contacts });
}

export async function createContactHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = createContactBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const contact = await clientsService.createContact(paramsParsed.data.clientId, bodyParsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: contact });
}

export async function updateContactHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  const bodyParsed = updateContactBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const { contactId, clientId } = request.params as { contactId: string; clientId: string };
  const updated = await clientsService.updateContact(contactId, clientId, bodyParsed.data, request.user.id);
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteContactHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = clientParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const { contactId, clientId } = request.params as { contactId: string; clientId: string };
  await clientsService.deleteContact(contactId, clientId, request.user.id);
  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}
