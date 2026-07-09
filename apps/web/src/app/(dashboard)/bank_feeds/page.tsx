import React from 'react';
import { 
  Search, RefreshCw, Link2, Bell, History, 
  Building2, AlertTriangle, ChevronRight, CheckCircle2, 
  Clock, Filter, Columns, MoreVertical, CreditCard,
  User, LayoutList, BookOpen
} from 'lucide-react';

// ==========================================
// MOCK DATA
// ==========================================

const mockAccounts = [
  {
    id: 1,
    name: 'Meezan Bank',
    status: 'Live',
    statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    topBorder: 'border-t-primary',
    currency: 'PKR',
    accountMask: '••••••8921',
    role: 'Primary',
    balance: '29,481,000.00',
    lastSynced: '2m ago',
    syncAction: 'Sync'
  },
  {
    id: 2,
    name: 'HBL',
    status: 'Live',
    statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    topBorder: 'border-t-emerald-500',
    currency: 'PKR',
    accountMask: '••••••4432',
    role: 'Payroll',
    balance: '4,102,550.00',
    lastSynced: '15m ago',
    syncAction: 'Sync'
  },
  {
    id: 3,
    name: 'Standard Chartered',
    status: 'Delayed',
    statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
    topBorder: 'border-t-blue-500',
    currency: 'USD',
    accountMask: '••••••1198',
    role: 'Forex',
    balance: '84,200.50',
    subBalance: '≈ PKR 23,407,739.00 (@ 278.0)',
    lastSynced: '2h ago (EOD SFTP)',
    syncAction: 'Batch only'
  }
];

const mockReconciliationStats = {
  period: 'May 1 - May 16, 2024',
  totalLines: '1,492',
  autoMatched: { count: '1,310', percent: '87.8%' },
  needsReview: { count: '119', percent: '8.0%' },
  unmatched: { count: '63', percent: '4.2%' }
};

const mockBankLines = [
  {
    id: 1,
    date: '16 May 24',
    descTitle: 'Nexus Corp Solutions',
    descSub: 'REF: INV-2024-8991',
    account: 'Meezan',
    accColor: 'text-primary',
    amount: '+42,000,000.00',
    amountColor: 'text-emerald-600',
    matchConfidence: 98,
    matchLabel: '98% (INV)',
    matchColor: 'bg-emerald-500'
  },
  {
    id: 2,
    date: '15 May 24',
    descTitle: 'FT Transfer - Salaries',
    descSub: 'REF: SAL-MAY-BATCH1',
    account: 'HBL',
    accColor: 'text-emerald-600',
    amount: '-387,450.00',
    amountColor: 'text-destructive',
    matchConfidence: 74,
    matchLabel: '74% (JNL)',
    matchColor: 'bg-amber-400'
  },
  {
    id: 3,
    date: '14 May 24',
    descTitle: 'POS Purchase - Stationers',
    descSub: 'CARD: **4921 / LOCAL',
    account: 'Meezan',
    accColor: 'text-primary',
    amount: '-12,400.00',
    amountColor: 'text-destructive',
    matchConfidence: 0,
    matchLabel: '⚠ No Match',
    matchColor: 'bg-destructive'
  },
  {
    id: 4,
    date: '14 May 24',
    descTitle: 'K-Electric Monthly Bill',
    descSub: '',
    account: 'Meezan',
    accColor: 'text-primary',
    amount: '-145,290.00',
    amountColor: 'text-destructive',
    matchConfidence: 82,
    matchLabel: '82% (RULE)',
    matchColor: 'bg-amber-400'
  },
  {
    id: 5,
    date: '13 May 24',
    descTitle: 'Client Deposit: AlphaTech',
    descSub: '',
    account: 'HBL',
    accColor: 'text-emerald-600',
    amount: '+1,200,000.00',
    amountColor: 'text-emerald-600',
    matchConfidence: 95,
    matchLabel: '95% (INV)',
    matchColor: 'bg-emerald-500'
  },
  {
    id: 6,
    date: '12 May 24',
    descTitle: 'INWARD SWIFT: GLOBEX INC',
    badge: 'FX @ 278.0',
    descSub: 'USD 15,000.00',
    account: 'SCB',
    accColor: 'text-blue-600',
    amount: '+4,170,000.00',
    amountSub: 'PKR Eqv',
    amountColor: 'text-emerald-600',
    matchConfidence: 60,
    matchLabel: '60% (INV)',
    matchColor: 'bg-amber-400'
  },
  {
    id: 7,
    date: '11 May 24',
    descTitle: 'PTCL Broadband',
    descSub: '',
    account: 'Meezan',
    accColor: 'text-primary',
    amount: '-15,000.00',
    amountColor: 'text-destructive',
    matchConfidence: 0,
    matchLabel: '⚠ No Match',
    matchColor: 'bg-destructive'
  },
  {
    id: 8,
    date: '11 May 24',
    descTitle: 'Cash Deposit Branch 042',
    descSub: '',
    account: 'Meezan',
    accColor: 'text-primary',
    amount: '+500,000.00',
    amountColor: 'text-emerald-600',
    matchConfidence: 0,
    matchLabel: '⚠ No Match',
    matchColor: 'bg-destructive'
  },
  {
    id: 9,
    date: '10 May 24',
    descTitle: 'Daraz Vendor Payout',
    descSub: '',
    account: 'HBL',
    accColor: 'text-emerald-600',
    amount: '+1,842,100.00',
    amountColor: 'text-emerald-600',
    matchConfidence: 99,
    matchLabel: '99% (Rule: E-Com)',
    matchColor: 'bg-emerald-500'
  }
];

