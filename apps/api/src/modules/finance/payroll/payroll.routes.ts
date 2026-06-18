import { FastifyInstance } from 'fastify';

export async function payrollRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('payroll:read')],
    handler: async () => ({ module: 'payroll', status: 'wip' }),
  });
}
