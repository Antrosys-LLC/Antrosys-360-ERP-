import { FastifyInstance } from 'fastify';

export async function manpowerRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('manpower:read')],
    handler: async () => ({ module: 'manpower', status: 'wip' }),
  });
}
