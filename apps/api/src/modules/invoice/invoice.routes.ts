import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  createInvoiceHandler,
  deleteInvoiceHandler,
  getInvoiceByIdHandler,
  listInvoicesHandler,
  sendInvoiceHandler,
  updateInvoiceHandler,
} from './invoice.controller';

const INVOICE_READ_PERMISSION: Permission = 'finance:read';
const INVOICE_WRITE_PERMISSION: Permission = 'finance:write';

export async function invoiceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission(INVOICE_READ_PERMISSION)],
    handler: listInvoicesHandler,
  });

  fastify.get('/:invoiceId', {
    preHandler: [fastify.requirePermission(INVOICE_READ_PERMISSION)],
    handler: getInvoiceByIdHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(INVOICE_WRITE_PERMISSION)],
    handler: createInvoiceHandler,
  });

  fastify.patch('/:invoiceId', {
    preHandler: [fastify.requirePermission(INVOICE_WRITE_PERMISSION)],
    handler: updateInvoiceHandler,
  });

  fastify.post('/:invoiceId/send', {
    preHandler: [fastify.requirePermission(INVOICE_WRITE_PERMISSION)],
    handler: sendInvoiceHandler,
  });

  fastify.delete('/:invoiceId', {
    preHandler: [fastify.requirePermission(INVOICE_WRITE_PERMISSION)],
    handler: deleteInvoiceHandler,
  });
}
