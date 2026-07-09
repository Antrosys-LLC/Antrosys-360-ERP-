import { FastifyRequest, FastifyReply } from 'fastify';
import {
  listTransactionsQuerySchema,
  transactionParamsSchema,
  accountParamsSchema,
  confirmMatchBodySchema,
  connectBankBodySchema,
} from './bank_feeds.schema';
import * as bankFeedsService from './bank_feeds.service';

export async function listAccountsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const accounts = await bankFeedsService.listAccounts();
  return reply.code(200).send({ status: 'success', data: accounts });
}

export async function syncAccountHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = accountParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await bankFeedsService.syncAccount(parsed.data.id, request.user.id);
  if (!result) {
    return reply.code(404).send({ error: 'Account not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

export async function listTransactionsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = listTransactionsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await bankFeedsService.listTransactions(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getTransactionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = transactionParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const transaction = await bankFeedsService.getTransaction(parsed.data.id);
  if (!transaction) {
    return reply.code(404).send({ error: 'Transaction not found' });
  }

  return reply.code(200).send({ status: 'success', data: transaction });
}

export async function confirmMatchHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const paramsParsed = transactionParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = confirmMatchBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const result = await bankFeedsService.confirmMatch(
    paramsParsed.data.id,
    bodyParsed.data.entryId,
    request.user.id,
  );
  if (!result) {
    return reply.code(404).send({ error: 'Transaction not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

export async function rejectMatchHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = transactionParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await bankFeedsService.rejectMatch(parsed.data.id, request.user.id);
  if (!result) {
    return reply.code(404).send({ error: 'Transaction not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

export async function getReconciliationHealthHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const health = await bankFeedsService.getReconciliationHealth();
  return reply.code(200).send({ status: 'success', data: health });
}

export async function getPriorityExceptionsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const exceptions = await bankFeedsService.getPriorityExceptions();
  return reply.code(200).send({ status: 'success', data: exceptions });
}

export async function getConnectionsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const connections = await bankFeedsService.getConnections();
  return reply.code(200).send({ status: 'success', data: connections });
}

export async function connectBankHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = connectBankBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const account = await bankFeedsService.connectBank(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: account });
}

export async function createJournalEntryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = transactionParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const entry = await bankFeedsService.createJournalEntry(parsed.data.id, request.user.id);
  if (!entry) {
    return reply.code(404).send({ error: 'Transaction not found' });
  }

  return reply.code(201).send({ status: 'success', data: entry });
}
