import { FastifyInstance } from 'fastify';

export async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('attendance:read')],
    handler: async () => ({ module: 'attendance', status: 'wip' }),
  });
}
