import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listClientsHandler,
  getClientHandler,
  createClientHandler,
  updateClientHandler,
  deleteClientHandler,
  listStatusesHandler,
  listRenewalsHandler,
  createRenewalHandler,
  updateRenewalHandler,
  listActivitiesHandler,
  createActivityHandler,
  listProjectsHandler,
  createProjectHandler,
  updateProjectHandler,
  listTasksHandler,
  createTaskHandler,
  updateTaskHandler,
  listTimelineHandler,
  getSummaryHandler,
} from './clients.controller';

const CLIENTS_READ: Permission = 'clients:read';
const CLIENTS_WRITE: Permission = 'clients:write';

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // ── Summary ────────────────────────────────────────────────────────────
  fastify.get('/summary', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getSummaryHandler,
  });

  // ── Client CRUD ────────────────────────────────────────────────────────
  fastify.get('/', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listClientsHandler,
  });

  fastify.get('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createClientHandler,
  });

  fastify.patch('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateClientHandler,
  });

  fastify.delete('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: deleteClientHandler,
  });

  // ── Status ─────────────────────────────────────────────────────────────
  fastify.get('/:clientId/statuses', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listStatusesHandler,
  });

  // ── Renewal ────────────────────────────────────────────────────────────
  fastify.get('/:clientId/renewals', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listRenewalsHandler,
  });

  fastify.post('/:clientId/renewals', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createRenewalHandler,
  });

  fastify.patch('/:clientId/renewals/:renewalId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateRenewalHandler,
  });

  // ── Activity ───────────────────────────────────────────────────────────
  fastify.get('/:clientId/activities', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listActivitiesHandler,
  });

  fastify.post('/:clientId/activities', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createActivityHandler,
  });

  // ── Project ────────────────────────────────────────────────────────────
  fastify.get('/:clientId/projects', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listProjectsHandler,
  });

  fastify.post('/:clientId/projects', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createProjectHandler,
  });

  fastify.patch('/:clientId/projects/:projectId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateProjectHandler,
  });

  // ── Task ───────────────────────────────────────────────────────────────
  fastify.get('/:clientId/tasks', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listTasksHandler,
  });

  fastify.post('/:clientId/tasks', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createTaskHandler,
  });

  fastify.patch('/:clientId/tasks/:taskId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateTaskHandler,
  });

  // ── Timeline ───────────────────────────────────────────────────────────
  fastify.get('/:clientId/timeline', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listTimelineHandler,
  });
}
