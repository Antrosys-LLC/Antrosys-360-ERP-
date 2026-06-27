import { FastifyReply, FastifyRequest } from 'fastify';
import {
  dashboardQuerySchema,
  employeeOptionsQuerySchema,
  exportQuerySchema,
  hrLetterBodySchema,
  startOnboardingBodySchema,
} from './hr.schema';
import * as hrService from './hr.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

function sendServiceError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (message.includes('not found')) {
    return reply.code(404).send({ error: message });
  }
  if (message.includes('already has')) {
    return reply.code(409).send({ error: message });
  }
  return reply.code(500).send({ error: message });
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const data = await hrService.getDashboard(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function exportDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = exportQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const csv = await hrService.buildDashboardExportCsv(parsed.data);
  const filename = `hr-dashboard-${parsed.data.year}-${String(parsed.data.month).padStart(2, '0')}.csv`;
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .code(200)
    .send(csv);
}

export async function getEmployeeOptionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = employeeOptionsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const data = await hrService.getEmployeeOptions(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function generateHrLetterHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = hrLetterBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const data = await hrService.generateAndSendHrLetter(parsed.data, request.user.id);
    return reply.code(201).send({ status: 'success', data });
  } catch (error) {
    return sendServiceError(reply, error);
  }
}

export async function startOnboardingHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = startOnboardingBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const data = await hrService.startOnboarding(parsed.data, request.user.id);
    return reply.code(201).send({ status: 'success', data });
  } catch (error) {
    return sendServiceError(reply, error);
  }
}
