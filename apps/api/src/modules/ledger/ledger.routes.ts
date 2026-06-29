import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  createLedgerEntryHandler,
  getAccountingEquationHandler,
  getBudgetTrackersHandler,
  getBudgetVsActualHandler,
  getChartOfAccountsHandler,
  getLedgerEntryByIdHandler,
  getLedgerSummaryHandler,
  getMonthlyTrendHandler,
  listLedgerEntriesHandler,
  updateLedgerEntryHandler,
  voidLedgerEntryHandler,
} from './ledger.controller';

const LEDGER_READ_PERMISSION: Permission = 'finance:read';
const LEDGER_WRITE_PERMISSION: Permission = 'finance:write';

export async function ledgerRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: listLedgerEntriesHandler,
  });

  fastify.get('/summary', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getLedgerSummaryHandler,
  });
  
  fastify.get('/budget-vs-actual', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getBudgetVsActualHandler,
  });
  
  fastify.get('/monthly-trend', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getMonthlyTrendHandler,
  });
  
  fastify.get('/budget-trackers', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getBudgetTrackersHandler,
  });
  
  fastify.get('/chart-of-accounts', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getChartOfAccountsHandler,
  });
  
  fastify.get('/accounting-equation', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getAccountingEquationHandler,
  });

  fastify.get('/:entryId', {
    preHandler: [fastify.requirePermission(LEDGER_READ_PERMISSION)],
    handler: getLedgerEntryByIdHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(LEDGER_WRITE_PERMISSION)],
    handler: createLedgerEntryHandler,
  });

  fastify.patch('/:entryId', {
    preHandler: [fastify.requirePermission(LEDGER_WRITE_PERMISSION)],
    handler: updateLedgerEntryHandler,
  });

  fastify.post('/:entryId/void', {
    preHandler: [fastify.requirePermission(LEDGER_WRITE_PERMISSION)],
    handler: voidLedgerEntryHandler,
  });
}
