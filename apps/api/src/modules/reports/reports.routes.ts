import { FastifyInstance } from 'fastify';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('reports:read')],
    handler: async () => ({ module: 'reports', status: 'wip' }),
  });
}
