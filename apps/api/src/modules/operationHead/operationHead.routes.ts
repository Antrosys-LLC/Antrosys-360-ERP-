import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  getDashboardHandler,
  listOpsLeavesHandler,
  overrideAttendanceHandler,
  raiseManpowerRequestHandler,
  toggleFlagHandler,
  updateLeaveStatusHandler,
} from './operationHead.controller';

const ATTENDANCE_READ: Permission = 'attendance:read';
const ATTENDANCE_WRITE: Permission = 'attendance:write';
const LEAVE_READ: Permission = 'leave:read';
const LEAVE_WRITE: Permission = 'leave:write';
const MANPOWER_WRITE: Permission = 'manpower:write';

export async function operationHeadRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission(ATTENDANCE_READ)],
    handler: getDashboardHandler,
  });

  fastify.get('/leaves', {
    preHandler: [fastify.requirePermission(LEAVE_READ)],
    handler: listOpsLeavesHandler,
  });

  fastify.patch('/leaves/:leaveId', {
    preHandler: [fastify.requirePermission(LEAVE_WRITE)],
    handler: updateLeaveStatusHandler,
  });

  fastify.post('/attendance/:employeeId/flag', {
    preHandler: [fastify.requirePermission(ATTENDANCE_WRITE)],
    handler: toggleFlagHandler,
  });

  fastify.put('/attendance/:employeeId', {
    preHandler: [fastify.requirePermission(ATTENDANCE_WRITE)],
    handler: overrideAttendanceHandler,
  });

  fastify.post('/manpower-requests', {
    preHandler: [fastify.requirePermission(MANPOWER_WRITE)],
    handler: raiseManpowerRequestHandler,
  });
}
