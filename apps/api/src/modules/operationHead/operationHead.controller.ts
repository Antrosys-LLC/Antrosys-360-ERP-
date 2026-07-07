import { FastifyReply, FastifyRequest } from 'fastify';
import {
  dashboardQuerySchema,
  employeeParamsSchema,
  flagAttendanceBodySchema,
  leaveParamsSchema,
  listOpsLeavesQuerySchema,
  overrideAttendanceBodySchema,
  raiseManpowerRequestBodySchema,
  updateLeaveStatusBodySchema,
} from './operationHead.schema';
import * as operationHeadService from './operationHead.service';

function validationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({ error: 'Validation failed', details: error });
}

function requireUser(reply: FastifyReply, userId: string | undefined): userId is string {
  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());

  const data = await operationHeadService.getDashboard(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function listOpsLeavesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listOpsLeavesQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());

  const data = await operationHeadService.listOpsHeadLeaves(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function updateLeaveStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = leaveParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateLeaveStatusBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const updated = await operationHeadService.updateOpsHeadLeaveStatus(
      paramsParsed.data.leaveId,
      bodyParsed.data,
      request.user!.id,
    );
    if (!updated) return reply.code(404).send({ error: 'Leave request not found' });
    return reply.code(200).send({ status: 'success', data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update leave request';
    if (message === 'NO_EMPLOYEE_RECORD') return reply.code(422).send({ error: message });
    if (message === 'LEAVE_NOT_PENDING_OPS_HEAD' || message === 'NOT_OPS_HEAD_LEAVE') {
      return reply.code(400).send({ error: message });
    }
    return reply.code(500).send({ error: message });
  }
}

export async function toggleFlagHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = flagAttendanceBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const result = await operationHeadService.toggleAttendanceFlag(
      paramsParsed.data.employeeId,
      bodyParsed.data,
      request.user!.id,
    );
    return reply.code(200).send({ status: 'success', data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle flag';
    if (message === 'EMPLOYEE_NOT_FOUND') return reply.code(404).send({ error: message });
    return reply.code(500).send({ error: message });
  }
}

export async function overrideAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = overrideAttendanceBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const result = await operationHeadService.overrideAttendanceStatus(
      paramsParsed.data.employeeId,
      bodyParsed.data,
      request.user!.id,
    );
    return reply.code(200).send({ status: 'success', data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to override attendance';
    if (message === 'EMPLOYEE_NOT_FOUND') return reply.code(404).send({ error: message });
    return reply.code(500).send({ error: message });
  }
}

export async function raiseManpowerRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = raiseManpowerRequestBodySchema.safeParse(request.body);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const data = await operationHeadService.raiseManpowerRequest(parsed.data, request.user!.id);
  return reply.code(201).send({ status: 'success', data });
}
