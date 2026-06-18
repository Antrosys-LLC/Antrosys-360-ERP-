import { FastifyInstance } from 'fastify';

export async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: async () => ({ module: 'onboarding', status: 'wip' }),
  });
}
