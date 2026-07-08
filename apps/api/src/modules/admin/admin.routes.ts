import { FastifyInstance } from 'fastify';
import {
  listUsersHandler,
  getUserStatsHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listAuditLogsHandler,
  getModuleAccessHandler,
  setModuleAccessHandler,
} from './admin.controller';
import { z } from 'zod';
import { getWorkScheduleConfig, updateWorkSchedule } from '../employee/EmployeeDashboard/employee_dashboard.service';

const workScheduleBodySchema = z.object({
  standardHoursPerDay: z.number().min(1).max(24).optional(),
  halfDayThresholdHours: z.number().min(0.5).max(12).optional(),
  overtimeEnabled: z.boolean().optional(),
  lateAfterHour: z.number().int().min(0).max(23).optional(),
  lateAfterMinute: z.number().int().min(0).max(59).optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: async () => ({ module: 'admin', status: 'active' }),
  });

  fastify.get('/users', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: listUsersHandler,
  });

  fastify.get('/users/stats', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: getUserStatsHandler,
  });

  fastify.get('/users/:id', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: getUserHandler,
  });

  fastify.post('/users', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: createUserHandler,
  });

  fastify.put('/users/:id', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: updateUserHandler,
  });

  fastify.delete('/users/:id', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: deleteUserHandler,
  });

  fastify.get('/audit-logs', {
    preHandler: [fastify.requirePermission('audit:read')],
    handler: listAuditLogsHandler,
  });

  fastify.get('/module-access', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: getModuleAccessHandler,
  });

  fastify.put('/module-access', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: setModuleAccessHandler,
  });

  fastify.get('/work-schedule', {
    preHandler: [fastify.requirePermission('admin:read')],
    handler: async (_request, reply) => {
      const config = await getWorkScheduleConfig();
      return reply.code(200).send({
        status: 'success',
        data: {
          standardHoursPerDay: Number(config.standardHoursPerDay),
          halfDayThresholdHours: Number(config.halfDayThresholdHours),
          overtimeEnabled: config.overtimeEnabled,
          lateAfterHour: config.lateAfterHour,
          lateAfterMinute: config.lateAfterMinute,
        },
      });
    },
  });

  fastify.patch('/work-schedule', {
    preHandler: [fastify.requirePermission('admin:write')],
    handler: async (request, reply) => {
      if (!request.user?.id) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const parsed = workScheduleBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      }

      const config = await updateWorkSchedule(request.user.id, parsed.data);
      return reply.code(200).send({
        status: 'success',
        data: {
          standardHoursPerDay: Number(config.standardHoursPerDay),
          halfDayThresholdHours: Number(config.halfDayThresholdHours),
          overtimeEnabled: config.overtimeEnabled,
          lateAfterHour: config.lateAfterHour,
          lateAfterMinute: config.lateAfterMinute,
        },
      });
    },
  });
}
