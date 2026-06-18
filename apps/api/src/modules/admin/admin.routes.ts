import { FastifyInstance } from 'fastify';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: async () => ({ module: 'admin', status: 'wip' }),
  });
}
