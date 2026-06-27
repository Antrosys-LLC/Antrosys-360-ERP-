import { FastifyReply, FastifyRequest } from 'fastify';
import {
  onboardingParamsSchema,
  taskParamsSchema,
  createOnboardingBodySchema,
  updateOnboardingBodySchema,
  toggleTaskBodySchema,
  communicateBodySchema,
} from './onboarding.schema';
import * as onboardingService from './onboarding.service';

export async function listOnboardingsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const data = await onboardingService.listOnboardings();
  return reply.code(200).send({ status: 'success', data });
}

export async function getOnboardingSummaryHandler(_request: FastifyRequest, reply: FastifyReply) {
  const summary = await onboardingService.getOnboardingSummary();
  return reply.code(200).send({ status: 'success', data: summary });
}

export async function getOnboardingByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardingParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const onboarding = await onboardingService.getOnboardingById(parsed.data.onboardingId);
  if (!onboarding) return reply.code(404).send({ status: 'error', error: 'Onboarding not found' });
  return reply.code(200).send({ status: 'success', data: onboarding });
}

export async function createOnboardingHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createOnboardingBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  try {
    const created = await onboardingService.createOnboarding(parsed.data, request.user.id);
    return reply.code(201).send({ status: 'success', data: created });
  } catch (error) {
    return reply.code(400).send({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to create onboarding',
    });
  }
}

export async function updateOnboardingHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardingParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = updateOnboardingBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await onboardingService.updateOnboarding(paramsParsed.data.onboardingId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'Onboarding not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function toggleTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = taskParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = toggleTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await onboardingService.toggleTask(paramsParsed.data.taskId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'Task not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

export async function sendCommunicationHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardingParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = communicateBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const result = await onboardingService.sendCommunication(paramsParsed.data.onboardingId, bodyParsed.data, request.user.id);
  if (!result) return reply.code(404).send({ status: 'error', error: 'Onboarding not found' });
  return reply.code(200).send({ status: 'success', data: result });
}
