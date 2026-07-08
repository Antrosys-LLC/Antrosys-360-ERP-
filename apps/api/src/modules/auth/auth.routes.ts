import { FastifyInstance } from 'fastify';
import { loginHandler, refreshHandler, logoutHandler, mfaSetupHandler, mfaVerifyHandler, permissionsHandler } from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes (no auth required)
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    handler: loginHandler,
  });

  fastify.post('/refresh', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    handler: refreshHandler,
  });

  // Protected routes (require JWT)
  fastify.post('/logout', {
    preHandler: [fastify.verifyJwt],
    handler: logoutHandler,
  });

  fastify.get('/permissions', {
    preHandler: [fastify.verifyJwt],
    handler: permissionsHandler,
  });

  fastify.post('/mfa/setup', {
    preHandler: [fastify.verifyJwt],
    handler: mfaSetupHandler,
  });

  fastify.post('/mfa/verify', {
    preHandler: [fastify.verifyJwt],
    handler: mfaVerifyHandler,
  });
}
