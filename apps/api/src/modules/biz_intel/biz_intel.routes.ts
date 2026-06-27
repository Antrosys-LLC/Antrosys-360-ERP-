import { FastifyInstance } from 'fastify';
import {
  getDashboardHandler,
  getChartDataHandler,
  createReportHandler,
  runReportHandler,
  toggleFavouriteHandler,
  deleteReportHandler,
  createScheduleHandler,
  deleteScheduleHandler,
} from './biz_intel.controller';

export async function bizIntelRoutes(fastify: FastifyInstance) {
  // Apply verifyJwt and requirePermission('reports:read') to all endpoints
  fastify.addHook('preHandler', fastify.verifyJwt);
  fastify.addHook('preHandler', fastify.requirePermission('reports:read'));

  // Dashboard landing: reports, schedules, recent runs, sparklines
  fastify.get('/', getDashboardHandler);

  // Custom report builder dynamic preview
  fastify.get('/builder/chart-data', getChartDataHandler);

  // BI Report configurations
  fastify.post('/reports', createReportSchemaValidation(fastify), createReportHandler);
  fastify.post('/reports/:id/run', runReportHandler);
  fastify.post('/reports/:id/favourite', toggleFavouriteHandler);
  fastify.delete('/reports/:id', deleteReportHandler);

  // Active schedules
  fastify.post('/schedules', createScheduleHandler);
  fastify.delete('/schedules/:id', deleteScheduleHandler);
}

// Optional Fastify-native validator schemas compilation helper
function createReportSchemaValidation(fastify: FastifyInstance) {
  return {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'category'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          category: { type: 'string', minLength: 1 },
          iconType: { type: 'string', enum: ['trend', 'pipeline', 'target', 'turnover'] },
          isFavourite: { type: 'boolean' },
          isShared: { type: 'boolean' },
          config: {
            type: 'object',
            properties: {
              xAxis: { type: 'string' },
              yAxis: { type: 'array', items: { type: 'string' } },
              settings: {
                type: 'object',
                properties: {
                  showDataLabels: { type: 'boolean' },
                  showLegend: { type: 'boolean' },
                  trendline: { type: 'boolean' },
                },
              },
              filters: { type: 'array' },
              exportFormat: { type: 'string' },
            },
          },
        },
      },
    },
  };
}
