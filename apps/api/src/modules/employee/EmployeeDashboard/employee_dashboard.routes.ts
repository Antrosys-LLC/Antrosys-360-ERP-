import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  checkInHandler,
  checkOutHandler,
  createAnnouncementHandler,
  createHolidayHandler,
  deleteAnnouncementHandler,
  deleteHolidayHandler,
  downloadPayslipHandler,
  getCalendarHandler,
  getDashboardHandler,
  submitMoodHandler,
  updateAnnouncementHandler,
  updateHolidayHandler,
} from './employee_dashboard.controller';

const ATTENDANCE_READ: Permission = 'attendance:read';
const ATTENDANCE_WRITE: Permission = 'attendance:write';
const PAYROLL_READ: Permission = 'payroll:read';
const ANNOUNCEMENTS_WRITE: Permission = 'announcements:write';

export async function employeeDashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

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

  fastify.post('/mood', {
    preHandler: [fastify.requirePermission(ATTENDANCE_WRITE)],
    handler: submitMoodHandler,
  });

  fastify.post('/announcements', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: createAnnouncementHandler,
  });

  fastify.patch('/announcements/:announcementId', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: updateAnnouncementHandler,
  });

  fastify.delete('/announcements/:announcementId', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: deleteAnnouncementHandler,
  });

  fastify.post('/holidays', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: createHolidayHandler,
  });

  fastify.patch('/holidays/:holidayId', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: updateHolidayHandler,
  });

  fastify.delete('/holidays/:holidayId', {
    preHandler: [fastify.requirePermission(ANNOUNCEMENTS_WRITE)],
    handler: deleteHolidayHandler,
  });

  fastify.get('/payslip/:payslipId/download', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: downloadPayslipHandler,
  });
}
