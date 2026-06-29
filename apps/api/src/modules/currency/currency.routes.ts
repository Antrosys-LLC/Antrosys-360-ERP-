import { FastifyInstance } from 'fastify';
import { getCurrencyHandler } from './currency.controller';

export async function currencyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    handler: getCurrencyHandler,
  });
}
