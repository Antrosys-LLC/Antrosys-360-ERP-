import { FastifyInstance } from 'fastify';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listAuditLogsHandler,
} from './admin.controller';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: async () => ({ module: 'admin', status: 'active' }),
  });

  fastify.get('/users', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: listUsersHandler,
  });

  fastify.get('/users/:id', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: getUserHandler,
  });

  fastify.post('/users', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: createUserHandler,
  });

  fastify.put('/users/:id', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: updateUserHandler,
  });

  fastify.delete('/users/:id', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: deleteUserHandler,
  });

  fastify.get('/audit-logs', {
    preHandler: [fastify.requirePermission('audit:read')],
    handler: listAuditLogsHandler,
  });
}
