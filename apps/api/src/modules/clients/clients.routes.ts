import { FastifyInstance } from 'fastify';

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('clients:read')],
    handler: async () => ({ module: 'clients', status: 'wip' }),
  });
}
