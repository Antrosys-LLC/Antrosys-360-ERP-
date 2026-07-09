import { FastifyInstance } from 'fastify';
import {
  listAccountsHandler,
  syncAccountHandler,
  listTransactionsHandler,
  getTransactionHandler,
  confirmMatchHandler,
  rejectMatchHandler,
  getReconciliationHealthHandler,
  getPriorityExceptionsHandler,
  getConnectionsHandler,
  connectBankHandler,
  createJournalEntryHandler,
} from './bank_feeds.controller';

export async function bankFeedsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Accounts
  fastify.get('/accounts', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: listAccountsHandler,
  });

  fastify.post('/accounts/:id/sync', {
    preHandler: [fastify.requirePermission('bank_feeds:write')],
    handler: syncAccountHandler,
  });

  fastify.post('/accounts', {
    preHandler: [fastify.requirePermission('bank_feeds:write')],
    handler: connectBankHandler,
  });

  // Transactions
  fastify.get('/transactions', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: listTransactionsHandler,
  });

  fastify.get('/transactions/:id', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: getTransactionHandler,
  });

  fastify.post('/transactions/:id/confirm', {
    preHandler: [fastify.requirePermission('bank_feeds:write')],
    handler: confirmMatchHandler,
  });

  fastify.post('/transactions/:id/reject', {
    preHandler: [fastify.requirePermission('bank_feeds:write')],
    handler: rejectMatchHandler,
  });

  fastify.post('/transactions/:id/create-journal', {
    preHandler: [fastify.requirePermission('bank_feeds:write')],
    handler: createJournalEntryHandler,
  });

  // Reconciliation & status
  fastify.get('/reconciliation-health', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: getReconciliationHealthHandler,
  });

  fastify.get('/priority-exceptions', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: getPriorityExceptionsHandler,
  });

  fastify.get('/connections', {
    preHandler: [fastify.requirePermission('bank_feeds:read')],
    handler: getConnectionsHandler,
  });
}
