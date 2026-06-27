import { FastifyInstance } from 'fastify';
import {
  listEmployeesHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  upsertSkillHandler,
  deleteSkillHandler,
} from './employees.controller';

export async function employeesRoutes(fastify: FastifyInstance) {
  // Ensure all routes under this plugin require a valid JWT
  fastify.addHook('preHandler', fastify.verifyJwt);

  // List all employees (Directory view)
  fastify.get('/', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listEmployeesHandler,
  });

  // Get single employee profile details
  fastify.get('/:id', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmployeeHandler,
  });

  // Update employee personal/employment data
  fastify.put('/:id', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateEmployeeHandler,
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
}
