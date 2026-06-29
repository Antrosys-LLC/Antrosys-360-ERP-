import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateInvoiceBody,
  ListInvoicesQuery,
  UpdateInvoiceBody,
} from './invoice.schema';

type MutationAction = 'INVOICE_CREATE' | 'INVOICE_UPDATE' | 'INVOICE_DELETE' | 'INVOICE_SEND';

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function computeLineTotals(line: {
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxType: 'GST' | 'WHT' | 'EXEMPT' | 'CUSTOM';
  taxRatePct: number;
}) {
  const gross = line.quantity * line.unitPrice;
  const discountAmount = gross * (line.discountPct / 100);
  const lineSubtotal = gross - discountAmount;

  let lineTaxAmount = 0;
  if (line.taxType === 'GST' || line.taxType === 'CUSTOM') {
    lineTaxAmount = lineSubtotal * (line.taxRatePct / 100);
  }

  const withholdingAmount = line.taxType === 'WHT' ? lineSubtotal * (line.taxRatePct / 100) : 0;
  const lineTotal = lineSubtotal + lineTaxAmount - withholdingAmount;

  return {
    lineSubtotal,
    lineTaxAmount,
    withholdingAmount,
    lineTotal,
  };
}

function computeInvoiceTotals(lineItems: CreateInvoiceBody['lineItems']) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;
  let taxTotal = 0;
  let withholdingTotal = 0;

  for (const line of lineItems) {
    const gross = line.quantity * line.unitPrice;
    const discountAmount = gross * (line.discountPct / 100);
    const totals = computeLineTotals(line);

    subtotal += gross;
    discountTotal += discountAmount;
    taxableAmount += totals.lineSubtotal;
    taxTotal += totals.lineTaxAmount;
    withholdingTotal += totals.withholdingAmount;
  }

  const totalDue = taxableAmount + taxTotal - withholdingTotal;

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    taxTotal,
    withholdingTotal,
    totalDue,
  };
}

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: MutationAction,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      metadata,
    },
  });
}

