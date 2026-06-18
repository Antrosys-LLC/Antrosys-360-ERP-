import { FastifyInstance } from 'fastify';

export async function employeesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: async () => ({ module: 'employees', status: 'wip' }),
  });
}
