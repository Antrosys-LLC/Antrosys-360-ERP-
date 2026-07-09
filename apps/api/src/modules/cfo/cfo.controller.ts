import { FastifyReply, FastifyRequest } from 'fastify';
import {
  activitiesQuerySchema,
  cashflowQuerySchema,
  createEventBodySchema,
  dashboardQuerySchema,
  eventParamsSchema,
  eventsQuerySchema,
  exportQuerySchema,
  invoiceStatusQuerySchema,
  taskParamsSchema,
  updateEventBodySchema,
} from './cfo.schema';
import * as cfoService from './cfo.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const [user, metrics, invoiceStatus, cashflow] = await Promise.all([
    cfoService.getUserContext(request.user.id),
    cfoService.getDashboardMetrics(parsed.data),
    cfoService.getInvoiceStatus({ period: parsed.data.invoicePeriod }),
    cfoService.getCashflowOverview({ period: 'year', offset: 0 }),
  ]);

  return reply.code(200).send({
    status: 'success',
    data: {
      user,
      greeting: user?.firstName ?? 'there',
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      metrics,
      invoiceStatus,
      cashflowSummary: {
        percentage: cashflow.percentage,
        periodLabel: cashflow.periodLabel,
      },
    },
  });
}

export async function getCashflowHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = cashflowQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const cashflow = await cfoService.getCashflowOverview(parsed.data);
  return reply.code(200).send({ status: 'success', data: cashflow });
}

export async function getInvoiceStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = invoiceStatusQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const invoiceStatus = await cfoService.getInvoiceStatus(parsed.data);
  return reply.code(200).send({ status: 'success', data: invoiceStatus });
}

export async function getTasksHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const tasks = await cfoService.getTasks(request.user.id);
  return reply.code(200).send({ status: 'success', data: tasks });
}

export async function acceptTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = taskParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const result = await cfoService.acceptTask(parsed.data.taskId, request.user.id);
  if (!result) {
    return reply.code(404).send({ error: 'Task not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

export async function cancelTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = taskParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const result = await cfoService.cancelTask(parsed.data.taskId, request.user.id);
  if (!result) {
    return reply.code(404).send({ error: 'Task not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

export async function getActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = activitiesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const activities = await cfoService.getActivities(parsed.data);
  return reply.code(200).send({ status: 'success', data: activities });
}

export async function getEventsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = eventsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const events = await cfoService.getEvents(parsed.data);
  return reply.code(200).send({ status: 'success', data: events });
}

export async function createEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createEventBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const event = await cfoService.createEvent(request.user.id, parsed.data);
  return reply.code(201).send({ status: 'success', data: event });
}

export async function updateEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const params = eventParamsSchema.safeParse(request.params);
  if (!params.success) {
    return sendValidationError(reply, params.error.flatten());
  }

  const body = updateEventBodySchema.safeParse(request.body);
  if (!body.success) {
    return sendValidationError(reply, body.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const event = await cfoService.updateEvent(params.data.eventId, request.user.id, body.data);
  if (!event) {
    return reply.code(404).send({ error: 'Event not found' });
  }

  return reply.code(200).send({ status: 'success', data: event });
}

export async function deleteEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = eventParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const event = await cfoService.deleteEvent(parsed.data.eventId, request.user.id);
  if (!event) {
    return reply.code(404).send({ error: 'Event not found' });
  }

  return reply.code(200).send({ status: 'success', data: event });
}

export async function exportReportHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = exportQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (parsed.data.fromDate > parsed.data.toDate) {
    return reply.code(400).send({ error: 'fromDate must be before toDate' });
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const csv = await cfoService.buildExportCsv(parsed.data, request.user.id);
  const filename = `cfo-report-${parsed.data.fromDate.toISOString().slice(0, 10)}-${parsed.data.toDate.toISOString().slice(0, 10)}.csv`;

  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .code(200)
    .send(csv);
}

export async function getProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const user = await cfoService.getUserContext(request.user.id);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return reply.code(200).send({ status: 'success', data: user });
}
