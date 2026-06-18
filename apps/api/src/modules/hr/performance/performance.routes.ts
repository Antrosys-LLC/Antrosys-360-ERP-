import { FastifyInstance } from 'fastify';

export async function performanceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: async () => ({ module: 'performance', status: 'wip' }),
  });
}
