import React from 'react';
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
  MoreVertical,
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

// ==========================================
// PAGE COMPONENT
// ==========================================
export default function InvoiceBuilder() {
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
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{mockData.header.status}</span>
                <span>•</span>
                <span>{mockData.header.id}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-border bg-card rounded-md text-sm font-medium hover:bg-muted transition">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-primary text-primary bg-secondary/30 rounded-md text-sm font-medium hover:bg-secondary transition">
                <span>Save draft</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition shadow-sm">
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
                <input type="text" disabled value={mockData.details.invoiceNumber} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Invoice date</label>
                <input type="text" value={mockData.details.invoiceDate} readOnly className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Due date
                  <span className="text-xs bg-secondary text-primary px-1.5 py-0.5 rounded">15 days</span>
                </label>
                <input type="text" value={mockData.details.dueDate} readOnly className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payment terms</label>
                <div className="relative">
                  <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none">
                    <option>{mockData.details.paymentTerms}</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">PO number</label>
                <input type="text" placeholder="Optional" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <div className="relative">
                  <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none pl-8">
                    <option>{mockData.details.currency}</option>
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
                    <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none">
                      <option>{mockData.details.taxRegion}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                  {mockData.details.activeTaxes.map((tax, idx) => (
                    <span key={idx} className="bg-secondary text-primary text-xs px-2 py-1 rounded-full font-medium">
                      {tax}
                    </span>
                  ))}
                </div>
                <button className="text-sm text-primary hover:underline font-medium">Edit rules</button>
              </div>
            </div>
          </section>

          {/* SECTION: PARTIES */}
          <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Parties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bill To */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">Bill to</label>
                <div className="border border-border rounded-md p-3 flex items-center justify-between mb-4 cursor-pointer hover:border-primary transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                      {mockData.parties.billTo.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{mockData.parties.billTo.name}</p>
                      <p className="text-xs text-muted-foreground">NTN: {mockData.parties.billTo.ntn}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {mockData.parties.billTo.address}
                </div>
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
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="pb-3 font-medium w-8"></th>
                    <th className="pb-3 font-medium w-8">#</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Qty</th>
                    <th className="pb-3 font-medium">Unit</th>
                    <th className="pb-3 font-medium text-right">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Discount</th>
                    <th className="pb-3 font-medium text-center">Tax</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.lineItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr className="border-b border-border hover:bg-muted/30 group">
                        <td className="py-4 text-muted-foreground cursor-grab"><GripVertical className="w-4 h-4" /></td>
                        <td className="py-4 text-muted-foreground">{item.id}</td>
                        <td className="py-4 font-medium text-foreground">{item.desc}</td>
                        <td className="py-4">{item.qty}</td>
                        <td className="py-4 text-muted-foreground">{item.unit}</td>
                        <td className="py-4 text-right">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right">{item.discount}%</td>
                        <td className="py-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.tax === 'Exempt' ? 'bg-muted text-muted-foreground' : 'bg-secondary text-primary'}`}>
                            {item.tax}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right">
                          <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive cursor-pointer opacity-0 group-hover:opacity-100 transition" />
                        </td>
                      </tr>
                      {/* Drag Drop visual indicator after item 3 based on design */}
                      {index === 2 && (
                        <tr>
                          <td colSpan={10} className="p-2">
                            <div className="border-2 border-dashed border-primary/30 bg-secondary/10 text-primary text-xs font-medium text-center py-2 rounded">
                              Drop here
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="w-full mt-4 py-3 border-2 border-dashed border-border rounded-md text-sm font-medium text-primary hover:bg-secondary/20 transition flex items-center justify-center space-x-2">
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
                  className="w-full h-24 bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Terms & conditions</label>
                <textarea 
                  defaultValue="Payment is due within 15 days from the date of invoice. Late payments may be subject to a 1.5% monthly service charge."
                  className="w-full h-24 bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <label className="text-sm font-medium text-muted-foreground block mb-3">Attachments</label>
              <div className="flex items-center space-x-3">
                {mockData.attachments.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2 border border-border bg-muted/50 rounded-md px-3 py-1.5 text-sm">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{file.name}</span>
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                ))}
                <button className="flex items-center space-x-1 border border-border bg-card rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition">
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
                <span className="text-foreground">PKR {mockData.summary.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-yellow-600 font-medium">
                <span>Discount</span>
                <span>-PKR {Math.abs(mockData.summary.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-border pt-3">
                <span>Taxable amount</span>
                <span>PKR {mockData.summary.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST 17%</span>
                <span className="text-foreground">PKR {mockData.summary.gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-yellow-600 font-medium">
                <span>WHT 10%</span>
                <span>-PKR {Math.abs(mockData.summary.wht).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="font-bold text-foreground">Total Due</span>
              <div className="text-right">
                <span className="text-xl font-bold text-primary block">
                  {mockData.summary.currencySymbol} {mockData.summary.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <button className="text-xs text-primary flex items-center justify-end space-x-1 mt-1 hover:underline">
                  <span>Tax breakdown</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
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
                <button className="p-2 border border-border rounded-md hover:bg-muted transition text-muted-foreground">
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
                <button className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-secondary transition text-primary font-medium text-sm">
                  <Send className="w-4 h-4" />
                  <span>Send invoice</span>
                </button>
             </div>
             <div className="space-y-1">
               {mockData.actions.slice(1).map((action) => {
                 const Icon = action.icon;
                 return (
                   <button key={action.id} className={`w-full flex items-center space-x-3 p-2.5 rounded-md hover:bg-muted transition text-sm font-medium ${action.color}`}>
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
                {mockData.activity.map((item, idx) => (
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
              <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-muted-foreground">Draft</span>
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
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
            Cancel
          </button>
          <button className="px-4 py-2 border border-border bg-background rounded-md text-sm font-medium hover:bg-muted transition">
            Save draft
          </button>
          <button className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition">
            <Send className="w-4 h-4" />
            <span>Send Invoice</span>
          </button>
        </div>
      </footer>
    </div>
  );
}