export async function listInvoices(query: ListInvoicesQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.clientId) where.clientId = query.clientId;
  if (query.status) where.status = query.status;
  if (query.search) where.invoiceNumber = { contains: query.search, mode: 'insensitive' };
  if (query.fromDate || query.toDate) {
    where.invoiceDate = {
      ...(query.fromDate ? { gte: query.fromDate } : {}),
      ...(query.toDate ? { lte: query.toDate } : {}),
    };
  }

  const invoiceDelegate = (prisma as any).invoice;
  const [total, invoices] = await prisma.$transaction([
    invoiceDelegate.count({ where }),
    invoiceDelegate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        project: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
  ]);

  return {
    items: invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getInvoiceById(invoiceId: string) {
  const invoiceDelegate = (prisma as any).invoice;
  return invoiceDelegate.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      project: true,
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function createInvoice(payload: CreateInvoiceBody, userId: string) {
  const totals = computeInvoiceTotals(payload.lineItems);
  const invoiceDelegate = (prisma as any).invoice;

  return prisma.$transaction(async (tx) => {
    const created = await invoiceDelegate.create({
      data: {
        invoiceNumber: payload.invoiceNumber,
        clientId: payload.clientId,
        projectId: payload.projectId,
        status: 'DRAFT',
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        paymentTermsDays: payload.paymentTermsDays,
        poNumber: payload.poNumber ?? null,
        currencyCode: payload.currencyCode.toUpperCase(),
        taxRegion: payload.taxRegion ?? null,
        notes: payload.notes ?? null,
        terms: payload.terms ?? null,
        stripePaymentLink: payload.stripePaymentLink ?? null,
        subtotal: toDecimal(totals.subtotal),
        discountTotal: toDecimal(totals.discountTotal),
        taxableAmount: toDecimal(totals.taxableAmount),
        taxTotal: toDecimal(totals.taxTotal),
        withholdingTotal: toDecimal(totals.withholdingTotal),
        totalDue: toDecimal(totals.totalDue),
        issuedByUserId: userId,
        lineItems: {
          create: payload.lineItems.map((line, index) => {
            const lineTotals = computeLineTotals(line);
            return {
              sortOrder: index + 1,
              description: line.description,
              quantity: toDecimal(line.quantity),
              unit: line.unit ?? null,
              unitPrice: toDecimal(line.unitPrice),
              discountPct: toDecimal(line.discountPct),
              taxType: line.taxType,
              taxRatePct: toDecimal(line.taxRatePct),
              lineSubtotal: toDecimal(lineTotals.lineSubtotal),
              lineTaxAmount: toDecimal(lineTotals.lineTaxAmount),
              lineTotal: toDecimal(lineTotals.lineTotal),
            };
          }),
        },
      },
      include: {
        client: true,
        project: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await writeAuditLog(tx, userId, 'INVOICE_CREATE', {
      invoiceId: created.id,
      invoiceNumber: created.invoiceNumber,
      clientId: payload.clientId,
      status: created.status,
    });

    return created;
  });
}

export async function updateInvoice(invoiceId: string, payload: UpdateInvoiceBody, userId: string) {
  const invoiceDelegate = (prisma as any).invoice;
  const current = await invoiceDelegate.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true },
  });

  if (!current) return null;

  const nextLineItems = payload.lineItems
    ? payload.lineItems.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        discountPct: line.discountPct,
        taxType: line.taxType,
        taxRatePct: line.taxRatePct,
      }))
    : current.lineItems.map((line: any) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unit: line.unit ?? undefined,
        unitPrice: Number(line.unitPrice),
        discountPct: Number(line.discountPct),
        taxType: line.taxType,
        taxRatePct: Number(line.taxRatePct),
      }));

  const totals = computeInvoiceTotals(nextLineItems as CreateInvoiceBody['lineItems']);

  return prisma.$transaction(async (tx) => {
    if (payload.lineItems) {
      await (tx as any).invoiceLineItem.deleteMany({ where: { invoiceId } });
    }

    const updated = await invoiceDelegate.update({
      where: { id: invoiceId },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.invoiceDate ? { invoiceDate: payload.invoiceDate } : {}),
        ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
        ...(payload.paymentTermsDays !== undefined
          ? { paymentTermsDays: payload.paymentTermsDays }
          : {}),
        ...(payload.poNumber !== undefined ? { poNumber: payload.poNumber } : {}),
        ...(payload.currencyCode ? { currencyCode: payload.currencyCode.toUpperCase() } : {}),
        ...(payload.taxRegion !== undefined ? { taxRegion: payload.taxRegion } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        ...(payload.terms !== undefined ? { terms: payload.terms } : {}),
        ...(payload.stripePaymentLink !== undefined
          ? { stripePaymentLink: payload.stripePaymentLink }
          : {}),
        subtotal: toDecimal(totals.subtotal),
        discountTotal: toDecimal(totals.discountTotal),
        taxableAmount: toDecimal(totals.taxableAmount),
        taxTotal: toDecimal(totals.taxTotal),
        withholdingTotal: toDecimal(totals.withholdingTotal),
        totalDue: toDecimal(totals.totalDue),
        ...(payload.lineItems
          ? {
              lineItems: {
                create: payload.lineItems.map((line, index) => {
                  const lineTotals = computeLineTotals(line);
                  return {
                    sortOrder: index + 1,
                    description: line.description,
                    quantity: toDecimal(line.quantity),
                    unit: line.unit ?? null,
                    unitPrice: toDecimal(line.unitPrice),
                    discountPct: toDecimal(line.discountPct),
                    taxType: line.taxType,
                    taxRatePct: toDecimal(line.taxRatePct),
                    lineSubtotal: toDecimal(lineTotals.lineSubtotal),
                    lineTaxAmount: toDecimal(lineTotals.lineTaxAmount),
                    lineTotal: toDecimal(lineTotals.lineTotal),
                  };
                }),
              },
            }
          : {}),
      },
      include: {
        client: true,
        project: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await writeAuditLog(tx, userId, 'INVOICE_UPDATE', {
      invoiceId,
      status: updated.status,
    });

    return updated;
  });
}

export async function deleteInvoice(invoiceId: string, userId: string) {
  const invoiceDelegate = (prisma as any).invoice;
  const current = await invoiceDelegate.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, invoiceNumber: true },
  });

  if (!current) return null;
  if (current.status !== 'DRAFT') {
    throw new Error('Only draft invoices can be deleted');
  }

  await prisma.$transaction(async (tx) => {
    await invoiceDelegate.delete({ where: { id: invoiceId } });
    await writeAuditLog(tx, userId, 'INVOICE_DELETE', {
      invoiceId,
      invoiceNumber: current.invoiceNumber,
    });
  });

  return current;
}

export async function sendInvoice(invoiceId: string, userId: string) {
  const invoiceDelegate = (prisma as any).invoice;
  const existing = await invoiceDelegate.findUnique({ where: { id: invoiceId } });
  if (!existing) return null;

  if (existing.status === 'CANCELLED') {
    throw new Error('Cancelled invoice cannot be sent');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await invoiceDelegate.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
      include: {
        client: true,
        project: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await writeAuditLog(tx, userId, 'INVOICE_SEND', {
      invoiceId,
      previousStatus: existing.status,
      nextStatus: 'SENT',
    });

    return updated;
  });
}
