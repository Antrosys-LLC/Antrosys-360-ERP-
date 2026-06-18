import { FastifyInstance } from 'fastify';

export async function invoicesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('finance:read')],
    handler: async () => ({ module: 'invoices', status: 'wip' }),
  });
}
