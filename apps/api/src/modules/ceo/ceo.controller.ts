import { FastifyReply, FastifyRequest } from 'fastify';
import {
  exportQuerySchema,
  overrideParamsSchema,
  periodQuerySchema,
  revenueTrendQuerySchema,
  systemActivityQuerySchema,
} from './ceo.schema';
import * as ceoService from './ceo.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({ error: 'Validation failed', details: error });
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = periodQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const [header, kpiCards] = await Promise.all([
    ceoService.getHeaderSummary(parsed.data, request.user.id),
    ceoService.getKpiCards(parsed.data),
  ]);

  return reply.code(200).send({ status: 'success', data: { header, kpiCards } });
}

export async function getRevenueTrendHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = revenueTrendQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  const data = await ceoService.getRevenueTrend(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function getCostBreakdownHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = periodQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  const data = await ceoService.getCostBreakdown(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function getClientPipelineHandler(_request: FastifyRequest, reply: FastifyReply) {
  const data = await ceoService.getClientPipeline();
  return reply.code(200).send({ status: 'success', data });
}

export async function getQuickActionsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const data = await ceoService.getQuickActions(request.user.id);
  return reply.code(200).send({ status: 'success', data });
}

export async function getSystemActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = systemActivityQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  const data = await ceoService.getSystemActivity(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function getSystemHealthHandler(_request: FastifyRequest, reply: FastifyReply) {
  const data = await ceoService.getSystemHealth();
  return reply.code(200).send({ status: 'success', data });
}

export async function approveOverrideHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = overrideParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const result = await ceoService.approveOverride(parsed.data.taskId, request.user.id);
  if (!result) return reply.code(404).send({ error: 'Override request not found' });
  return reply.code(200).send({ status: 'success', data: result });
}

export async function rejectOverrideHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = overrideParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const result = await ceoService.rejectOverride(parsed.data.taskId, request.user.id);
  if (!result) return reply.code(404).send({ error: 'Override request not found' });
  return reply.code(200).send({ status: 'success', data: result });
}

export async function exportBoardReportHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = exportQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());
  if (parsed.data.fromDate > parsed.data.toDate) {
    return reply.code(400).send({ error: 'fromDate must be before toDate' });
  }
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const csv = await ceoService.buildBoardReportCsv(parsed.data, request.user.id);
  const filename = `ceo-board-report-${parsed.data.fromDate.toISOString().slice(0, 10)}.csv`;
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .code(200)
    .send(csv);
}

export async function getPendingOverridesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });
  const tasks = await ceoService.getPendingOverrides(request.user.id);
  return reply.code(200).send({ status: 'success', data: tasks });
}
