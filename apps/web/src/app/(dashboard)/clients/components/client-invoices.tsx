'use client';

import { FileText, ArrowUpRight } from 'lucide-react';

const invoiceStatusColor: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-500/10 text-blue-600',
  PAID: 'bg-emerald-500/10 text-emerald-600',
  PARTIALLY_PAID: 'bg-amber-500/10 text-amber-600',
  OVERDUE: 'bg-rose-500/10 text-rose-600',
  CANCELLED: 'bg-muted text-muted-foreground',
};

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: string;
  totalDue: number | string;
  currencyCode?: string;
  invoiceDate: string;
  dueDate: string;
}

interface ClientInvoicesProps {
  invoices: InvoiceItem[];
}

export function ClientInvoices({ invoices }: ClientInvoicesProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
        <FileText className="h-6 w-6 text-muted-foreground/50 mb-2" />
        <span className="text-xs font-semibold text-muted-foreground">No invoices yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
        Invoices ({invoices.length})
      </span>
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between bg-muted/20 border border-border/80 rounded-lg p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-bold text-foreground">{inv.invoiceNumber}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${invoiceStatusColor[inv.status] || ''}`}>
                {inv.status}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              <span>Issued: {new Date(inv.invoiceDate).toLocaleDateString()}</span>
              <span className="ml-2">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              {inv.currencyCode || 'PKR'} {typeof inv.totalDue === 'number' ? inv.totalDue.toLocaleString() : inv.totalDue}
            </span>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