const mockPriorityExceptions = [
  {
    id: 1,
    date: 'May 14',
    account: 'Meezan',
    amount: '-12,400.00',
    title: 'POS Purchase - Stationers',
    isExpanded: true,
    actions: [
      { icon: BookOpen, label: 'Create Journal Entry' },
      { icon: LayoutList, label: 'Assign Category directly' },
      { icon: User, label: 'Mark as Personal / Dir. Loan' }
    ]
  },
  {
    id: 2,
    date: 'May 11',
    account: 'Meezan',
    amount: '-15,000.00',
    title: 'PTCL Broadband',
    isExpanded: false
  },
  {
    id: 3,
    date: 'May 11',
    account: 'Meezan',
    amount: '+500,000.00',
    title: 'Cash Deposit Branch 042',
    isExpanded: false
  }
];

const mockConnectionStatus = [
  { bank: 'Meezan (API)', status: 'Real-time', active: true },
  { bank: 'HBL (API)', status: 'Hourly', active: true },
  { bank: 'SCB (SFTP)', status: 'Daily EOD', active: false }
];

// ==========================================
// COMPONENTS
// ==========================================

export default function BankFeedsDashboard() {
  return (
    <div className="erp-content !m-0 !mt-0 min-h-screen">
      {/* Top Navigation / Header */}
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            Finance <ChevronRight className="w-4 h-4" /> 
            <span className="text-primary font-medium">Bank feeds</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground ml-4">Bank feeds</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="pl-9 pr-4 py-2 border border-input rounded-[var(--radius)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-muted text-sm font-medium rounded-[var(--radius)] transition-colors">
            <RefreshCw className="w-4 h-4" /> Sync All
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-[var(--radius)] transition-colors shadow-sm">
            <Link2 className="w-4 h-4" /> Connect Bank
          </button>
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Bell className="w-5 h-5" /></button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><History className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* Connected Accounts Section */}
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Connected Accounts</h2>
          <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">3 Active</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockAccounts.map((acc) => (
            <div key={acc.id} className={`bg-card text-card-foreground border border-border rounded-[var(--radius)] shadow-sm relative overflow-hidden ${acc.topBorder} border-t-4`}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-[var(--radius)]">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{acc.name}</h3>
                      <p className="text-xs text-muted-foreground">{acc.currency} {acc.accountMask} ({acc.role})</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded border flex items-center gap-1 ${acc.statusColor}`}>
                    {acc.status === 'Live' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {acc.status}
                  </span>
                </div>
                
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-medium">{acc.currency}</span>
                    <span className="text-3xl font-bold">{acc.balance}</span>
                  </div>
                  {acc.subBalance && <p className="text-xs text-muted-foreground mt-1">{acc.subBalance}</p>}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span>Last synced: {acc.lastSynced}</span>
                  <button className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors">
                    <RefreshCw className="w-3 h-3" /> {acc.syncAction}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reconciliation Health Section */}
      <section className="mb-6 bg-card text-card-foreground border border-border rounded-[var(--radius)] shadow-sm p-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Reconciliation Health</h2>
            <p className="text-sm text-muted-foreground">Current period: {mockReconciliationStats.period}</p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Lines</p>
              <p className="text-xl font-bold">{mockReconciliationStats.totalLines}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 uppercase font-semibold">Auto-Matched</p>
              <p className="text-xl font-bold text-emerald-600">{mockReconciliationStats.autoMatched.count}</p>
            </div>
            <div>
              <p className="text-xs text-amber-500 uppercase font-semibold">Needs Review</p>
              <p className="text-xl font-bold text-amber-500">{mockReconciliationStats.needsReview.count}</p>
            </div>
            <div>
              <p className="text-xs text-destructive uppercase font-semibold">Unmatched</p>
              <p className="text-xl font-bold text-destructive">{mockReconciliationStats.unmatched.count}</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full flex overflow-hidden mb-3">
          <div className="bg-emerald-500 h-full" style={{ width: mockReconciliationStats.autoMatched.percent }}></div>
          <div className="bg-amber-400 h-full" style={{ width: mockReconciliationStats.needsReview.percent }}></div>
          <div className="bg-destructive h-full" style={{ width: mockReconciliationStats.unmatched.percent }}></div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {mockReconciliationStats.autoMatched.percent} Automatically Reconciled</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> {mockReconciliationStats.needsReview.percent} Pending Review</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive"></div> {mockReconciliationStats.unmatched.percent} Requires Action</div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bank Lines Table */}
        <div className="lg:col-span-2 bg-card text-card-foreground border border-border rounded-[var(--radius)] shadow-sm flex flex-col">
          {/* Table Header / Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold">Unreconciled Bank Lines</h2>
              <div className="flex bg-muted rounded-[var(--radius)] p-1">
                <button className="px-3 py-1 bg-background shadow-sm rounded-[var(--radius)] text-sm font-medium">All</button>
                <button className="px-3 py-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Review (119)</button>
                <button className="px-3 py-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Unmatched (63)</button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <button className="p-1 hover:bg-muted rounded"><Filter className="w-4 h-4" /></button>
              <button className="p-1 hover:bg-muted rounded"><Columns className="w-4 h-4" /></button>
              <button className="p-1 hover:bg-muted rounded"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                <tr>
                  <th className="p-4 w-10"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary" /></th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold text-center">Account</th>
                  <th className="p-4 font-semibold text-right">Debit / Credit</th>
                  <th className="p-4 font-semibold">Match Confidence</th>
                </tr>
              </thead>
              <tbody>
                {mockBankLines.map((line) => (
                  <tr key={line.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${line.matchConfidence === 0 ? 'bg-destructive/5' : ''}`}>
                    <td className="p-4"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary" /></td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{line.date}</td>
                    <td className="p-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {line.descTitle}
                        {line.badge && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{line.badge}</span>}
                      </div>
                      {line.descSub && <div className="text-xs text-muted-foreground mt-0.5">{line.descSub}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-medium px-2 py-1 border border-border rounded-[var(--radius)] ${line.accColor}`}>{line.account}</span>
                    </td>
                    <td className={`p-4 text-right font-medium whitespace-nowrap ${line.amountColor}`}>
                      {line.amount}
                      {line.amountSub && <div className="text-xs text-muted-foreground font-normal">{line.amountSub}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {line.matchConfidence > 0 ? (
                          <>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${line.matchColor}`} style={{ width: `${line.matchConfidence}%` }}></div>
                            </div>
                            <span className={`text-xs font-medium ${line.matchConfidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{line.matchLabel}</span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-destructive flex items-center gap-1">{line.matchLabel}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 mt-auto border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
            <div>Showing 1-10 of 182 lines</div>
            <div className="flex items-center gap-4">
              <button className="hover:text-foreground font-medium transition-colors">&lt;Prev</button>
              <button className="hover:text-foreground font-medium transition-colors">Next&gt;</button>
            </div>
          </div>
        </div>

        {/* Right Column: Priority Exceptions & Status */}
        <div className="flex flex-col gap-6">
          
          {/* Priority Exceptions Card */}
          <div className="bg-card text-card-foreground border border-destructive/20 rounded-[var(--radius)] shadow-sm">
            <div className="p-4 border-b border-border bg-destructive/5 rounded-t-[var(--radius)]">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Priority Exceptions</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Requires manual intervention</p>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              {mockPriorityExceptions.map((exception) => (
                <div key={exception.id} className="border border-border rounded-[var(--radius)] overflow-hidden">
                  <div className={`p-3 flex justify-between items-start cursor-pointer hover:bg-muted/50 transition-colors ${exception.isExpanded ? 'bg-muted/30' : ''}`}>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{exception.date} • {exception.account}</div>
                      <div className="font-medium text-sm text-foreground">{exception.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-destructive">{exception.amount}</div>
                      {!exception.isExpanded && <ChevronRight className="w-4 h-4 text-muted-foreground inline-block mt-1" />}
                    </div>
                  </div>
                  
                  {/* Expanded Actions */}
                  {exception.isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/10 flex flex-col gap-2">
                      {exception.actions?.map((action, idx) => (
                        <button key={idx} className="flex items-center gap-3 w-full p-2 text-sm text-left border border-border rounded-[var(--radius)] bg-background hover:border-primary hover:text-primary transition-colors">
                          <action.icon className="w-4 h-4 text-muted-foreground" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="bg-card text-card-foreground border border-border rounded-[var(--radius)] shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Connection Status</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {mockConnectionStatus.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.active ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                    <span className="font-medium text-foreground">{status.bank}</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">{status.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}