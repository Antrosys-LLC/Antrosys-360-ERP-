import type { PrismaClient } from '@prisma/client';

/** Prisma client or transaction client for shared payroll helpers. */
export type PrismaClientOrTransaction = Pick<
  PrismaClient,
  'employeePayslip' | 'payrollLineItem'
>;
