import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  listEmployeesHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  updateEmployeeEmploymentHandler,
  listManagerOptionsHandler,
  getEmploymentFieldOptionsHandler,
  upsertSkillHandler,
  deleteSkillHandler,
  getEmployeePayslipsHandler,
  downloadEmployeePayslipHandler,
  getEmployeeAttendanceHandler,
  exportEmployeeAttendanceHandler,
} from './employees.controller';
import { canUserEditEmployee } from './employees.scope';

async function requireScope(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const allowed = await canUserEditEmployee(request.user.id, request.user.role, id);
  if (!allowed) {
    return reply.code(403).send({ error: 'Insufficient permissions to edit this employee' });
  }
}

export async function employeesRoutes(fastify: FastifyInstance) {
  // Ensure all routes under this plugin require a valid JWT
  fastify.addHook('preHandler', fastify.verifyJwt);

  // List all employees (Directory view)
  fastify.get('/', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listEmployeesHandler,
  });

  fastify.get('/manager-options', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listManagerOptionsHandler,
  });

  fastify.get('/employment-options', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmploymentFieldOptionsHandler,
  });

  // Get single employee profile details
  fastify.get('/:id', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmployeeHandler,
  });

  // Update employee personal data
  fastify.put('/:id', {
    preHandler: [fastify.requirePermission('hr:write'), requireScope],
    handler: updateEmployeeHandler,
  });

  fastify.put('/:id/employment', {
    preHandler: [fastify.requirePermission('hr:write'), requireScope],
    handler: updateEmployeeEmploymentHandler,
  });

  // Add or update an employee skill
  fastify.post('/:id/skills', {
    preHandler: [fastify.requirePermission('hr:write'), requireScope],
    handler: upsertSkillHandler,
  });

  // Delete an employee skill
  fastify.delete('/:id/skills/:skillId', {
    preHandler: [fastify.requirePermission('hr:write'), requireScope],
    handler: deleteSkillHandler,
  });

  // CSV export for monthly attendance logs
  fastify.get('/:id/attendance/export', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: exportEmployeeAttendanceHandler,
  });

  // Monthly attendance logs for employee profile
  fastify.get('/:id/attendance', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmployeeAttendanceHandler,
  });

  // List employee payslips (filterable by year)
  fastify.get('/:id/payslips', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmployeePayslipsHandler,
  });

  // Download a payslip PDF
  fastify.get('/:id/payslips/:payslipId/download', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: downloadEmployeePayslipHandler,
  });
}
