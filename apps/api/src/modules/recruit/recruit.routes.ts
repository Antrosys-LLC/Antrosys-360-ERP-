import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listRequisitionsHandler,
  createRequisitionHandler,
  updateRequisitionHandler,
  deleteRequisitionHandler,
  listCandidatesHandler,
  createCandidateHandler,
  updateCandidateStageHandler,
  deleteCandidateHandler,
  getMetricsHandler,
} from './recruit.controller';

const READ: Permission = 'recruitment:read';
const WRITE: Permission = 'recruitment:write';

export async function recruitRoutes(fastify: FastifyInstance) {
  // All routes in this plugin require a valid JWT
  fastify.addHook('preHandler', fastify.verifyJwt);

  // ─── Metrics (summary, no path param needed) ────────────────────────────
  fastify.get('/metrics', {
    preHandler: [fastify.requirePermission(READ)],
    handler: getMetricsHandler,
  });

  // ─── Job Requisitions ────────────────────────────────────────────────────
  fastify.get('/requisitions', {
    preHandler: [fastify.requirePermission(READ)],
    handler: listRequisitionsHandler,
  });

  fastify.post('/requisitions', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: createRequisitionHandler,
  });

  fastify.patch('/requisitions/:requisitionId', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: updateRequisitionHandler,
  });

  fastify.delete('/requisitions/:requisitionId', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: deleteRequisitionHandler,
  });

  // ─── Candidates ──────────────────────────────────────────────────────────
  fastify.get('/candidates', {
    preHandler: [fastify.requirePermission(READ)],
    handler: listCandidatesHandler,
  });

  fastify.post('/candidates', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: createCandidateHandler,
  });

  /**
   * PATCH /candidates/:candidateId/stage
   * Used by the Kanban drag-and-drop to move a candidate between pipeline columns.
   */
  fastify.patch('/candidates/:candidateId/stage', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: updateCandidateStageHandler,
  });

  fastify.delete('/candidates/:candidateId', {
    preHandler: [fastify.requirePermission(WRITE)],
    handler: deleteCandidateHandler,
  });
}
