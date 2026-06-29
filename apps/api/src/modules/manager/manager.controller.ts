import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import * as managerService from './manager.service';
import {
  flagMemberSchema,
  overrideAttendanceSchema,
  postAnnouncementSchema,
  updateLeaveStatusSchema,
} from './manager.schema';

const leaveParamsSchema = z.object({
  leaveId: z.string().cuid(),
});

const employeeParamsSchema = z.object({
  employeeId: z.string().cuid(),
});

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

export async function getDashboardDataHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const data = await managerService.getDashboardData(request.user.id, request.user.role);
    return reply.code(200).send({
      status: 'success',
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

export async function updateLeaveStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const paramsParsed = leaveParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = updateLeaveStatusSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  try {
    const updated = await managerService.updateLeaveStatus(
      paramsParsed.data.leaveId,
      bodyParsed.data.status,
      request.user.id,
      request.user.role
    );

    if (!updated) {
      return reply.code(404).send({ error: 'Leave request not found' });
    }

    return reply.code(200).send({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update leave request',
    });
  }
}

export async function approveAllLeavesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const result = await managerService.approveAllLeaves(request.user.id, request.user.role);
    return reply.code(200).send({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to approve leaves',
    });
  }
}

export async function postAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const bodyParsed = postAnnouncementSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  try {
    const announcement = await managerService.postAnnouncement(
      request.user.id,
      request.user.role,
      bodyParsed.data
    );

    return reply.code(201).send({
      status: 'success',
      data: announcement,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to post announcement',
    });
  }
}

export async function overrideAttendanceStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = overrideAttendanceSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  try {
    const updated = await managerService.overrideAttendance(
      paramsParsed.data.employeeId,
      bodyParsed.data.status,
      request.user.id,
      request.user.role
    );

    return reply.code(200).send({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update attendance status',
    });
  }
}

export async function toggleFlagHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = flagMemberSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  try {
    const updated = await managerService.toggleFlag(
      paramsParsed.data.employeeId,
      bodyParsed.data.isFlagged,
      request.user.id,
      request.user.role
    );

    return reply.code(200).send({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update flagged status',
    });
  }
}

export async function generateTeamReportHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const csvData = await managerService.generateKpiReportCsv(request.user.id, request.user.role);
    
    return reply
      .code(200)
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="team_report.csv"')
      .send(csvData);
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to generate report',
    });
  }
}

