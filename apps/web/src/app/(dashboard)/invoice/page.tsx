/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Bell,
  History,
  UserCircle,
  Eye,
  Save,
  Send,
  Lock,
  ChevronDown,
  GripVertical,
  Trash2,
  Plus,
  Paperclip,
  X,
  Copy,
  FileText,
  CopyPlus,
  Download,
  Trash,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ==========================================
// MOCK DATA (Ready for API replacement)
// ==========================================
const mockData = {
  header: {
    breadcrumbs: ['Finance', 'Invoices', 'New Invoice'],
    title: 'Invoice builder',
    status: 'Draft',
    id: 'INV-2026-00483',
  },
  details: {
    invoiceNumber: 'INV-2026-00483',
    invoiceDate: '10/14/2026',
    dueDate: '10/29/2026',
    paymentTerms: 'Net 15',
    poNumber: '',
    currency: 'PKR - Pakistani Rupee',
    taxRegion: 'Pakistan (FBR)',
    activeTaxes: ['GST 17%', 'WHT 10%'],
  },
  parties: {
    billTo: {
      initials: 'NC',
      name: 'Nexus Corp Ltd.',
      ntn: '485201-1',
      address: 'Nexus Tower, Floor 14\nMain Clifton Road, Block 4\nKarachi, 75600\nPakistan',
    },
    from: {
      initials: 'A',
      name: 'Antrosys ERP (HQ)',
      company: 'Antrosys Technologies PVT LTD.',
      address: 'Software Technology Park, I-9/3\nIslamabad, 44000\nPakistan',
      ntn: '998822-4',
      strn: '3277199201',
    },
  },
  lineItems: [
    { id: 1, desc: 'Software development', qty: 1, unit: 'N/A', price: 1200000.00, discount: 0, tax: 'GST 17%', amount: 1200000.00 },
    { id: 2, desc: 'UI/UX design', qty: 1.5, unit: 'Hour', price: 85000.00, discount: 0, tax: 'GST 17%', amount: 127500.00 },
    { id: 3, desc: 'Project management', qty: 1, unit: 'Item', price: 0.00, discount: 0, tax: 'Exempt', amount: 0.00 },
    { id: 4, desc: 'Cloud hosting', qty: 1, unit: 'Month', price: 45000.00, discount: 0, tax: 'Exempt', amount: 45000.00 },
    { id: 5, desc: 'Travel reimbursement', qty: 1, unit: 'N/A', price: 18000.00, discount: 0, tax: 'Exempt', amount: 18000.00 },
  ],
  summary: {
    subtotal: 1467000.00,
    discount: -8500.00,
    taxableAmount: 1458500.00,
    gst: 247945.00,
    wht: -146850.00,
    totalDue: 1559595.00,
    currencySymbol: 'PKR',
  },
  paymentMethods: {
    stripeLink: 'buy.stripe.com/pkr_8921',
    bankTransfer: {
      bank: 'Meezan Bank Ltd',
      account: '029910065412',
      title: 'Antrosys Technologies',
    },
  },
  actions: [
    { id: 'send', label: 'Send invoice', icon: Send, color: 'text-primary' },
    { id: 'save', label: 'Save current draft', icon: Save, color: 'text-foreground' },
    { id: 'duplicate', label: 'Duplicate Invoice', icon: CopyPlus, color: 'text-foreground' },
    { id: 'download', label: 'Download PDF', icon: Download, color: 'text-foreground' },
    { id: 'discard', label: 'Discard draft', icon: Trash, color: 'text-destructive', isDestructive: true },
  ],
  activity: [
    { id: 1, title: 'Stripe link generated', time: 'Today, 11:45 AM', active: true },
    { id: 2, title: 'Client details updated', time: 'Today, 10:20 AM' },
    { id: 3, title: 'Taxes calculated', time: 'Today, 10:15 AM' },
    { id: 4, title: '5 items added', time: 'Today, 09:50 AM' },
    { id: 5, title: 'Draft created', time: 'Yesterday, 4:30 PM' },
  ],
  attachments: [
    { id: 'att1', name: 'SOW_v2.pdf' },
    { id: 'att2', name: 'PO_7721.pdf' },
  ],
  footerStatus: [
    { id: 1, label: 'Client set', active: true },
    { id: 2, label: 'Items added', active: true },
    { id: 3, label: 'Approval pending', active: false },
  ],
};

