import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  acceptTaskHandler,
  cancelTaskHandler,
  createEventHandler,
  deleteEventHandler,
  exportReportHandler,
  getActivitiesHandler,
  getCashflowHandler,
  getDashboardHandler,
  getEventsHandler,
  getInvoiceStatusHandler,
  getProfileHandler,
  getTasksHandler,
  updateEventHandler,
} from './cfo.controller';

const FINANCE_READ: Permission = 'finance:read';
const FINANCE_WRITE: Permission = 'finance:write';
const REPORTS_READ: Permission = 'reports:read';

export async function cfoRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getDashboardHandler,
  });

  fastify.get('/profile', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getProfileHandler,
  });

  fastify.get('/cashflow', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getCashflowHandler,
  });

  fastify.get('/invoice-status', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getInvoiceStatusHandler,
  });

  fastify.get('/tasks', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getTasksHandler,
  });

  fastify.patch('/tasks/:taskId/accept', {
    preHandler: [fastify.requirePermission(FINANCE_WRITE)],
    handler: acceptTaskHandler,
  });

  fastify.patch('/tasks/:taskId/cancel', {
    preHandler: [fastify.requirePermission(FINANCE_WRITE)],
    handler: cancelTaskHandler,
  });

  fastify.get('/activities', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getActivitiesHandler,
  });

  fastify.get('/events', {
    preHandler: [fastify.requirePermission(FINANCE_READ)],
    handler: getEventsHandler,
  });

  fastify.post('/events', {
    preHandler: [fastify.requirePermission(FINANCE_WRITE)],
    handler: createEventHandler,
  });

  fastify.patch('/events/:eventId', {
    preHandler: [fastify.requirePermission(FINANCE_WRITE)],
    handler: updateEventHandler,
  });

  fastify.delete('/events/:eventId', {
    preHandler: [fastify.requirePermission(FINANCE_WRITE)],
    handler: deleteEventHandler,
  });

  fastify.get('/export', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: exportReportHandler,
  });
}
