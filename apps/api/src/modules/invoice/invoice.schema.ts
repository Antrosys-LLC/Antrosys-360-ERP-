import { z } from 'zod';

export const invoiceStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'PAID',
  'PARTIALLY_PAID',
  'OVERDUE',
  'CANCELLED',
]);

export const createInvoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50).optional(),
  unitPrice: z.number().nonnegative(),
  discountPct: z.number().min(0).max(100).default(0),
  taxType: z.enum(['GST', 'WHT', 'EXEMPT', 'CUSTOM']).default('EXEMPT'),
  taxRatePct: z.number().min(0).max(100).default(0),
});

export const updateInvoiceLineItemSchema = createInvoiceLineItemSchema.extend({
  id: z.string().cuid().optional(),
});

export const createInvoiceBodySchema = z.object({
  invoiceNumber: z.string().min(1).max(64),
  clientId: z.string().cuid(),
  projectId: z.string().cuid(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paymentTermsDays: z.number().int().min(0).max(365).default(15),
  poNumber: z.string().max(100).optional(),
  currencyCode: z.string().length(3).default('PKR'),
  taxRegion: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  stripePaymentLink: z.string().url().max(500).optional(),
  lineItems: z.array(createInvoiceLineItemSchema).min(1),
});

export const updateInvoiceBodySchema = z
  .object({
    status: invoiceStatusSchema.optional(),
    invoiceDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    paymentTermsDays: z.number().int().min(0).max(365).optional(),
    poNumber: z.string().max(100).nullable().optional(),
    currencyCode: z.string().length(3).optional(),
    taxRegion: z.string().max(100).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    terms: z.string().max(5000).nullable().optional(),
    stripePaymentLink: z.string().url().max(500).nullable().optional(),
    lineItems: z.array(updateInvoiceLineItemSchema).min(1).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required for update',
  });

export const invoiceParamsSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  clientId: z.string().cuid().optional(),
  status: invoiceStatusSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const sendInvoiceBodySchema = z.object({
  markAsSent: z.boolean().default(true),
});

export type CreateInvoiceBody = z.infer<typeof createInvoiceBodySchema>;
export type UpdateInvoiceBody = z.infer<typeof updateInvoiceBodySchema>;
export type InvoiceParams = z.infer<typeof invoiceParamsSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type SendInvoiceBody = z.infer<typeof sendInvoiceBodySchema>;
