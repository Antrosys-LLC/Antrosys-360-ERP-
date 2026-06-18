import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function rateLimitPluginFn(fastify: FastifyInstance) {
  // Auth routes get stricter rate limiting applied at route level
  // Global rate limiting (200 req/min) is already applied in app.ts
  // This plugin adds route-specific overrides for auth endpoints
  fastify.log.info('Rate limit plugin registered');
}

export const rateLimitPlugin = fp(rateLimitPluginFn, {
  name: 'rate-limit-plugin',
});

// Export config for auth routes to use stricter limits
export const authRateLimitConfig = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
};
