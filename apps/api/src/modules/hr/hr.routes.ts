import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  exportDashboardHandler,
  generateHrLetterHandler,
  getDashboardHandler,
  getEmployeeOptionsHandler,
  startOnboardingHandler,
} from './hr.controller';

const HR_READ: Permission = 'hr:read';
const HR_WRITE: Permission = 'hr:write';

export async function hrRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: getDashboardHandler,
  });

  fastify.get('/export', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: exportDashboardHandler,
  });

  fastify.get('/employees/options', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: getEmployeeOptionsHandler,
  });

  fastify.post('/letters', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: generateHrLetterHandler,
  });

  fastify.post('/onboarding', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: startOnboardingHandler,
  });
}
