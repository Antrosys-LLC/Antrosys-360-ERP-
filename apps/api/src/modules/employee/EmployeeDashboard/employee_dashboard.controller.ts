import { FastifyReply, FastifyRequest } from 'fastify';
import {
  calendarQuerySchema,
  checkInBodySchema,
  payslipParamsSchema,
} from './employee_dashboard.schema';
import * as dashboardService from './employee_dashboard.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

function requireUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  if (!request.user?.id) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.user.id;
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  try {
    const data = await dashboardService.getDashboard(userId);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to load dashboard',
    });
  }
}

export async function getCalendarHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = calendarQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const data = await dashboardService.getCalendar(userId, parsed.data);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to load calendar',
    });
  }
}

export async function checkInHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = checkInBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const data = await dashboardService.checkIn(userId, parsed.data);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Check-in failed',
    });
  }
}

export async function checkOutHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  try {
    const data = await dashboardService.checkOut(userId);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Check-out failed',
    });
  }
}

export async function downloadPayslipHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = payslipParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const result = await dashboardService.downloadPayslip(userId, parsed.data.payslipId);
    if (!result) {
      return reply.code(404).send({ error: 'Payslip not found' });
    }

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${result.filename}"`)
      .send(result.buffer);
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to download payslip',
    });
  }
}
