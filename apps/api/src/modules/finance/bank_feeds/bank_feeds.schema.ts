import { z } from 'zod';

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  tab: z.enum(['all', 'review', 'unmatched']).default('all'),
  accountId: z.string().optional(),
  search: z.string().optional(),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export const transactionParamsSchema = z.object({
  id: z.string().min(1),
});

export type TransactionParams = z.infer<typeof transactionParamsSchema>;

export const accountParamsSchema = z.object({
  id: z.string().min(1),
});

export type AccountParams = z.infer<typeof accountParamsSchema>;

export const confirmMatchBodySchema = z.object({
  entryId: z.string().min(1),
});

export type ConfirmMatchBody = z.infer<typeof confirmMatchBodySchema>;

export const connectBankBodySchema = z.object({
  bankName: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountType: z.enum(['Primary', 'Payroll', 'Forex']).default('Primary'),
  currencyCode: z.string().length(3).default('PKR'),
  balance: z.coerce.number().nonnegative().default(0),
  provider: z.enum(['API', 'SFTP']),
  scheduleType: z.enum(['Real-time', 'Hourly', 'Daily EOD']),
});

export type ConnectBankBody = z.infer<typeof connectBankBodySchema>;
