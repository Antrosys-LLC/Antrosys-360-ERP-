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
// Create entry
// ---------------------------------------------------------------------------

export const createLedgerEntryBodySchema = z.object({
  date: z.coerce.date(),
  ref: z.string().min(1).max(64),
  description: z.string().min(1).max(500),
  entryType: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  accountId: z.string().cuid(),
  currencyCode: z.string().length(3).default('PKR'),
  hasFlag: z.boolean().default(false),
  isVoided: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Update entry (partial patch)
// ---------------------------------------------------------------------------

export const updateLedgerEntryBodySchema = createLedgerEntryBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required for update',
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
export type CreateLedgerEntryBody = z.infer<typeof createLedgerEntryBodySchema>;
export type UpdateLedgerEntryBody = z.infer<typeof updateLedgerEntryBodySchema>;
export type VoidLedgerEntryBody = z.infer<typeof voidLedgerEntryBodySchema>;
export type LedgerPeriodQuery = z.infer<typeof ledgerPeriodQuerySchema>;
