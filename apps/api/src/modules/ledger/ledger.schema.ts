import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const ledgerPeriodSchema = z.string().default('may-2026');

export const ledgerEntryParamsSchema = z.object({
  entryId: z.string().cuid(),
});

// ---------------------------------------------------------------------------
// List / query
// ---------------------------------------------------------------------------

export const listLedgerEntriesQuerySchema = z.object({
  period: ledgerPeriodSchema,
  accountId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  /** null = all, true = voided only, false = active only */
  isVoided: z.coerce.boolean().optional(),
  /** null = all, true = flagged for reconciliation */
  hasFlag: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const ledgerPeriodQuerySchema = z.object({
  period: ledgerPeriodSchema,
});

// ---------------------------------------------------------------------------
// Void entry
// ---------------------------------------------------------------------------

export const voidLedgerEntryBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ListLedgerEntriesQuery = z.infer<typeof listLedgerEntriesQuerySchema>;
export type LedgerEntryParams = z.infer<typeof ledgerEntryParamsSchema>;
export type VoidLedgerEntryBody = z.infer<typeof voidLedgerEntryBodySchema>;
export type LedgerPeriodQuery = z.infer<typeof ledgerPeriodQuerySchema>;
