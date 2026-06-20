import React from 'react';

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

interface SummaryMetrics {
  openingBalance: string;
  totalCredits: string;
  totalDebits: string;
  netMovement: string;
  closingBalance: string;
  currency: string;
  pendingReconciliation: string;
}

interface BudgetVsActualItem {
  id: number;
  name: string;
  percentage: number;
  color: string;
  labelColor: string;
}

interface MonthlyTrendItem {
  month: string;
  creditHeight: string;
  debitHeight: string;
}

interface LedgerRow {
  id: string;
  date: string;
  ref: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  isGroupHeader: boolean;
  groupCount?: number;
  isVoided?: boolean;
  hasFlag?: boolean;
  debitClass?: string;
  creditClass?: string;
  balanceClass?: string;
}

interface BudgetTrackerItem {
  id: number;
  label: string;
  percentage: number;
  strokeColor: string;
}

interface ChartOfAccountItem {
  code: string;
  name: string;
}

// ==========================================
// MOCK DATA STRUCTURES
// ==========================================

const mockSummaryMetrics: SummaryMetrics = {
  openingBalance: "14,500,000",
  totalCredits: "42,150,000",
  totalDebits: "27,630,000",
  netMovement: "+14,520,000",
  closingBalance: "29,020,000",
  currency: "PKR",
  pendingReconciliation: "1,240,000"
};

const mockBudgetVsActual: BudgetVsActualItem[] = [
  { id: 1, name: "Payroll", percentage: 110, color: "bg-destructive", labelColor: "text-destructive" },
  { id: 2, name: "Marketing", percentage: 105, color: "bg-destructive", labelColor: "text-destructive" },
  { id: 3, name: "Operations", percentage: 85, color: "bg-primary", labelColor: "text-primary" }
];

const mockMonthlyTrend: MonthlyTrendItem[] = [
  { month: "Jan", creditHeight: "h-10", debitHeight: "h-8" },
  { month: "Feb", creditHeight: "h-9", debitHeight: "h-5" },
  { month: "Mar", creditHeight: "h-14", debitHeight: "h-9" },
  { month: "Apr", creditHeight: "h-11", debitHeight: "h-8" },
  { month: "May", creditHeight: "h-14", debitHeight: "h-9" },
  { month: "Jun", creditHeight: "h-13", debitHeight: "h-9" }
];

const mockLedgerRows: LedgerRow[] = [
  {
    id: "1",
    date: "May 01",
    ref: "OB-001",
    description: "Opening Balance",
    debit: "-",
    credit: "-",
    balance: "14,500,000",
    isGroupHeader: false,
    isVoided: false,
    hasFlag: false,
    balanceClass: "text-primary font-semibold"
  },
  {
    id: "2",
    date: "",
    ref: "",
    description: "Revenue",
    debit: "-",
    credit: "12,500,000",
    balance: "27,000,000",
    isGroupHeader: true,
    groupCount: 2,
    debitClass: "text-destructive",
    creditClass: "text-[#2E6B24] font-medium",
    balanceClass: "text-primary"
  },
  {
    id: "3",
    date: "May 02",
    ref: "INV-1042",
    description: "Client Payment - Acme Corp",
    debit: "-",
    credit: "8,500,000",
    balance: "23,000,000",
    isGroupHeader: false,
    isVoided: false,
    hasFlag: false,
    creditClass: "text-[#2E6B24]",
    balanceClass: "text-primary"
  },
  {
    id: "4",
    date: "May 05",
    ref: "INV-1043",
    description: "Client Payment - Beta LLC",
    debit: "-",
    credit: "4,000,000",
    balance: "27,000,000",
    isGroupHeader: false,
    isVoided: false,
    hasFlag: true,
    creditClass: "text-[#2E6B24]",
    balanceClass: "text-primary"
  },
  {
    id: "5",
    date: "",
    ref: "",
    description: "Operations",
    debit: "2,500,000",
    credit: "-",
    balance: "24,500,000",
    isGroupHeader: true,
    groupCount: 2,
    debitClass: "text-[#8A2A2A] font-medium",
    balanceClass: "text-primary"
  },
  {
    id: "6",
    date: "May 08",
    ref: "EXP-401",
    description: "Office Supplies (Voided)",
    debit: "150,000",
    credit: "-",
    balance: "27,000,000",
    isGroupHeader: false,
    isVoided: true,
    hasFlag: false,
    balanceClass: "text-muted-foreground"
  },
  {
    id: "7",
    date: "May 10",
    ref: "EXP-402",
    description: "Server Hosting & IT",
    debit: "2,500,000",
    credit: "-",
    balance: "24,500,000",
    isGroupHeader: false,
    isVoided: false,
    hasFlag: false,
    debitClass: "text-[#8A2A2A] font-semibold",
    balanceClass: "text-primary"
  }
];

