import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listKpisHandler,
  getKpiSummaryHandler,
  createKpiHandler,
  updateKpiHandler,
  deleteKpiHandler,
} from './kpi.controller';

const KPI_READ: Permission = 'kpi:read';
const KPI_WRITE: Permission = 'kpi:write';

export async function kpiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission(KPI_READ)],
    handler: listKpisHandler,
  });

  fastify.get('/summary', {
    preHandler: [fastify.requirePermission(KPI_READ)],
    handler: getKpiSummaryHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(KPI_WRITE)],
    handler: createKpiHandler,
  });

  fastify.patch('/:kpiId', {
    preHandler: [fastify.requirePermission(KPI_WRITE)],
    handler: updateKpiHandler,
  });

  fastify.delete('/:kpiId', {
    preHandler: [fastify.requirePermission(KPI_WRITE)],
    handler: deleteKpiHandler,
  });
}
