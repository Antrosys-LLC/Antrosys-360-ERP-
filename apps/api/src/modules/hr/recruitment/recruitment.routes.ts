import { FastifyInstance } from 'fastify';

export async function recruitmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('recruitment:read')],
    handler: async () => ({ module: 'recruitment', status: 'wip' }),
  });
}