const mockBudgetTrackers: BudgetTrackerItem[] = [
  { id: 1, label: "Revenue Goal", percentage: 75, strokeColor: "stroke-primary" },
  { id: 2, label: "Opex Limit", percentage: 92, strokeColor: "stroke-destructive" },
  { id: 3, label: "Capex", percentage: 45, strokeColor: "stroke-primary opacity-60" }
];

const mockChartOfAccounts: ChartOfAccountItem[] = [
  { code: "1000", name: "Assets" },
  { code: "2000", name: "Liabilities" },
  { code: "3000", name: "Equity" },
  { code: "4000", name: "Revenue" },
  { code: "5000", name: "COGS" },
  { code: "6000", name: "Expenses" }
];

const mockDateFilters: string[] = ["Today", "This week", "May 2026", "Q2 2026", "FY 2026"];

// ==========================================
// CORE PAGE COMPONENT
// ==========================================

export default function LedgerBudgetDashboard() {
  return (
    <main className="font-sans">
      
      {/* -------------------------------------------
          PAGE HEADER (MATCHES IMAGE 1 EXACTLY)
      ----------------------------------------------- */}
      <div className="mb-8 flex flex-col gap-5">
        {/* Top Row: Breadcrumb & Title */}
        <div className="flex items-center text-[13px]">
          <span className="text-muted-foreground font-medium">Finance</span>
          <span className="text-muted-foreground mx-1.5">›</span>
          <span className="text-muted-foreground font-medium">Ledger & budget</span>
          <span className="mx-4 h-5 w-[1px] bg-border"></span>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Ledger & budget
          </h1>
        </div>

        {/* Bottom Row: Controls & Actions */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Date Filter Segment */}
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            {mockDateFilters.map((filter) => {
              const isActive = filter === "May 2026";
              return (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-5">
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              Reconcile
            </button>
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              PDF
            </button>
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              CSV
            </button>
            
            {/* Export Dropdown Button */}
            <button 
              type="button" 
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <span>Export</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------
          KPI RIBBON CARD (MATCHES IMAGE 2 EXACTLY)
      ----------------------------------------------- */}
      <section className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6 w-full">
          
          {/* Opening Balance */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Opening Balance</span>
            <span className="text-[22px] font-medium text-foreground font-mono tracking-tight whitespace-nowrap">
              {mockSummaryMetrics.openingBalance}
            </span>
          </div>

          {/* Total Credits */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Total Credits</span>
            <span className="text-[22px] font-medium text-[#2E6B24] font-mono tracking-tight whitespace-nowrap">
              {mockSummaryMetrics.totalCredits}
            </span>
          </div>

          {/* Total Debits */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Total Debits</span>
            <span className="text-[22px] font-medium text-[#8A2A2A] font-mono tracking-tight whitespace-nowrap">
              {mockSummaryMetrics.totalDebits}
            </span>
          </div>

          {/* Net Movement */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Net Movement</span>
            <div className="flex items-center gap-1.5 text-[#2E6B24] whitespace-nowrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M4 6h1.5M4 12h1.5M4 18h1.5M18.5 6H20M18.5 12H20M18.5 18H20M6 4v1.5M12 4v1.5M18 4v1.5M6 18.5V20M12 18.5V20M18 18.5V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[22px] font-medium font-mono tracking-tight">
                {mockSummaryMetrics.netMovement}
              </span>
            </div>
          </div>

          {/* Closing Balance */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Closing Balance</span>
            <div className="inline-flex flex-col border-b-[3px] border-primary pb-1 w-max">
              <span className="text-[22px] font-bold text-primary font-mono tracking-tight leading-none whitespace-nowrap">
                {mockSummaryMetrics.closingBalance}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
                {mockSummaryMetrics.currency}
              </span>
            </div>
          </div>

          {/* Pending Reconciliation */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">
              Pending Reconciliation
            </span>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[22px] font-medium text-[#916222] font-mono tracking-tight">
                {mockSummaryMetrics.pendingReconciliation}
              </span>
              <button 
                type="button" 
                className="text-[13px] font-medium text-primary hover:underline ml-1"
              >
                Resolve
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Progress Ribbon */}
        <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-[#3B6327]" style={{ width: '58%' }}></div>
          <div className="h-full bg-[#8A2A2A]" style={{ width: '37%' }}></div>
          <div className="h-full bg-[#D0C9F0]" style={{ width: '5%' }}></div>
        </div>
      </section>

      {/* 2. Charts Section Container Group */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Budget vs Actual Panel */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget vs Actual</h2>
          <div className="space-y-5">
            {mockBudgetVsActual.map((item) => (
              <div key={item.id} className="relative">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className={item.labelColor}>{item.percentage}%</span>
                </div>
                <div className="relative h-[20px] w-full rounded bg-muted overflow-hidden border border-border/50">
                  <div 
                    className={`h-full rounded-r-sm ${item.color}`} 
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Stacked Columns */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Monthly Trend</h2>
          <div className="flex h-36 items-end justify-between px-2 pt-4">
            {mockMonthlyTrend.map((data) => (
              <div key={data.month} className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="flex w-full flex-col justify-end gap-0.5 items-center">
                  <div className={`w-[85%] max-w-[28px] rounded-t-sm bg-[#3B6327] ${data.creditHeight}`}></div>
                  <div className={`w-[85%] max-w-[28px] rounded-b-sm bg-[#8A2A2A] ${data.debitHeight}`}></div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. General Ledger Data Table */}
      <section className="mb-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">General Ledger</h2>
          <button type="button" className="inline-flex items-center gap-1 rounded border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-muted">
            <span>Filter</span>
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <th className="px-6 py-3.5">Date</th>
                <th className="px-4 py-3.5">Ref</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-right">Debit</th>
                <th className="px-4 py-3.5 text-right">Credit</th>
                <th className="px-6 py-3.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {mockLedgerRows.map((row) => {
                if (row.isGroupHeader) {
                  return (
                    <tr key={row.id} className="bg-muted/50 font-semibold text-foreground">
                      <td className="px-6 py-3" colSpan={3}>
                        <button type="button" className="flex items-center gap-2 text-left font-bold text-foreground">
                          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>{row.description}</span>
                          <span className="rounded bg-card border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground shadow-sm">
                            {row.groupCount} entries
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-destructive">{row.debit === "2,500,000" ? "2,500,000" : row.debit}</td>
                      <td className="px-4 py-3 font-mono text-right text-[#2E6B24]">{row.credit !== "-" ? row.credit : ""}</td>
                      <td className={`px-6 py-3 font-mono text-right ${row.balanceClass}`}>{row.balance}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id} className={`hover:bg-muted/50 ${row.isVoided ? "text-muted-foreground" : "text-foreground"}`}>
                    <td className="whitespace-nowrap px-6 py-3.5">{row.date}</td>
                    <td className="font-mono text-[11px] text-muted-foreground px-4 py-3.5">{row.ref}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={row.isVoided ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                          {row.description}
                        </span>
                        {row.hasFlag && (
                          <svg className="h-3.5 w-3.5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H1.35a.75.75 0 00-.636 1.15l4.5 7A.75.75 0 005.85 20h7.5a.75.75 0 00.636-1.15l-4.5-7A.75.75 0 008.85 11h3.622a.75.75 0 00.636-1.15l-4.5-7a.75.75 0 00-1.272 0l-4.5 7A.75.75 0 003.478 11h.004l-2.432-7.905z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-right ${row.isVoided ? "text-muted-foreground/50" : row.debitClass || ""}`}>
                      {row.debit}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-right ${row.isVoided ? "text-muted-foreground/50" : row.creditClass || ""}`}>
                      {row.credit}
                    </td>
                    <td className={`px-6 py-3.5 font-mono text-right font-medium ${row.balanceClass}`}>
                      {row.balance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Bottom Information Grid Blocks */}
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Budget Tracker YTD Progress Rings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget Tracker YTD</h2>
          <div className="flex items-center justify-around gap-2">
            {mockBudgetTrackers.map((tracker) => {
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (tracker.percentage / 100) * circumference;

              return (
                <div key={tracker.id} className="flex flex-col items-center text-center">
                  <div className="relative mb-2.5 flex h-20 w-20 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r={radius} className="stroke-muted" strokeWidth="7" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r={radius} 
                        className={`transition-all duration-300 ${tracker.strokeColor}`} 
                        strokeWidth="7" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-foreground">{tracker.percentage}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">{tracker.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart of Accounts Grid Layout */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Chart of Accounts</h2>
          <div className="grid grid-cols-2 gap-3">
            {mockChartOfAccounts.map((account) => (
              <div 
                key={account.code} 
                className="flex items-center rounded border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <span className="font-mono font-semibold text-muted-foreground">{account.code}</span>
                <span className="text-border mx-2">-</span>
                <span className="font-medium text-foreground">{account.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Balanced Equation Status Alert Bar Footer */}
      <footer className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-muted-foreground font-mono">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Equation:</span>
          <span className="text-primary">Assets (150M)</span>
          <span className="text-muted-foreground font-normal">=</span>
          <span className="text-destructive">Liabilities (60M)</span>
          <span className="text-muted-foreground font-normal">+</span>
          <span className="text-[#2E6B24]">Equity (90M)</span>
        </div>
        
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md bg-[#EBF5EC] border border-[#D1E9D4] px-3.5 py-1 text-[11px] font-bold text-[#2E6B24] uppercase tracking-wider">
          <svg className="h-3.5 w-3.5 text-[#2E6B24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Balanced</span>
        </div>
      </footer>
    </main>
  );
}