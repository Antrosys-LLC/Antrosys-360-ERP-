import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  getLeaveBalancesHandler,
  listLeaveRequestsHandler,
  createLeaveRequestHandler,
  cancelLeaveRequestHandler,
  getPendingApprovalsHandler,
  updateLeaveStatusHandler,
  getLeaveMetricsHandler,
} from './leave.controller';

const READ: Permission = 'leave:read';
const WRITE: Permission = 'leave:write';

export async function leaveRoutes(fastify: FastifyInstance) {
  // All routes in this plugin require a valid JWT
  fastify.addHook('preHandler', fastify.verifyJwt);

  // ─── Balances & Metrics ─────────────────────────────────────────────────
  fastify.get('/balances', {
    preHandler: [fastify.requirePermission(READ)],
    handler: getLeaveBalancesHandler,
  });

  fastify.get('/metrics', {
    preHandler: [fastify.requirePermission(READ)],
    handler: getLeaveMetricsHandler,
  });

  // ─── Leave Requests ──────────────────────────────────────────────────────
  fastify.get('/', {
    preHandler: [fastify.requirePermission(READ)],
    handler: listLeaveRequestsHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(WRITE)], // Employees can submit
    handler: createLeaveRequestHandler,
  });

  fastify.delete('/:leaveId', {
    preHandler: [fastify.requirePermission(WRITE)], // Cancel own request
    handler: cancelLeaveRequestHandler,
  });

  // ─── Manager Approvals ──────────────────────────────────────────────────
  fastify.get('/approvals', {
    preHandler: [fastify.requirePermission(WRITE)], // Only managers should see approvals queue
    handler: getPendingApprovalsHandler,
  });

  fastify.patch('/:leaveId/status', {
    preHandler: [fastify.requirePermission(WRITE)], // Manager approves/rejects
    handler: updateLeaveStatusHandler,
  });
}
