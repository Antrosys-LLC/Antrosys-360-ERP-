import { FastifyReply, FastifyRequest } from 'fastify';
import { listKpisQuerySchema, kpiParamsSchema, createKpiBodySchema, updateKpiBodySchema } from './kpi.schema';
import * as kpiService from './kpi.service';

export async function listKpisHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listKpisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const kpis = await kpiService.listKpis(parsed.data);
  return reply.code(200).send({ status: 'success', data: kpis });
}

export async function getKpiSummaryHandler(_request: FastifyRequest, reply: FastifyReply) {
  const summary = await kpiService.getKpiSummary();
  return reply.code(200).send({ status: 'success', data: summary });
}

export async function createKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createKpiBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const created = await kpiService.createKpi(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: created });
}

export async function updateKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = kpiParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = updateKpiBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await kpiService.updateKpi(paramsParsed.data.kpiId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'KPI not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = kpiParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const deleted = await kpiService.deleteKpi(parsed.data.kpiId, request.user.id);
  if (!deleted) return reply.code(404).send({ status: 'error', error: 'KPI not found' });
  return reply.code(200).send({ status: 'success', data: { id: deleted.id } });
}