const CLIENT_OPTIONS = [
  mockData.parties.billTo,
  {
    initials: 'AH',
    name: 'Apex Holdings',
    ntn: '772104-3',
    address: 'Finance Tower, I.I. Chundrigar Road\nKarachi, 74000\nPakistan',
  },
  {
    initials: 'VA',
    name: 'Vanta AI',
    ntn: '331902-8',
    address: 'Plot 19, Blue Area\nIslamabad, 44000\nPakistan',
  },
  {
    initials: 'BC',
    name: 'BrightX Corp',
    ntn: '902114-2',
    address: 'Suite 402, Gulberg III\nLahore, 54660\nPakistan',
  },
];

const TAX_REGION_OPTIONS = [
  'Pakistan (FBR)',
  'UAE (FTA)',
  'Saudi Arabia (ZATCA)',
  'United Kingdom (HMRC)',
];

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function formatPkr(amount: number) {
  return `PKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

type BillToParty = {
  initials: string;
  name: string;
  ntn: string;
  address: string;
};

type InvoiceDocumentProps = {
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  billTo: BillToParty;
  from: typeof mockData.parties.from;
  lineItems: typeof mockData.lineItems;
  summary: {
    subtotal: number;
    discount: number;
    taxableAmount: number;
    gst: number;
    wht: number;
    totalDue: number;
    currencySymbol: string;
  };
  taxBreakdown: {
    gstLines: { desc: string; amount: number }[];
    whtLines: { desc: string; amount: number }[];
  };
  gstRate: number;
  whtRate: number;
  paymentMethods: typeof mockData.paymentMethods;
};

function InvoiceDocument({
  invoiceNumber,
  status,
  invoiceDate,
  dueDate,
  poNumber,
  billTo,
  from,
  lineItems,
  summary,
  taxBreakdown,
  gstRate,
  whtRate,
  paymentMethods,
}: InvoiceDocumentProps) {
  return (
    <div className="bg-white text-gray-900 text-sm leading-relaxed">
      <div className="flex items-start justify-between border-b border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="text-gray-500 mt-1">{invoiceNumber}</p>
        </div>
        <div className="text-right text-sm">
          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{status}</span>
          <p className="mt-2 text-gray-600">Invoice date: <span className="text-gray-900 font-medium">{invoiceDate}</span></p>
          <p className="text-gray-600">Due date: <span className="text-gray-900 font-medium">{dueDate}</span></p>
          {poNumber && <p className="text-gray-600">PO: <span className="text-gray-900 font-medium">{poNumber}</span></p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Bill to</p>
          <p className="font-semibold text-gray-900">{billTo.name}</p>
          {billTo.ntn && <p className="text-gray-600 text-xs mt-1">NTN: {billTo.ntn}</p>}
          <p className="text-gray-700 whitespace-pre-line mt-2">{billTo.address}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">From</p>
          <p className="font-semibold text-gray-900">{from.name}</p>
          <p className="text-gray-700 font-medium">{from.company}</p>
          <p className="text-gray-700 whitespace-pre-line mt-1">{from.address}</p>
          <p className="text-gray-600 text-xs mt-2">NTN: {from.ntn} · STRN: {from.strn}</p>
        </div>
      </div>

      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="pb-2 py-2 pr-2">#</th>
            <th className="pb-2 py-2 pr-4">Description</th>
            <th className="pb-2 py-2 text-right">Qty</th>
            <th className="pb-2 py-2 text-right">Unit Price</th>
            <th className="pb-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2.5 pr-2 text-gray-500">{item.id}</td>
              <td className="py-2.5 pr-4 text-gray-900 break-words">{item.desc}</td>
              <td className="py-2.5 text-right text-gray-700">{item.qty}</td>
              <td className="py-2.5 text-right text-gray-700">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="py-2.5 text-right font-medium text-gray-900">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Tax breakdown</p>
          {taxBreakdown.gstLines.length > 0 && (
            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">GST ({gstRate}%)</p>
              <div className="space-y-2">
                {taxBreakdown.gstLines.map((line) => (
                  <div key={`doc-gst-${line.desc}`} className="bg-gray-50 rounded p-2">
                    <p className="text-gray-600 break-words">{line.desc}</p>
                    <p className="text-right font-medium text-gray-900 mt-1">{formatPkr(line.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {taxBreakdown.whtLines.length > 0 && (
            <div>
              <p className="font-semibold text-gray-900 mb-2">WHT ({whtRate}%)</p>
              <div className="space-y-2">
                {taxBreakdown.whtLines.map((line) => (
                  <div key={`doc-wht-${line.desc}`} className="bg-gray-50 rounded p-2">
                    <p className="text-gray-600 break-words">{line.desc}</p>
                    <p className="text-right font-medium text-amber-700 mt-1">-{formatPkr(line.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Invoice summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="text-gray-900">{formatPkr(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>Discount</span>
              <span>-{formatPkr(Math.abs(summary.discount))}</span>
            </div>
            <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
              <span>Taxable amount</span>
              <span>{formatPkr(summary.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST {gstRate}%</span>
              <span className="text-gray-900">{formatPkr(summary.gst)}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>WHT {whtRate}%</span>
              <span>-{formatPkr(Math.abs(summary.wht))}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 mt-2">
              <span>Total due</span>
              <span className="text-blue-700">{summary.currencySymbol} {summary.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Payment methods</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">Stripe payment link</p>
            <p className="text-blue-700 break-all">{paymentMethods.stripeLink}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="font-semibold text-gray-900 mb-3">Bank transfer</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{paymentMethods.bankTransfer.bank}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{paymentMethods.bankTransfer.account}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{paymentMethods.bankTransfer.title}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PAGE COMPONENT
// ==========================================
export default function InvoiceBuilder() {
  const [details, setDetails] = useState(mockData.details);
  const [lineItems, setLineItems] = useState(mockData.lineItems);
  const [attachments, setAttachments] = useState(mockData.attachments);
  const [activity, setActivity] = useState(mockData.activity);
  const [status, setStatus] = useState(mockData.header.status);
  const [poNumber, setPoNumber] = useState(mockData.details.poNumber);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(
    'Payment is due within 15 days from the date of invoice. Late payments may be subject to a 1.5% monthly service charge.',
  );
  const [billTo, setBillTo] = useState(mockData.parties.billTo);
  const [billToMode, setBillToMode] = useState<'select' | 'manual'>('select');
  const [billToOpen, setBillToOpen] = useState(false);
  const [taxRulesOpen, setTaxRulesOpen] = useState(false);
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [whtEnabled, setWhtEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(17);
  const [whtRate, setWhtRate] = useState(10);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const billToRef = useRef<HTMLDivElement | null>(null);
  const invoiceDocRef = useRef<HTMLDivElement | null>(null);

  const summary = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let taxableAmount = 0;
    let gst = 0;
    let wht = 0;

    for (const item of lineItems) {
      const gross = item.qty * item.price;
      const disc = gross * (item.discount / 100);
      const taxable = gross - disc;
      subtotal += gross;
      discount += disc;
      taxableAmount += taxable;

      if (item.tax.includes('GST')) {
        const rate = Number(item.tax.replace(/[^\d.]/g, '')) || 0;
        gst += taxable * (rate / 100);
      }
      if (item.tax.includes('WHT')) {
        const rate = Number(item.tax.replace(/[^\d.]/g, '')) || 0;
        wht += taxable * (rate / 100);
      }
    }

    const totalDue = taxableAmount + gst - wht;
    return {
      subtotal,
      discount: -discount,
      taxableAmount,
      gst,
      wht: -wht,
      totalDue,
      currencySymbol: 'PKR',
    };
  }, [lineItems]);

  const taxBreakdown = useMemo(() => {
    const gstLines: { desc: string; base: number; amount: number }[] = [];
    const whtLines: { desc: string; base: number; amount: number }[] = [];

    for (const item of lineItems) {
      const gross = item.qty * item.price;
      const base = gross - gross * (item.discount / 100);

      if (item.tax.includes('GST')) {
        const rate = Number(item.tax.replace(/[^\d.]/g, '')) || gstRate;
        gstLines.push({ desc: item.desc, base, amount: base * (rate / 100) });
      } else if (item.tax.includes('WHT')) {
        const rate = Number(item.tax.replace(/[^\d.]/g, '')) || whtRate;
        whtLines.push({ desc: item.desc, base, amount: base * (rate / 100) });
      }
    }

    return { gstLines, whtLines };
  }, [lineItems, gstRate, whtRate]);

  const invoiceDocumentProps: InvoiceDocumentProps = useMemo(
    () => ({
      invoiceNumber: details.invoiceNumber,
      status,
      invoiceDate: details.invoiceDate,
      dueDate: details.dueDate,
      poNumber,
      billTo,
      from: mockData.parties.from,
      lineItems,
      summary,
      taxBreakdown,
      gstRate,
      whtRate,
      paymentMethods: mockData.paymentMethods,
    }),
    [details, status, poNumber, billTo, lineItems, summary, taxBreakdown, gstRate, whtRate],
  );

  const toInputDate = (value: string) => {
    const parts = value.split('/');
    if (parts.length !== 3) return '';
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const toDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${month}/${day}/${year}`;
  };

  const logActivity = (title: string) => {
    setActivity((prev) => [
      { id: Date.now(), title, time: 'Just now', active: true },
      ...prev.map((item) => ({ ...item, active: false })),
    ]);
  };

  const handleSaveDraft = () => {
    setStatus('Draft');
    logActivity('Draft saved');
  };

  const handleSendInvoice = () => {
    setStatus('Sent');
    logActivity('Invoice sent');
  };

  const handleDuplicate = () => {
    const duplicated = {
      ...lineItems[lineItems.length - 1],
      id: lineItems.length + 1,
    };
    setLineItems((prev) => [...prev, duplicated]);
    logActivity('Invoice duplicated (line item appended)');
  };

  const handleDiscardDraft = () => {
    setDetails(mockData.details);
    setLineItems(mockData.lineItems);
    setAttachments(mockData.attachments);
    setPoNumber(mockData.details.poNumber);
    setNotes('');
    setTerms(
      'Payment is due within 15 days from the date of invoice. Late payments may be subject to a 1.5% monthly service charge.',
    );
    setBillTo(mockData.parties.billTo);
    setBillToMode('select');
    setBillToOpen(false);
    setTaxRulesOpen(false);
    setTaxBreakdownOpen(false);
    setGstEnabled(true);
    setWhtEnabled(true);
    setGstRate(17);
    setWhtRate(10);
    setStatus('Draft');
    logActivity('Draft discarded and reset');
  };

  const applyTaxRules = () => {
    const activeTaxes: string[] = [];
    if (gstEnabled) activeTaxes.push(`GST ${gstRate}%`);
    if (whtEnabled) activeTaxes.push(`WHT ${whtRate}%`);

    setDetails((prev) => ({ ...prev, activeTaxes }));
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.tax === 'Exempt') return item;
        if (item.tax.includes('GST') && gstEnabled) {
          return { ...item, tax: `GST ${gstRate}%` };
        }
        if (item.tax.includes('WHT') && whtEnabled) {
          return { ...item, tax: `WHT ${whtRate}%` };
        }
        return item;
      }),
    );
    setTaxRulesOpen(false);
    logActivity('Tax rules updated');
  };

  const selectBillToClient = (client: (typeof CLIENT_OPTIONS)[number]) => {
    setBillTo(client);
    setBillToOpen(false);
    logActivity(`Bill-to client changed to ${client.name}`);
  };

  const updateBillToManual = (field: 'name' | 'ntn' | 'address', value: string) => {
    setBillTo((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name') {
        next.initials = getInitials(value);
      }
      return next;
    });
  };

  const handleDownload = async () => {
    if (!invoiceDocRef.current) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(invoiceDocRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${details.invoiceNumber}.pdf`);
    logActivity('Invoice downloaded as PDF');
  };

  const handlePreview = () => {
    setPreviewOpen(true);
    logActivity('Preview opened');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    logActivity('Attachment removed');
  };

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  const onAttachmentFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const next = files.map((file) => ({
      id: `att-${Date.now()}-${file.name}`,
      name: file.name,
    }));
    setAttachments((prev) => [...prev, ...next]);
    logActivity(`${files.length} attachment(s) added`);
    event.target.value = '';
  };

  const handleActionButton = (actionId: string) => {
    if (actionId === 'save') handleSaveDraft();
    if (actionId === 'send') handleSendInvoice();
    if (actionId === 'duplicate') handleDuplicate();
    if (actionId === 'download') handleDownload();
    if (actionId === 'discard') handleDiscardDraft();
  };

  const recalculateLine = (index: number, patch: Partial<(typeof lineItems)[number]>) => {
    setLineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const merged = { ...item, ...patch };
        const gross = merged.qty * merged.price;
        const discounted = gross - gross * (merged.discount / 100);
        return { ...merged, amount: Number(discounted.toFixed(2)) };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative">
      {/* TOP NAVIGATION / BREADCRUMBS */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <nav className="text-sm text-muted-foreground font-medium">
          {mockData.header.breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-2 text-border">{'>'}</span>}
              <span className={idx === mockData.header.breadcrumbs.length - 1 ? 'text-primary' : 'hover:text-foreground cursor-pointer'}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        <div className="flex items-center space-x-4 text-muted-foreground">
          <Bell className="w-5 h-5 cursor-pointer hover:text-foreground" />
          <History className="w-5 h-5 cursor-pointer hover:text-foreground" />
          <UserCircle className="w-6 h-6 cursor-pointer hover:text-foreground" />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{mockData.header.title}</h1>
              <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{status}</span>
                <span>•</span>
                <span>{mockData.header.id}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={handlePreview} className="flex items-center space-x-2 px-4 py-2 border border-border bg-card rounded-md text-sm font-medium hover:bg-muted transition">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button onClick={handleSaveDraft} className="flex items-center space-x-2 px-4 py-2 border border-primary text-primary bg-secondary/30 rounded-md text-sm font-medium hover:bg-secondary transition">
                <span>Save draft</span>
              </button>
              <button onClick={handleSendInvoice} className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition shadow-sm">
                <Send className="w-4 h-4" />
                <span>Send invoice</span>
              </button>
            </div>
          </div>

          {/* SECTION: INVOICE DETAILS */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Invoice details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1 text-muted-foreground">
                  <span>Invoice number</span>
                  <Lock className="w-3.5 h-3.5" />
                </label>
                <input type="text" disabled value={details.invoiceNumber} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Invoice date</label>
                <input type="date" value={toInputDate(details.invoiceDate)} onChange={(e) => setDetails((prev) => ({ ...prev, invoiceDate: toDisplayDate(e.target.value) }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Due date
                  <span className="text-xs bg-secondary text-primary px-1.5 py-0.5 rounded">15 days</span>
                </label>
                <input type="date" value={toInputDate(details.dueDate)} onChange={(e) => setDetails((prev) => ({ ...prev, dueDate: toDisplayDate(e.target.value) }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payment terms</label>
                <div className="relative">
                  <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none">
                    <option>{details.paymentTerms}</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">PO number</label>
                <input type="text" placeholder="Optional" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <div className="relative">
                  <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none pl-8">
                    <option>{details.currency}</option>
                  </select>
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-muted-foreground">Rs</span>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <label className="text-sm font-medium text-foreground block mb-2">Tax region & rules</label>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative w-48">
                    <select
                      value={details.taxRegion}
                      onChange={(e) => setDetails((prev) => ({ ...prev, taxRegion: e.target.value }))}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none"
                    >
                      {TAX_REGION_OPTIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                  {details.activeTaxes.map((tax, idx) => (
                    <span key={idx} className="bg-secondary text-primary text-xs px-2 py-1 rounded-full font-medium">
                      {tax}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTaxRulesOpen((prev) => !prev)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Edit rules
                </button>
              </div>
              {taxRulesOpen && (
                <div className="mt-4 p-4 border border-border rounded-md bg-muted/20 space-y-4">
                  <p className="text-sm font-medium text-foreground">Configure tax rules</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} />
                      <span>GST enabled</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={gstRate}
                        onChange={(e) => setGstRate(Number(e.target.value))}
                        className="w-16 ml-auto bg-background border border-input rounded px-2 py-1 text-sm"
                      />
                      <span>%</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={whtEnabled} onChange={(e) => setWhtEnabled(e.target.checked)} />
                      <span>WHT enabled</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={whtRate}
                        onChange={(e) => setWhtRate(Number(e.target.value))}
                        className="w-16 ml-auto bg-background border border-input rounded px-2 py-1 text-sm"
                      />
                      <span>%</span>
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setTaxRulesOpen(false)}
                      className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyTaxRules}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
                    >
                      Apply rules
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION: PARTIES */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Parties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bill To */}
              <div className="relative" ref={billToRef}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">Bill to</label>
                  <div className="flex items-center space-x-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setBillToMode('select')}
                      className={`px-2 py-1 rounded-md transition ${
                        billToMode === 'select'
                          ? 'bg-secondary text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Select client
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillToMode('manual')}
                      className={`px-2 py-1 rounded-md transition ${
                        billToMode === 'manual'
                          ? 'bg-secondary text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Enter manually
                    </button>
                  </div>
                </div>

                {billToMode === 'select' ? (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setBillToOpen((prev) => !prev)}
                      onKeyDown={(e) => e.key === 'Enter' && setBillToOpen((prev) => !prev)}
                      className="border border-border rounded-md p-3 flex items-center justify-between mb-4 cursor-pointer hover:border-primary transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                          {billTo.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{billTo.name}</p>
                          <p className="text-xs text-muted-foreground">NTN: {billTo.ntn}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${billToOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {billToOpen && (
                      <div className="absolute z-20 left-0 right-0 mb-4 bg-card border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
                        {CLIENT_OPTIONS.map((client) => (
                          <button
                            key={client.name}
                            type="button"
                            onClick={() => selectBillToClient(client)}
                            className={`w-full text-left px-3 py-2.5 flex items-center space-x-3 hover:bg-muted transition ${
                              billTo.name === client.name ? 'bg-secondary/40' : ''
                            }`}
                          >
                            <div className="w-7 h-7 rounded bg-secondary text-primary flex items-center justify-center font-bold text-xs">
                              {client.initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{client.name}</p>
                              <p className="text-xs text-muted-foreground">NTN: {client.ntn}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {billTo.address}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="border border-border rounded-md p-3 flex items-center space-x-3 bg-muted/20">
                      <div className="w-8 h-8 rounded bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                        {billTo.initials}
                      </div>
                      <input
                        type="text"
                        value={billTo.name}
                        onChange={(e) => updateBillToManual('name', e.target.value)}
                        placeholder="Client or company name"
                        className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-ring outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">NTN (optional)</label>
                      <input
                        type="text"
                        value={billTo.ntn}
                        onChange={(e) => updateBillToManual('ntn', e.target.value)}
                        placeholder="e.g. 485201-1"
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Address</label>
                      <textarea
                        value={billTo.address}
                        onChange={(e) => updateBillToManual('address', e.target.value)}
                        placeholder="Street, city, postal code, country"
                        rows={4}
                        className="w-full bg-background border border-input rounded-md p-3 text-sm whitespace-pre-line leading-relaxed focus:ring-1 focus:ring-ring outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* From */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">From</label>
                <div className="border border-border bg-muted/30 rounded-md p-3 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {mockData.parties.from.initials}
                    </div>
                    <p className="text-sm font-semibold">{mockData.parties.from.name}</p>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-line leading-relaxed mb-4">
                    <span className="font-medium">{mockData.parties.from.company}</span>{'\n'}
                    {mockData.parties.from.address}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>NTN: {mockData.parties.from.ntn}</p>
                    <p>STRN: {mockData.parties.from.strn}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: LINE ITEMS */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm text-left">
                <thead className="text-xs text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="pb-3 font-medium w-8"></th>
                    <th className="pb-3 font-medium w-8">#</th>
                    <th className="pb-3 font-medium min-w-[220px]">Description</th>
                    <th className="pb-3 font-medium w-24 pl-4">Qty</th>
                    <th className="pb-3 font-medium w-20">Unit</th>
                    <th className="pb-3 font-medium text-right min-w-[7rem]">Unit Price</th>
                    <th className="pb-3 font-medium text-right min-w-[5rem]">Discount</th>
                    <th className="pb-3 font-medium text-center min-w-[5.5rem]">Tax</th>
                    <th className="pb-3 font-medium text-right min-w-[6rem]">Amount</th>
                    <th className="pb-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 group">
                        <td className="py-4 text-muted-foreground"><GripVertical className="w-4 h-4" /></td>
                        <td className="py-4 text-muted-foreground">{item.id}</td>
                        <td className="py-4 font-medium text-foreground min-w-[220px] pr-4">
                          <input value={item.desc} onChange={(e) => recalculateLine(index, { desc: e.target.value })} className="w-full min-w-[200px] bg-transparent border border-transparent hover:border-border rounded px-2 py-1" />
                        </td>
                        <td className="py-4 pl-4 whitespace-nowrap">
                          <input type="number" min="0" step="0.1" value={item.qty} onChange={(e) => recalculateLine(index, { qty: Number(e.target.value) })} className="w-20 bg-transparent border border-transparent hover:border-border rounded px-2 py-1" />
                        </td>
                        <td className="py-4 text-muted-foreground">{item.unit}</td>
                        <td className="py-4 text-right">
                          <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => recalculateLine(index, { price: Number(e.target.value) })} className="w-28 text-right bg-transparent border border-transparent hover:border-border rounded px-2 py-1" />
                        </td>
                        <td className="py-4 text-right">
                          <input type="number" min="0" max="100" step="0.1" value={item.discount} onChange={(e) => recalculateLine(index, { discount: Number(e.target.value) })} className="w-20 text-right bg-transparent border border-transparent hover:border-border rounded px-2 py-1" />
                          %
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.tax === 'Exempt' ? 'bg-muted text-muted-foreground' : 'bg-secondary text-primary'}`}>
                            {item.tax}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right">
                          <Trash2 onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, id: i + 1 })))} className="w-4 h-4 text-destructive/70 hover:text-destructive cursor-pointer opacity-0 group-hover:opacity-100 transition" />
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setLineItems((prev) => [...prev, { id: prev.length + 1, desc: 'New item', qty: 1, unit: 'Item', price: 0, discount: 0, tax: 'Exempt', amount: 0 }])} className="w-full mt-4 py-3 border-2 border-dashed border-border rounded-md text-sm font-medium text-primary hover:bg-secondary/20 transition flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add line item</span>
            </button>
          </section>

          {/* SECTION: NOTES & TERMS */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Notes & terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Notes to client</label>
                <textarea
                  placeholder="Optional internal or client notes..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-24 bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Terms & conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full h-24 bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <label className="text-sm font-medium text-muted-foreground block mb-3">Attachments</label>
              <div className="flex items-center space-x-3">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onAttachmentFilesSelected} />
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2 border border-border bg-muted/50 rounded-md px-3 py-1.5 text-sm">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{file.name}</span>
                    <X onClick={() => handleRemoveAttachment(file.id)} className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                ))}
                <button onClick={handleAddAttachment} className="flex items-center space-x-1 border border-border bg-card rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION: INVOICE SUMMARY */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Invoice summary</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">PKR {summary.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-yellow-600 font-medium">
                <span>Discount</span>
                <span>-PKR {Math.abs(summary.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-border pt-3">
                <span>Taxable amount</span>
                <span>PKR {summary.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST 17%</span>
                <span className="text-foreground">PKR {summary.gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-yellow-600 font-medium">
                <span>WHT 10%</span>
                <span>-PKR {Math.abs(summary.wht).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="font-bold text-foreground">Total Due</span>
              <div className="text-right">
                <span className="text-xl font-bold text-primary block">
                  {summary.currencySymbol} {summary.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => setTaxBreakdownOpen((prev) => !prev)}
                  className="text-xs text-primary flex items-center justify-end space-x-1 mt-1 hover:underline w-full"
                >
                  <span>Tax breakdown</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${taxBreakdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {taxBreakdownOpen && (
                  <div className="mt-3 pt-3 border-t border-border text-xs space-y-3 text-left">
                    {taxBreakdown.gstLines.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">GST ({gstRate}%)</p>
                        <div className="space-y-2">
                          {taxBreakdown.gstLines.map((line) => (
                            <div key={`gst-${line.desc}`} className="rounded-md bg-muted/30 p-2.5">
                              <p className="text-muted-foreground break-words leading-snug">{line.desc}</p>
                              <p className="text-foreground font-medium text-right mt-1">
                                PKR {line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {taxBreakdown.whtLines.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">WHT ({whtRate}%)</p>
                        <div className="space-y-2">
                          {taxBreakdown.whtLines.map((line) => (
                            <div key={`wht-${line.desc}`} className="rounded-md bg-muted/30 p-2.5">
                              <p className="text-muted-foreground break-words leading-snug">{line.desc}</p>
                              <p className="text-yellow-600 font-medium text-right mt-1">
                                -PKR {line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION: PAYMENT METHODS */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Payment methods</h2>
            
            {/* QR Code Placeholder */}
            <div className="border border-border rounded-md p-6 flex flex-col items-center justify-center mb-6 bg-background">
              {/* Fake QR using CSS shapes purely for visual mock */}
              <div className="w-24 h-24 grid grid-cols-4 grid-rows-4 gap-1 mb-3 opacity-80">
                 <div className="col-span-2 row-span-2 border-4 border-foreground rounded-sm relative"><div className="absolute inset-1 bg-foreground"></div></div>
                 <div className="bg-foreground"></div><div className="bg-background"></div>
                 <div className="bg-background"></div><div className="bg-foreground"></div>
                 <div className="col-span-2 row-span-2 border-4 border-foreground rounded-sm relative"><div className="absolute inset-1 bg-foreground"></div></div>
                 <div className="bg-foreground"></div><div className="bg-foreground"></div>
                 <div className="bg-foreground"></div><div className="bg-background"></div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground tracking-widest">SCAN TO PAY</span>
            </div>

            {/* Stripe Link */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-foreground">Stripe Payment Link</label>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Stripe connected</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="text" readOnly value={mockData.paymentMethods.stripeLink} className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-primary" />
                <button onClick={() => navigator.clipboard.writeText(mockData.paymentMethods.stripeLink)} className="p-2 border border-border rounded-md hover:bg-muted transition text-muted-foreground">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="bg-muted/30 border border-border rounded-md p-4 text-sm space-y-2">
              <h3 className="font-semibold text-foreground mb-3">Bank Transfer</h3>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Bank:</span>
                <span className="col-span-2 font-medium text-right text-foreground">{mockData.paymentMethods.bankTransfer.bank}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Account:</span>
                <span className="col-span-2 font-medium text-right text-foreground">{mockData.paymentMethods.bankTransfer.account}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Title:</span>
                <span className="col-span-2 font-medium text-right text-foreground">{mockData.paymentMethods.bankTransfer.title}</span>
              </div>
            </div>
          </section>

          {/* SECTION: ACTIONS */}
          <section className="bg-card border border-border rounded-lg p-2 shadow-sm">
             <div className="bg-secondary/30 rounded-md p-2 mb-2">
                <button onClick={handleSendInvoice} className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-secondary transition text-primary font-medium text-sm">
                  <Send className="w-4 h-4" />
                  <span>Send invoice</span>
                </button>
             </div>
             <div className="space-y-1">
               {mockData.actions.slice(1).map((action) => {
                 const Icon = action.icon;
                 return (
                   <button key={action.id} onClick={() => handleActionButton(action.id)} className={`w-full flex items-center space-x-3 p-2.5 rounded-md hover:bg-muted transition text-sm font-medium ${action.color}`}>
                     <Icon className="w-4 h-4" />
                     <span>{action.label}</span>
                   </button>
                 );
               })}
             </div>
          </section>

          {/* SECTION: ACTIVITY */}
          <section className="bg-transparent pt-4">
             <h3 className="text-base font-semibold mb-6 px-2">Activity</h3>
             <div className="relative border-l border-border ml-4 space-y-6 pb-4">
                {activity.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${item.active ? 'bg-primary' : 'bg-border'}`}></div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                ))}
             </div>
          </section>

        </div>
      </main>

      {/* STICKY FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 flex items-center justify-between z-50 px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center space-x-6">
           <div className="flex items-center space-x-3 font-semibold text-sm">
              <span>{mockData.header.id}</span>
              <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-muted-foreground">{status}</span>
           </div>
           
           <div className="hidden md:flex items-center space-x-4 text-xs font-medium border-l border-border pl-6">
             {mockData.footerStatus.map((status) => (
                <div key={status.id} className={`flex items-center space-x-1.5 ${status.active ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  {status.active ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span>{status.label}</span>
                </div>
             ))}
           </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleDiscardDraft} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
            Cancel
          </button>
          <button onClick={handleSaveDraft} className="px-4 py-2 border border-border bg-background rounded-md text-sm font-medium hover:bg-muted transition">
            Save draft
          </button>
          <button onClick={handleSendInvoice} className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition">
            <Send className="w-4 h-4" />
            <span>Send Invoice</span>
          </button>
        </div>
      </footer>

      {/* Hidden invoice document for PDF export */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none" aria-hidden="true">
        <div ref={invoiceDocRef} className="w-[794px] p-10">
          <InvoiceDocument {...invoiceDocumentProps} />
        </div>
      </div>

      {/* Invoice preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-10">
              <InvoiceDocument {...invoiceDocumentProps} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}