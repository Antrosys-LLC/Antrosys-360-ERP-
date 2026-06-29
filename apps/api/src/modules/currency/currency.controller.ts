import { FastifyRequest, FastifyReply } from 'fastify';
import { APP_DEFAULT_CURRENCY, getCurrencyCatalog } from '../../shared/currency/currency-catalog';

export async function getCurrencyHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send({
    status: 'success',
    data: {
      defaultCurrency: APP_DEFAULT_CURRENCY,
      currencies: getCurrencyCatalog(),
    },
  });
}
