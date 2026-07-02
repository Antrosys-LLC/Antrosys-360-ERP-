import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  approveLinesHandler,
  disbursePayrollHandler,
  exportLedgerHandler,
  generatePayslipsHandler,
  getDashboardHandler,
  getPeriodsHandler,
  listEmployeesHandler,
  runPayrollHandler,
  submitForApprovalHandler,
  updateLineItemHandler,
  updatePayslipConfigHandler,
} from './payroll.controller';

const PAYROLL_READ: Permission = 'payroll:read';
const PAYROLL_WRITE: Permission = 'payroll:write';

export async function payrollModuleRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: getDashboardHandler,
  });

  fastify.get('/periods', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: getPeriodsHandler,
  });

  fastify.post('/run', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: runPayrollHandler,
  });

  fastify.get('/:payrollId/employees', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: listEmployeesHandler,
  });

  fastify.patch('/:payrollId/employees/:lineItemId', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: updateLineItemHandler,
  });

  fastify.post('/:payrollId/approve-lines', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: approveLinesHandler,
  });

  fastify.post('/:payrollId/submit', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: submitForApprovalHandler,
  });

  fastify.get('/:payrollId/export', {
    preHandler: [fastify.requirePermission(PAYROLL_READ)],
    handler: exportLedgerHandler,
  });

  fastify.patch('/:payrollId/payslip-config', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: updatePayslipConfigHandler,
  });

  fastify.post('/:payrollId/generate-payslips', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: generatePayslipsHandler,
  });

  fastify.post('/:payrollId/disburse', {
    preHandler: [fastify.requirePermission(PAYROLL_WRITE)],
    handler: disbursePayrollHandler,
  });
}
