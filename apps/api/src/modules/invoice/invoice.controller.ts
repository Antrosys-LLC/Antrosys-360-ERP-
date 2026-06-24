import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createInvoiceBodySchema,
  invoiceParamsSchema,
  listInvoicesQuerySchema,
  sendInvoiceBodySchema,
  updateInvoiceBodySchema,
} from './invoice.schema';
import * as invoiceService from './invoice.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    error: 'Validation failed',
    details: error,
  });
}

export async function listInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listInvoicesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const result = await invoiceService.listInvoices(parsed.data);
  return reply.code(200).send({
    status: 'success',
    data: result,
  });
}

export async function getInvoiceByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = invoiceParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  const invoice = await invoiceService.getInvoiceById(parsed.data.invoiceId);
  if (!invoice) {
    return reply.code(404).send({ error: 'Invoice not found' });
  }

  return reply.code(200).send({
    status: 'success',
    data: invoice,
  });
}

export async function createInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createInvoiceBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const created = await invoiceService.createInvoice(parsed.data, request.user.id);
  return reply.code(201).send({
    status: 'success',
    data: created,
  });
}

export async function updateInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = invoiceParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = updateInvoiceBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const updated = await invoiceService.updateInvoice(
    paramsParsed.data.invoiceId,
    bodyParsed.data,
    request.user.id,
  );

  if (!updated) {
    return reply.code(404).send({ error: 'Invoice not found' });
  }

  return reply.code(200).send({
    status: 'success',
    data: updated,
  });
}

export async function deleteInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = invoiceParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const deleted = await invoiceService.deleteInvoice(parsed.data.invoiceId, request.user.id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return reply.code(200).send({
      status: 'success',
      data: deleted,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to delete invoice',
    });
  }
}

export async function sendInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = invoiceParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return sendValidationError(reply, paramsParsed.error.flatten());
  }

  const bodyParsed = sendInvoiceBodySchema.safeParse(request.body ?? {});
  if (!bodyParsed.success) {
    return sendValidationError(reply, bodyParsed.error.flatten());
  }

  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  if (!bodyParsed.data.markAsSent) {
    return reply.code(400).send({ error: 'markAsSent must be true' });
  }

  try {
    const sent = await invoiceService.sendInvoice(paramsParsed.data.invoiceId, request.user.id);
    if (!sent) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return reply.code(200).send({
      status: 'success',
      data: sent,
    });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to send invoice',
    });
  }
}
