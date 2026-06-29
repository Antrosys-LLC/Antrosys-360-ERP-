import { FastifyInstance } from 'fastify';
import {
  listOnboardEmployeesHandler,
  getOnboardEmployeeHandler,
  createEmployeeHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
  getDashboardStatsHandler,
  getEmployeeTasksHandler,
  createEmployeeTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
  listTeamsHandler,
  getTeamHandler,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
  addTeamMemberHandler,
  removeTeamMemberHandler,
  listMessagesHandler,
  sendMessageHandler,
  markMessageReadHandler,
} from './onboard.controller';

export async function onboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Dashboard stats
  fastify.get('/stats', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getDashboardStatsHandler,
  });

  // Employees
  fastify.get('/employees', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listOnboardEmployeesHandler,
  });

  fastify.get('/employees/:id', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getOnboardEmployeeHandler,
  });

  fastify.post('/employees', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: createEmployeeHandler,
  });

  fastify.put('/employees/:id', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateEmployeeHandler,
  });

  fastify.delete('/employees/:id', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: deleteEmployeeHandler,
  });

  // Employee tasks
  fastify.get('/employees/:id/tasks', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getEmployeeTasksHandler,
  });

  fastify.post('/employees/:id/tasks', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: createEmployeeTaskHandler,
  });

  fastify.patch('/tasks/:taskId', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateTaskHandler,
  });

  fastify.delete('/tasks/:taskId', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: deleteTaskHandler,
  });

  // Teams
  fastify.get('/teams', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listTeamsHandler,
  });

  fastify.get('/teams/:id', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: getTeamHandler,
  });

  fastify.post('/teams', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: createTeamHandler,
  });

  fastify.put('/teams/:id', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: updateTeamHandler,
  });

  fastify.delete('/teams/:id', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: deleteTeamHandler,
  });

  // Team members
  fastify.post('/teams/:id/members', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: addTeamMemberHandler,
  });

  fastify.delete('/teams/:id/members/:employeeId', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: removeTeamMemberHandler,
  });

  // Messages
  fastify.get('/messages', {
    preHandler: [fastify.requirePermission('hr:read')],
    handler: listMessagesHandler,
  });

  fastify.post('/messages', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: sendMessageHandler,
  });

  fastify.patch('/messages/:id/read', {
    preHandler: [fastify.requirePermission('hr:write')],
    handler: markMessageReadHandler,
  });
}
