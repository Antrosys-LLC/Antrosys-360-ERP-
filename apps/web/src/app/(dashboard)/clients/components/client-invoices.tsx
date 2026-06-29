'use client';

import { useState } from 'react';
import { FileText, ArrowUpRight, Plus, Loader2, X, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createInvoice, updateInvoice, deleteInvoice, sendInvoice, fetchProjects } from '../lib/clients-api';
import type { ClientProject } from '../lib/clients-api';

const invoiceStatusColor: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-500/10 text-blue-600',
  PAID: 'bg-emerald-500/10 text-emerald-600',
  PARTIALLY_PAID: 'bg-amber-500/10 text-amber-600',
  OVERDUE: 'bg-rose-500/10 text-rose-600',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'] as const;

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
  clientId: string;
  invoices: InvoiceItem[];
  onUpdate: () => void;
}

export function ClientInvoices({ clientId, invoices, onUpdate }: ClientInvoicesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invNumber, setInvNumber] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const openCreateDialog = async () => {
    setDialogOpen(true);
    try {
      const result = await fetchProjects(clientId);
      setProjects(result);
      if (result.length > 0) setProjectId(result[0].id);
    } catch { setProjects([]); }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: string, value: string | number) => {
    const updated = lineItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    setLineItems(updated);
  };

  const handleCreate = async () => {
    if (!invNumber.trim() || !invDate || !dueDate || !projectId) return;
    const validLines = lineItems.filter((l) => l.description.trim());
    if (validLines.length === 0) return;

    setSubmitting(true);
    try {
      await createInvoice({
        invoiceNumber: invNumber.trim(),
        clientId,
        projectId,
        invoiceDate: new Date(invDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        lineItems: validLines.map((l) => ({
          description: l.description.trim(),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      setDialogOpen(false);
      setInvNumber('');
      setInvDate(new Date().toISOString().slice(0, 10));
      setDueDate('');
      setProjectId('');
      setProjects([]);
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (invId: string, newStatus: string) => {
    setUpdatingId(invId);
    try {
      await updateInvoice(invId, { status: newStatus });
      onUpdate();
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  };

  const handleSend = async (invId: string) => {
    setUpdatingId(invId);
    try {
      await sendInvoice(invId);
      onUpdate();
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  };

  const handleDelete = async (invId: string) => {
    setUpdatingId(invId);
    try {
      await deleteInvoice(invId);
      onUpdate();
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  };

  if (invoices.length === 0 && !dialogOpen) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">Invoices</span>
          <Button variant="outline" size="sm" onClick={openCreateDialog} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Create
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
          <FileText className="h-6 w-6 text-muted-foreground/50 mb-2" />
          <span className="text-xs font-semibold text-muted-foreground">No invoices yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
          Invoices ({invoices.length})
        </span>
        <Button variant="outline" size="sm" onClick={openCreateDialog} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Create
        </Button>
      </div>

      {invoices.map((inv) => {
        const isUpdating = updatingId === inv.id;
        return (
          <div key={inv.id} className="flex items-center justify-between bg-muted/20 border border-border/80 rounded-lg p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-bold text-foreground">{inv.invoiceNumber}</span>
                <div className="relative">
                  <select
                    value={inv.status}
                    onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                    disabled={isUpdating}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded appearance-none cursor-pointer ${invoiceStatusColor[inv.status] || ''} ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    {INVOICE_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                <span>Issued: {new Date(inv.invoiceDate).toLocaleDateString()}</span>
                <span className="ml-2">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {inv.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => handleSend(inv.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-blue-600"
                        title="Send invoice"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="Delete invoice"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </>
              )}
              <span className="text-xs font-bold font-mono text-foreground ml-1">
                {inv.currencyCode || 'PKR'} {typeof inv.totalDue === 'number' ? inv.totalDue.toLocaleString() : inv.totalDue}
              </span>
              <ArrowUpRight className="h-3 w-3 text-muted-foreground/60" />
            </div>
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Invoice Number *</Label>
                <Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="INV-001" />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Input value={clientId.slice(0, 8)} disabled className="text-xs opacity-60" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input value={invDate} onChange={(e) => setInvDate(e.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {projects.length === 0 && <option value="">No projects available</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button variant="ghost" size="sm" onClick={addLineItem} className="h-6 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add item
                </Button>
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-muted/30 border border-border rounded-lg p-2">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      placeholder="Description *"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className="text-xs h-7"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value) || 0)}
                        type="number"
                        min={1}
                        className="text-xs h-7 w-20"
                      />
                      <Input
                        placeholder="Unit price"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                        type="number"
                        min={0}
                        className="text-xs h-7 w-28"
                      />
                      <span className="text-xs font-mono font-bold text-foreground self-center whitespace-nowrap min-w-[60px] text-right">
                        PKR {(item.quantity * item.unitPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button onClick={() => removeLineItem(idx)} className="p-1 mt-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!invNumber.trim() || !invDate || !dueDate || !projectId || lineItems.every((l) => !l.description.trim()) || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
