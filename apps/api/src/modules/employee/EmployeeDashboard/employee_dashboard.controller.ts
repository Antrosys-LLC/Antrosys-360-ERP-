import { FastifyReply, FastifyRequest } from 'fastify';
import {
  calendarQuerySchema,
  checkInBodySchema,
  payslipParamsSchema,
  submitMoodBodySchema,
  announcementBodySchema,
  announcementParamsSchema,
  teamHolidayBodySchema,
  holidayParamsSchema,
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

export async function submitMoodHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = submitMoodBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const data = await dashboardService.submitDailyMood(userId, parsed.data);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to submit mood',
    });
  }
}

export async function createAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = announcementBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const data = await dashboardService.createTeamAnnouncement(userId, parsed.data);
    return reply.code(201).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to create announcement',
    });
  }
}

export async function updateAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const params = announcementParamsSchema.safeParse(request.params);
  const body = announcementBodySchema.safeParse(request.body ?? {});
  if (!params.success || !body.success) {
    return sendValidationError(reply, {
      params: params.success ? undefined : params.error.flatten(),
      body: body.success ? undefined : body.error.flatten(),
    });
  }

  try {
    const data = await dashboardService.updateTeamAnnouncement(userId, params.data.announcementId, body.data);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update announcement',
    });
  }
}

export async function deleteAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = announcementParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    await dashboardService.deleteTeamAnnouncement(userId, parsed.data.announcementId);
    return reply.code(200).send({ status: 'success' });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to delete announcement',
    });
  }
}

export async function createHolidayHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = teamHolidayBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    const data = await dashboardService.createTeamHoliday(userId, parsed.data);
    return reply.code(201).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to create holiday',
    });
  }
}

export async function updateHolidayHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const params = holidayParamsSchema.safeParse(request.params);
  const body = teamHolidayBodySchema.safeParse(request.body ?? {});
  if (!params.success || !body.success) {
    return sendValidationError(reply, {
      params: params.success ? undefined : params.error.flatten(),
      body: body.success ? undefined : body.error.flatten(),
    });
  }

  try {
    const data = await dashboardService.updateTeamHoliday(userId, params.data.holidayId, body.data);
    return reply.code(200).send({ status: 'success', data });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update holiday',
    });
  }
}

export async function deleteHolidayHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = requireUserId(request, reply);
  if (!userId) return;

  const parsed = holidayParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  try {
    await dashboardService.deleteTeamHoliday(userId, parsed.data.holidayId);
    return reply.code(200).send({ status: 'success' });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to delete holiday',
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
