import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listClientsHandler,
  getClientByIdHandler,
  createClientHandler,
  updateClientHandler,
  deleteClientHandler,
  getClientSummaryHandler,
  getClientPipelineHandler,
  getClientTimelineHandler,
  getClientTasksHandler,
  createClientTaskHandler,
  updateClientTaskHandler,
} from './clients.controller';

const CLIENTS_READ: Permission = 'clients:read';
const CLIENTS_WRITE: Permission = 'clients:write';

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: listClientsHandler,
  });

  fastify.get('/summary', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientSummaryHandler,
  });

  fastify.get('/pipeline', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientPipelineHandler,
  });

  fastify.get('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientByIdHandler,
  });

  fastify.get('/:clientId/timeline', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientTimelineHandler,
  });

  fastify.get('/:clientId/tasks', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientTasksHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createClientHandler,
  });

  fastify.post('/:clientId/tasks', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: createClientTaskHandler,
  });

  fastify.patch('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateClientHandler,
  });

  fastify.patch('/tasks/:taskId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: updateClientTaskHandler,
  });

  fastify.delete('/:clientId', {
    preHandler: [fastify.requirePermission(CLIENTS_WRITE)],
    handler: deleteClientHandler,
  });
}
