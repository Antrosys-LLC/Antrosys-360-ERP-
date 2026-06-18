import { FastifyInstance } from 'fastify';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: async () => ({ module: 'users', status: 'wip' }),
  });
}
