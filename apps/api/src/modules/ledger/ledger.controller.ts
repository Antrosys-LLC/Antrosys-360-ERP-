import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createLedgerEntryBodySchema,
  ledgerEntryParamsSchema,
  listLedgerEntriesQuerySchema,
  ledgerPeriodQuerySchema,
  updateLedgerEntryBodySchema,
  voidLedgerEntryBodySchema,
} from './ledger.schema';
import * as ledgerService from './ledger.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

export async function listLedgerEntriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listLedgerEntriesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const result = await ledgerService.listLedgerEntries(parsed.data);
  return reply.code(200).send({
    status: 'success',
    data: result,
  });
}

export async function getLedgerSummaryHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = ledgerPeriodQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const summary = await ledgerService.getLedgerSummary(parsed.data.period);
  if (!summary) {
    return reply.code(404).send({ error: 'Summary not found' });
  }

  return reply.code(200).send({
    status: 'success',
    data: summary,
  });
}

export async function getBudgetVsActualHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await ledgerService.getBudgetVsActual();
  return reply.code(200).send({ status: 'success', data });
}

export async function getMonthlyTrendHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = ledgerPeriodQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }
  const data = await ledgerService.getMonthlyTrend(parsed.data.period);
  return reply.code(200).send({ status: 'success', data });
}

export async function getBudgetTrackersHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await ledgerService.getBudgetTrackers();
  return reply.code(200).send({ status: 'success', data });
}

export async function getChartOfAccountsHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await ledgerService.getChartOfAccounts();
  return reply.code(200).send({ status: 'success', data });
}

export async function getAccountingEquationHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = ledgerPeriodQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }
  const data = await ledgerService.getAccountingEquation(parsed.data.period);
  return reply.code(200).send({ status: 'success', data });
}

export async function getLedgerEntryByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = ledgerEntryParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const entry = await ledgerService.getLedgerEntryById(parsed.data.entryId);
  if (!entry) {
    return reply.code(404).send({ error: 'Entry not found' });
  }

  return reply.code(200).send({
    status: 'success',
    data: entry,
  });
}

export async function createLedgerEntryHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createLedgerEntryBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const created = await ledgerService.createLedgerEntry(parsed.data, request.user.id);
  return reply.code(201).send({
    status: 'success',
    data: created,
  });
}

export async function updateLedgerEntryHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = ledgerEntryParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = updateLedgerEntryBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const updated = await ledgerService.updateLedgerEntry(
    paramsParsed.data.entryId,
    bodyParsed.data,
    request.user.id,
  );

  if (!updated) {
    return reply.code(404).send({ error: 'Entry not found' });
  }

  return reply.code(200).send({
    status: 'success',
    data: updated,
  });
}

export async function voidLedgerEntryHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = ledgerEntryParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = voidLedgerEntryBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const voided = await ledgerService.voidLedgerEntry(
      paramsParsed.data.entryId,
      request.user.id,
      bodyParsed.data.reason
    );
    
    if (!voided) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    return reply.code(200).send({
      status: 'success',
      data: voided,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to void entry',
    });
  }
}
