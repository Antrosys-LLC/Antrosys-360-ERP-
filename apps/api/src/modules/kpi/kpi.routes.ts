import { FastifyInstance } from 'fastify';
import {
  createKpiHandler,
  deleteKpiHandler,
  exportKpisHandler,
  getDepartmentAggregatesHandler,
  getKpiHandler,
  getKpiOverviewHandler,
  listKpiOwnersHandler,
  listKpisHandler,
  updateKpiHandler,
} from './kpi.controller';

export async function kpiRoutes(fastify: FastifyInstance) {
  // Every route in this module requires a valid JWT.
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Read-only endpoints (static routes declared before /:id).
  fastify.get('/', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: listKpisHandler,
  });

  fastify.get('/overview', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: getKpiOverviewHandler,
  });

  fastify.get('/departments', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: getDepartmentAggregatesHandler,
  });

  fastify.get('/owners', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: listKpiOwnersHandler,
  });

  fastify.get('/export', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: exportKpisHandler,
  });

  fastify.get('/:id', {
    preHandler: [fastify.requirePermission('kpi:read')],
    handler: getKpiHandler,
  });

  // Write endpoints.
  fastify.post('/', {
    preHandler: [fastify.requirePermission('kpi:write')],
    handler: createKpiHandler,
  });

  fastify.patch('/:id', {
    preHandler: [fastify.requirePermission('kpi:write')],
    handler: updateKpiHandler,
  });

  fastify.delete('/:id', {
    preHandler: [fastify.requirePermission('kpi:write')],
    handler: deleteKpiHandler,
  });
}
