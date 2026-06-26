import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  approveOverrideHandler,
  exportBoardReportHandler,
  getClientPipelineHandler,
  getCostBreakdownHandler,
  getDashboardHandler,
  getPendingOverridesHandler,
  getQuickActionsHandler,
  getRevenueTrendHandler,
  getSystemActivityHandler,
  getSystemHealthHandler,
  rejectOverrideHandler,
} from './ceo.controller';

const REPORTS_READ: Permission = 'reports:read';
const AUDIT_READ: Permission = 'audit:read';
const CLIENTS_READ: Permission = 'clients:read';
const ADMIN_WRITE: Permission = 'admin:write';

export async function ceoRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: getDashboardHandler,
  });

  fastify.get('/revenue-trend', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: getRevenueTrendHandler,
  });

  fastify.get('/cost-breakdown', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: getCostBreakdownHandler,
  });

  fastify.get('/client-pipeline', {
    preHandler: [fastify.requirePermission(CLIENTS_READ)],
    handler: getClientPipelineHandler,
  });

  fastify.get('/quick-actions', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: getQuickActionsHandler,
  });

  fastify.get('/system-activity', {
    preHandler: [fastify.requirePermission(AUDIT_READ)],
    handler: getSystemActivityHandler,
  });

  fastify.get('/system-health', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: getSystemHealthHandler,
  });

  fastify.get('/overrides', {
    preHandler: [fastify.requirePermission(ADMIN_WRITE)],
    handler: getPendingOverridesHandler,
  });

  fastify.patch('/overrides/:taskId/approve', {
    preHandler: [fastify.requirePermission(ADMIN_WRITE)],
    handler: approveOverrideHandler,
  });

  fastify.patch('/overrides/:taskId/reject', {
    preHandler: [fastify.requirePermission(ADMIN_WRITE)],
    handler: rejectOverrideHandler,
  });

  fastify.get('/export/board-report', {
    preHandler: [fastify.requirePermission(REPORTS_READ)],
    handler: exportBoardReportHandler,
  });
}
