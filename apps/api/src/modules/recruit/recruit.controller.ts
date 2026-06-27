import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createRequisitionBodySchema,
  updateRequisitionBodySchema,
  requisitionParamsSchema,
  listRequisitionsQuerySchema,
  createCandidateBodySchema,
  updateCandidateStageBodySchema,
  candidateParamsSchema,
  listCandidatesQuerySchema,
} from './recruit.schema';
import * as recruitService from './recruit.service';

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

// ─── Requisition Handlers ─────────────────────────────────────────────────

export async function listRequisitionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listRequisitionsQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());

  const result = await recruitService.listRequisitions(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function createRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createRequisitionBodySchema.safeParse(request.body);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const created = await recruitService.createRequisition(parsed.data, request.user!.id);
  return reply.code(201).send({ status: 'success', data: created });
}

export async function updateRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = requisitionParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateRequisitionBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const updated = await recruitService.updateRequisition(
    paramsParsed.data.requisitionId,
    bodyParsed.data,
    request.user!.id,
  );
  if (!updated) return reply.code(404).send({ error: 'Requisition not found' });

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = requisitionParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const deleted = await recruitService.deleteRequisition(
    parsed.data.requisitionId,
    request.user!.id,
  );
  if (!deleted) return reply.code(404).send({ error: 'Requisition not found' });

  return reply.code(200).send({ status: 'success', data: deleted });
}

// ─── Candidate Handlers ───────────────────────────────────────────────────

export async function listCandidatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listCandidatesQuerySchema.safeParse(request.query);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());

  const result = await recruitService.listCandidates(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function createCandidateHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createCandidateBodySchema.safeParse(request.body);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  try {
    const created = await recruitService.createCandidate(parsed.data, request.user!.id);
    return reply.code(201).send({ status: 'success', data: created });
  } catch (err) {
    return reply.code(400).send({ error: err instanceof Error ? err.message : 'Failed to create candidate' });
  }
}

export async function updateCandidateStageHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = candidateParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateCandidateStageBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const updated = await recruitService.updateCandidateStage(
    paramsParsed.data.candidateId,
    bodyParsed.data.pipelineStage,
    request.user!.id,
  );
  if (!updated) return reply.code(404).send({ error: 'Candidate not found' });

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteCandidateHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = candidateParamsSchema.safeParse(request.params);
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const deleted = await recruitService.deleteCandidate(
    parsed.data.candidateId,
    request.user!.id,
  );
  if (!deleted) return reply.code(404).send({ error: 'Candidate not found' });

  return reply.code(200).send({ status: 'success', data: deleted });
}

// ─── Metrics Handler ──────────────────────────────────────────────────────

export async function getMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await recruitService.getRecruitmentMetrics();
  return reply.code(200).send({ status: 'success', data });
}
