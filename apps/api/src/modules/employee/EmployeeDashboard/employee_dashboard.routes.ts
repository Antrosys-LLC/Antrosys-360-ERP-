import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  checkInHandler,
  checkOutHandler,
  downloadPayslipHandler,
  getCalendarHandler,
  getDashboardHandler,
} from './employee_dashboard.controller';

const ATTENDANCE_READ: Permission = 'attendance:read';
const ATTENDANCE_WRITE: Permission = 'attendance:write';
const PAYROLL_READ: Permission = 'payroll:read';

export async function employeeDashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Self-scoped dashboard — service resolves employee from JWT userId only
  fastify.get('/', {
    handler: getDashboardHandler,
  });

  fastify.get('/calendar', {
    preHandler: [fastify.requirePermission(ATTENDANCE_READ)],
    handler: getCalendarHandler,
  });

  fastify.post('/check-in', {
    preHandler: [fastify.requirePermission(ATTENDANCE_WRITE)],
    handler: checkInHandler,
  });

  fastify.post('/check-out', {
    preHandler: [fastify.requirePermission(ATTENDANCE_WRITE)],
    handler: checkOutHandler,
  });

  fastify.get('/payslip/:payslipId/download', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: downloadPayslipHandler,
  });
}
