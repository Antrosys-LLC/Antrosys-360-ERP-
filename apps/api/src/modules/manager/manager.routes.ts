import { FastifyInstance } from 'fastify';
import {
  approveAllLeavesHandler,
  getDashboardDataHandler,
  overrideAttendanceStatusHandler,
  postAnnouncementHandler,
  toggleFlagHandler,
  updateLeaveStatusHandler,
  generateTeamReportHandler,
} from './manager.controller';

export async function managerRoutes(fastify: FastifyInstance) {
  // Enforce JWT validation on all endpoints in this module
  fastify.addHook('preHandler', fastify.verifyJwt);

  // GET scoped dashboard data
  fastify.get('/', {
    preHandler: [fastify.requirePermission('attendance:read')],
    handler: getDashboardDataHandler,
  });

  // PATCH approve/reject leave request
  fastify.patch('/leaves/:leaveId', {
    preHandler: [fastify.requirePermission('leave:write')],
    handler: updateLeaveStatusHandler,
  });

  // POST approve all pending leaves
  fastify.post('/leaves/approve-all', {
    preHandler: [fastify.requirePermission('leave:write')],
    handler: approveAllLeavesHandler,
  });

  // POST new bulletin announcement
  fastify.post('/announcements', {
    preHandler: [fastify.requirePermission('announcements:write')],
    handler: postAnnouncementHandler,
  });

  // PUT manual override of attendance status
  fastify.put('/attendance/:employeeId', {
    preHandler: [fastify.requirePermission('attendance:write')],
    handler: overrideAttendanceStatusHandler,
  });

  // POST toggle flag status
  fastify.post('/attendance/:employeeId/flag', {
    preHandler: [fastify.requirePermission('attendance:write')],
    handler: toggleFlagHandler,
  });

  // GET generate team report CSV
  fastify.get('/report', {
    preHandler: [fastify.requirePermission('attendance:read')], // Adjust permission as necessary
    handler: generateTeamReportHandler,
  });
}
