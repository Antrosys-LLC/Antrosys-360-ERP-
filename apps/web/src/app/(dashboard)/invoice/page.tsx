'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Eye, Send, Trash2, ArrowLeft, Search, X, Download,
  ChevronDown, CheckCircle2, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import apiClient from '@/lib/api-client';

// Types matching the Prisma schema
type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discountPct: number;
  taxType: string;
  taxRatePct: number;
  lineSubtotal: number;
  lineTaxAmount: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: { id: string; name: string };
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays: number;
  poNumber: string | null;
  currencyCode: string;
  taxRegion: string | null;
  notes: string | null;
  terms: string | null;
  stripePaymentLink: string | null;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  withholdingTotal: number;
  totalDue: number;
  lineItems?: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

interface InvoiceFormData {
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays: number;
  poNumber: string;
  currencyCode: string;
  taxRegion: string;
  notes: string;
  terms: string;
  lineItems: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountPct: number;
    taxType: string;
    taxRatePct: number;
  }[];
}

const STATUS_VARIANTS: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SENT: 'default',
  PAID: 'outline',
  PARTIALLY_PAID: 'default',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
};

function formatCurrency(amount: number, code = 'PKR') {
  return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch invoices list
  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/invoices');
        const data = res.data?.data?.items ?? res.data?.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Fetch single invoice details
  const fetchInvoiceDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await apiClient.get(`/invoices/${id}`);
      const data = res.data?.data ?? res.data;
      setSelectedInvoice(data);
    } catch (err: any) {
      console.error('Failed to fetch invoice detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setShowCreateForm(false);
    setSelectedInvoice(inv);
    if (!inv.lineItems) {
      fetchInvoiceDetail(inv.id);
    }
  };

  const handleBack = () => {
    setSelectedInvoice(null);
    setShowCreateForm(false);
  };

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.client?.name?.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q),
    );
  }, [invoices, searchQuery]);

  // Invoice detail view
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</h1>
                <Badge variant={STATUS_VARIANTS[selectedInvoice.status]}>
                  {selectedInvoice.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created {formatDate(selectedInvoice.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            {selectedInvoice.status === 'DRAFT' && (
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
          </div>
        </div>

        {detailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(Number(selectedInvoice.subtotal), selectedInvoice.currencyCode)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Tax</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(Number(selectedInvoice.taxTotal), selectedInvoice.currencyCode)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Withholding</p>
                <p className="text-xl font-bold mt-1 text-amber-600">-{formatCurrency(Number(selectedInvoice.withholdingTotal), selectedInvoice.currencyCode)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-xl font-bold mt-1 text-primary">{formatCurrency(Number(selectedInvoice.totalDue), selectedInvoice.currencyCode)}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={STATUS_VARIANTS[selectedInvoice.status]}>{selectedInvoice.status.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Terms</p>
                    <p className="font-medium">Net {selectedInvoice.paymentTermsDays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">{selectedInvoice.currencyCode}</p>
                  </div>
                  {selectedInvoice.poNumber && (
                    <div>
                      <p className="text-muted-foreground">PO Number</p>
                      <p className="font-medium">{selectedInvoice.poNumber}</p>
                    </div>
                  )}
                  {selectedInvoice.taxRegion && (
                    <div>
                      <p className="text-muted-foreground">Tax Region</p>
                      <p className="font-medium">{selectedInvoice.taxRegion}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Client</h2>
                {selectedInvoice.client ? (
                  <div>
                    <p className="font-medium text-lg">{selectedInvoice.client.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {selectedInvoice.client.id}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Client ID: {selectedInvoice.clientId}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Line Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                        <th className="pb-3 pr-4">Description</th>
                        <th className="pb-3 pr-4 text-right">Qty</th>
                        <th className="pb-3 pr-4 text-right">Unit Price</th>
                        <th className="pb-3 pr-4 text-right">Discount</th>
                        <th className="pb-3 pr-4 text-center">Tax</th>
                        <th className="pb-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-border">
                          <td className="py-3 pr-4 font-medium">{item.description}</td>
                          <td className="py-3 pr-4 text-right">{Number(item.quantity)}</td>
                          <td className="py-3 pr-4 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                          <td className="py-3 pr-4 text-right">{Number(item.discountPct)}%</td>
                          <td className="py-3 pr-4 text-center">
                            <Badge variant="secondary" className="text-xs">
                              {item.taxType} {Number(item.taxRatePct)}%
                            </Badge>
                          </td>
                          <td className="py-3 text-right font-medium">{formatCurrency(Number(item.lineTotal))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes & Terms */}
            {(selectedInvoice.notes || selectedInvoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedInvoice.notes && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-2">Notes</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInvoice.notes}</p>
                  </div>
                )}
                {selectedInvoice.terms && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-2">Terms</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInvoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Link */}
            {selectedInvoice.stripePaymentLink && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Payment Link</h2>
                <a href={selectedInvoice.stripePaymentLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                  {selectedInvoice.stripePaymentLink}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Create invoice form
  if (showCreateForm) {
    return <CreateInvoiceForm onBack={handleBack} onSubmit={async (data) => {
      setCreating(true);
      try {
        const res = await apiClient.post('/invoices', data);
        const newInvoice = res.data?.data ?? res.data;
        setInvoices((prev) => [newInvoice, ...prev]);
        setShowCreateForm(false);
      } catch (err: any) {
        console.error('Failed to create invoice', err);
      } finally {
        setCreating(false);
      }
    }} creating={creating} />;
  }

  // Main list view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all invoices"
        actions={
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        }
      />

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-input rounded-md pl-10 pr-10 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load invoices</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredInvoices.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchQuery ? 'No invoices match your search' : 'No invoices yet'}
          description={searchQuery ? 'Try a different search term.' : 'Create your first invoice to start tracking payments.'}
          action={
            !searchQuery ? (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Invoice List */}
      {!loading && !error && filteredInvoices.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleSelectInvoice(inv)}
                >
                  <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.client?.name ?? inv.clientId}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[inv.status]}>
                      {inv.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(inv.totalDue), inv.currencyCode)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectInvoice(inv); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateInvoiceForm({
  onBack,
  onSubmit,
  creating,
}: {
  onBack: () => void;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  creating: boolean;
}) {
  const [form, setForm] = useState<InvoiceFormData>({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    paymentTermsDays: 15,
    poNumber: '',
    currencyCode: 'PKR',
    taxRegion: 'Pakistan (FBR)',
    notes: '',
    terms: 'Payment is due within 15 days from the date of invoice.',
    lineItems: [
      { description: '', quantity: 1, unit: 'Item', unitPrice: 0, discountPct: 0, taxType: 'GST', taxRatePct: 17 },
    ],
  });

  const update = (field: keyof InvoiceFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateLineItem = (index: number, field: string, value: any) =>
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));

  const addLineItem = () =>
    setForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: '', quantity: 1, unit: 'Item', unitPrice: 0, discountPct: 0, taxType: 'GST', taxRatePct: 17 },
      ],
    }));

  const removeLineItem = (index: number) =>
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Create a new invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client ID</label>
              <input
                type="text"
                value={form.clientId}
                onChange={(e) => update('clientId', e.target.value)}
                required
                placeholder="Enter client ID"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Date</label>
              <input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => update('invoiceDate', e.target.value)}
                required
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
                required
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Terms (Days)</label>
              <input
                type="number"
                min={1}
                value={form.paymentTermsDays}
                onChange={(e) => update('paymentTermsDays', Number(e.target.value))}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PO Number</label>
              <input
                type="text"
                value={form.poNumber}
                onChange={(e) => update('poNumber', e.target.value)}
                placeholder="Optional"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                value={form.currencyCode}
                onChange={(e) => update('currencyCode', e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              >
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Region</label>
              <select
                value={form.taxRegion}
                onChange={(e) => update('taxRegion', e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              >
                <option value="Pakistan (FBR)">Pakistan (FBR)</option>
                <option value="UAE (FTA)">UAE (FTA)</option>
                <option value="Saudi Arabia (ZATCA)">Saudi Arabia (ZATCA)</option>
                <option value="United Kingdom (HMRC)">United Kingdom (HMRC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="pb-3 pr-4 min-w-[200px]">Description</th>
                  <th className="pb-3 pr-4 text-right w-24">Qty</th>
                  <th className="pb-3 pr-4 w-20">Unit</th>
                  <th className="pb-3 pr-4 text-right w-28">Unit Price</th>
                  <th className="pb-3 pr-4 text-right w-20">Disc %</th>
                  <th className="pb-3 pr-4 w-24">Tax</th>
                  <th className="pb-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        placeholder="Description"
                        required
                        className="w-full bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                        required
                        className="w-full text-right bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                        className="w-full bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                        required
                        className="w-full text-right bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={item.discountPct}
                        onChange={(e) => updateLineItem(idx, 'discountPct', Number(e.target.value))}
                        className="w-full text-right bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-1">
                        <select
                          value={item.taxType}
                          onChange={(e) => updateLineItem(idx, 'taxType', e.target.value)}
                          className="w-16 bg-background border border-input rounded px-1 py-1 text-xs focus:ring-1 focus:ring-ring outline-none"
                        >
                          <option value="GST">GST</option>
                          <option value="WHT">WHT</option>
                          <option value="Exempt">Exempt</option>
                          <option value="VAT">VAT</option>
                        </select>
                        {item.taxType !== 'Exempt' && (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={item.taxRatePct}
                            onChange={(e) => updateLineItem(idx, 'taxRatePct', Number(e.target.value))}
                            className="w-14 bg-background border border-input rounded px-1 py-1 text-xs text-right focus:ring-1 focus:ring-ring outline-none"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {form.lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(idx)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <label className="text-sm font-medium">Notes to Client</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={4}
              className="w-full bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
            />
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <label className="text-sm font-medium">Terms & Conditions</label>
            <textarea
              value={form.terms}
              onChange={(e) => update('terms', e.target.value)}
              rows={4}
              className="w-full bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
