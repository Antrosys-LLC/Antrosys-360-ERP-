import { FastifyInstance } from 'fastify';
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
} from './employees.controller';

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
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateEmployeeHandler,
  });

  fastify.put('/:id/employment', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateEmployeeEmploymentHandler,
  });

  // Add or update an employee skill
  fastify.post('/:id/skills', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: upsertSkillHandler,
  });

  // Delete an employee skill
  fastify.delete('/:id/skills/:skillId', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: deleteSkillHandler,
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
