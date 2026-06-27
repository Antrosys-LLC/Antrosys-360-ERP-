import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listOnboardingsHandler,
  getOnboardingSummaryHandler,
  getOnboardingByIdHandler,
  createOnboardingHandler,
  updateOnboardingHandler,
  toggleTaskHandler,
  sendCommunicationHandler,
} from './onboarding.controller';

const HR_READ: Permission = 'hr:read';
const HR_WRITE: Permission = 'hr:write';

export async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: listOnboardingsHandler,
  });

  fastify.get('/summary', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: getOnboardingSummaryHandler,
  });

  fastify.get('/:onboardingId', {
    preHandler: [fastify.requirePermission(HR_READ)],
    handler: getOnboardingByIdHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: createOnboardingHandler,
  });

  fastify.patch('/:onboardingId', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: updateOnboardingHandler,
  });

  fastify.patch('/:onboardingId/tasks/:taskId', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: toggleTaskHandler,
  });

  fastify.post('/:onboardingId/communicate', {
    preHandler: [fastify.requirePermission(HR_WRITE)],
    handler: sendCommunicationHandler,
  });
}
