import { FastifyInstance } from 'fastify';

export async function leaveRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('leave:read')],
    handler: async () => ({ module: 'leave', status: 'wip' }),
  });
}
