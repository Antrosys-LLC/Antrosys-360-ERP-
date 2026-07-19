import { FastifyReply, FastifyRequest } from 'fastify';
import {
  approveLinesBodySchema,
  dashboardQuerySchema,
  generatePayslipsBodySchema,
  lineItemParamsSchema,
  listEmployeesQuerySchema,
  payrollParamsSchema,
  payslipConfigBodySchema,
  runPayrollBodySchema,
  updateLineItemBodySchema,
} from './payroll.schema';
import * as payrollService from './payroll.service';

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

  const data = await payrollService.getDashboard(parsed.data);
  return reply.code(200).send({ status: 'success', data });
}

export async function getPeriodsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const data = await payrollService.getPeriods();
  return reply.code(200).send({ status: 'success', data });
}

export async function listEmployeesHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const queryParsed = listEmployeesQuerySchema.safeParse(request.query);
  if (!queryParsed.success) return validationError(reply, queryParsed.error.flatten());

  const data = await payrollService.listEmployees(paramsParsed.data.payrollId, queryParsed.data);
  if (!data) return reply.code(404).send({ error: 'Payroll batch not found' });

  return reply.code(200).send({ status: 'success', data });
}

export async function runPayrollHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = runPayrollBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) return validationError(reply, parsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const result = await payrollService.runPayroll(request.user!.id, parsed.data);
  if ('error' in result && result.error === 'PAYROLL_EXISTS') {
    return reply.code(409).send({ error: 'Payroll already exists for this period', payrollId: result.payrollId });
  }

  const dashboard = await payrollService.getDashboard({ payrollId: result.payrollId });
  return reply.code(201).send({ status: 'success', data: dashboard });
}

export async function updateLineItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = lineItemParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateLineItemBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());

  const updated = await payrollService.updateLineItem(
    paramsParsed.data.payrollId,
    paramsParsed.data.lineItemId,
    bodyParsed.data,
  );
  if (!updated) return reply.code(404).send({ error: 'Line item not found' });

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function approveLinesHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = approveLinesBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());

  const result = await payrollService.approveLines(paramsParsed.data.payrollId, bodyParsed.data);
  if (!result) return reply.code(404).send({ error: 'Payroll batch not found' });

  const dashboard = await payrollService.getDashboard({ payrollId: paramsParsed.data.payrollId });
  return reply.code(200).send({ status: 'success', data: dashboard });
}

export async function submitForApprovalHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());
  if (!requireUser(reply, request.user?.id)) return;

  const result = await payrollService.submitForApproval(paramsParsed.data.payrollId, request.user!.id);
  if (!result) return reply.code(404).send({ error: 'Payroll batch not found' });
  if ('error' in result) {
    const errorMap: Record<string, string> = {
      INVALID_STATE: 'Payroll must be in DRAFT status before submission',
      MISSING_ACTORS: 'Cannot submit — no active CFO user or requester employee record found',
    };
    const msg = errorMap[(result as { error: string }).error] ?? 'Unable to submit payroll for approval';
    return reply.code(422).send({ error: msg });
  }

  const dashboard = await payrollService.getDashboard({ payrollId: paramsParsed.data.payrollId });
  return reply.code(200).send({ status: 'success', data: dashboard });
}

export async function exportLedgerHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const result = await payrollService.exportLedgerCsv(paramsParsed.data.payrollId);
  if (!result) return reply.code(404).send({ error: 'Payroll batch not found' });

  return reply
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', `attachment; filename="${result.filename}"`)
    .send(result.content);
}

export async function updatePayslipConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = payslipConfigBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());

  const updated = await payrollService.updatePayslipConfig(paramsParsed.data.payrollId, bodyParsed.data);
  if (!updated) return reply.code(404).send({ error: 'Payroll batch not found' });

  return reply.code(200).send({ status: 'success', data: parsePayslipConfigResponse(updated.payslipConfig) });
}

function parsePayslipConfigResponse(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return { email: true, pdf: true, whatsapp: false, template: 'standard' as const };
  }
  const cfg = raw as Record<string, unknown>;
  return {
    email: cfg.email !== false,
    pdf: cfg.pdf !== false,
    whatsapp: cfg.whatsapp === true,
    template: cfg.template === 'detailed' ? ('detailed' as const) : ('standard' as const),
  };
}

export async function generatePayslipsHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const bodyParsed = generatePayslipsBodySchema.safeParse(request.body ?? {});
  if (!bodyParsed.success) return validationError(reply, bodyParsed.error.flatten());

  const result = await payrollService.generatePayslips(paramsParsed.data.payrollId, bodyParsed.data);
  if (!result) return reply.code(404).send({ error: 'Payroll batch not found' });

  const dashboard = await payrollService.getDashboard({ payrollId: paramsParsed.data.payrollId });
  return reply.code(200).send({ status: 'success', data: { ...result, dashboard } });
}

export async function disbursePayrollHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = payrollParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return validationError(reply, paramsParsed.error.flatten());

  const result = await payrollService.disbursePayroll(paramsParsed.data.payrollId);
  if (!result) return reply.code(404).send({ error: 'Payroll batch not found' });
  if ('error' in result) return reply.code(422).send({ error: 'Payroll must be approved before disbursement' });

  const dashboard = await payrollService.getDashboard({ payrollId: paramsParsed.data.payrollId });
  return reply.code(200).send({ status: 'success', data: dashboard });
}
