import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createLeaveRequestBodySchema,
  updateLeaveStatusBodySchema,
  leaveRequestParamsSchema,
  listLeaveRequestsQuerySchema,
} from './leave.schema';
import * as leaveService from './leave.service';

// ─── Helpers ──────────────────────────────────────────────────────────────

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

// ─── Leave Handlers ───────────────────────────────────────────────────────

export async function getLeaveBalancesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireUser(reply, request.user?.id)) return;
  const balances = await leaveService.getMyLeaveBalances(request.user!.id);
  if (!balances) {
    return reply.code(422).send({ error: 'Employee record not found for user' });
  }
  return reply.code(200).send({ status: 'success', data: balances });
}

export async function listLeaveRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listLeaveRequestsQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const result = await leaveService.getLeaveRequests(parsed.data, request.user!.id);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function createLeaveRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createLeaveRequestBodySchema.safeParse(request.body);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const result = await leaveService.createLeaveRequest(parsed.data, request.user!.id);
    return reply.code(201).send({ status: 'success', data: result });
  } catch (err: any) {
    if (err.message === 'NO_EMPLOYEE_RECORD') {
      return reply.code(422).send({ error: 'Employee record not found for user' });
    }
    if (err.message?.startsWith?.('INSUFFICIENT_BALANCE:')) {
      return reply.code(400).send({ error: err.message.slice('INSUFFICIENT_BALANCE:'.length) });
    }
    return reply.code(500).send({ error: 'Failed to create leave request' });
  }
}

export async function cancelLeaveRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = leaveRequestParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const cancelled = await leaveService.cancelLeaveRequest(parsed.data.leaveId, request.user!.id);
    if (!cancelled) {
      return reply.code(404).send({ error: 'Leave request not found' });
    }
    return reply.code(200).send({ status: 'success', data: cancelled });
  } catch (err: any) {
    if (err.message === 'NO_EMPLOYEE_RECORD') {
      return reply.code(422).send({ error: 'Employee record not found for user' });
    }
    if (err.message === 'FORBIDDEN') {
      return reply.code(403).send({ error: 'You can only cancel your own leave requests' });
    }
    if (err.message === 'LEAVE_NOT_PENDING') {
      return reply.code(400).send({ error: 'Only pending leave requests can be cancelled' });
    }
    return reply.code(500).send({ error: 'Failed to cancel leave request' });
  }
}

export async function getPendingApprovalsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireUser(reply, request.user?.id)) return;

  const approvals = await leaveService.getPendingApprovals(request.user!.id);
  return reply.code(200).send({ status: 'success', data: approvals });
}

export async function updateLeaveStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = leaveRequestParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateLeaveStatusBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const updated = await leaveService.updateLeaveStatus(
      paramsParsed.data.leaveId,
      bodyParsed.data,
      request.user!.id,
    );
    if (!updated) {
      return reply.code(404).send({ error: 'Leave request not found' });
    }
    return reply.code(200).send({ status: 'success', data: updated });
  } catch (err: any) {
    if (err.message === 'APPROVER_NO_EMPLOYEE_RECORD') {
      return reply.code(422).send({ error: 'Approver employee record not found' });
    }
    if (err.message === 'LEAVE_NOT_PENDING') {
      return reply.code(400).send({ error: 'Leave request is not in PENDING state' });
    }
    return reply.code(500).send({ error: 'Failed to update leave request' });
  }
}

export async function getLeaveMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireUser(reply, request.user?.id)) return;
  const metrics = await leaveService.getLeaveMetrics(request.user!.id);
  return reply.code(200).send({ status: 'success', data: metrics });
}
