'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccountingEquation,
  fetchBudgetTrackers,
  fetchBudgetVsActual,
  fetchChartOfAccounts,
  fetchLedgerEntries,
  fetchLedgerSummary,
  fetchMonthlyTrend,
  createLedgerEntry,
  updateLedgerEntry,
  voidLedgerEntry,
  type BudgetTrackerItem,
  type BudgetVsActualItem,
  type ChartOfAccountItem,
  type LedgerEntryItem,
  type LedgerSummary,
  type MonthlyTrendItem,
  type LedgerAccountItem as ChartOfAccountItem,
} from '@/lib/ledger-api';

import { jsPDF } from "jspdf";

const DATE_FILTERS = ['Today', 'This week', 'May 2026', 'Q2 2026', 'FY 2026'];

export default function LedgerBudgetDashboard() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('May 2026');
  const [customMonth, setCustomMonth] = useState('2026-05');
  
  // Filtering state
  const [showFilter, setShowFilter] = useState(false);
  const [filterAccount, setFilterAccount] = useState<string | undefined>(undefined);
  const [filterFlag, setFilterFlag] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export Dropdown state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Add Entry Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ref: '',
    description: '',
    entryType: 'CREDIT' as 'DEBIT' | 'CREDIT',
    amount: '',
    accountId: '',
    hasFlag: false
  });

  const formattedPeriod = period.match(/^\d{4}-\d{2}$/) 
    ? new Date(period + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : period;

  // Data Fetching Hooks
  const { data: summary } = useQuery({
    queryKey: ['ledger', 'summary', formattedPeriod],
    queryFn: () => fetchLedgerSummary(formattedPeriod),
  });

  const { data: entriesData, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['ledger', 'entries', formattedPeriod, filterAccount, filterFlag, searchQuery],
    queryFn: () => fetchLedgerEntries({ 
      period: formattedPeriod, 
      accountId: filterAccount,
      hasFlag: filterFlag,
      search: searchQuery || undefined
    }),
  });

  const { data: budgetVsActual } = useQuery({
    queryKey: ['ledger', 'budget-vs-actual'],
    queryFn: fetchBudgetVsActual,
  });

  const { data: monthlyTrend } = useQuery({
    queryKey: ['ledger', 'monthly-trend', formattedPeriod],
    queryFn: () => fetchMonthlyTrend(formattedPeriod),
  });

  const { data: budgetTrackers } = useQuery({
    queryKey: ['ledger', 'budget-trackers'],
    queryFn: fetchBudgetTrackers,
  });

  const { data: chartOfAccounts } = useQuery({
    queryKey: ['ledger', 'chart-of-accounts'],
    queryFn: fetchChartOfAccounts,
  });

  const { data: equation } = useQuery({
    queryKey: ['ledger', 'accounting-equation', formattedPeriod],
    queryFn: () => fetchAccountingEquation(formattedPeriod),
  });

  // Mutations
  const addEntryMutation = useMutation({
    mutationFn: createLedgerEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      setIsAddModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        ref: '',
        description: '',
        entryType: 'CREDIT',
        amount: '',
        accountId: '',
        hasFlag: false
      });
    }
  });

  const toggleVoidMutation = useMutation({
    mutationFn: async ({ id, currentlyVoided }: { id: string; currentlyVoided: boolean }) => {
      if (currentlyVoided) {
        // Unvoid
        return updateLedgerEntry(id, { isVoided: false });
      } else {
        // Void
        return voidLedgerEntry(id, 'Voided from UI double-click');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    }
  });

  const entries = entriesData?.items || [];
  
  // Formatters
  const formatCurrency = (val: number | string) => {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatMovement = (val: number) => {
    const formatted = formatCurrency(Math.abs(val));
    return val > 0 ? `+${formatted}` : `-${formatted}`;
  };

  const handleExportCSV = () => {
    if (!entries.length) {
      alert("No entries to export.");
      return;
    }
    const headers = ['Date', 'Ref', 'Description', 'Type', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...entries.map(row => 
        `"${row.date.split('T')[0]}","${row.ref}","${row.description}","${row.entryType}","${row.amount}","${row.isVoided ? 'VOID' : 'ACTIVE'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger_export_${period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Fallback confirmation
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportPDF = () => {
    if (!entries.length) {
      alert("No entries to export.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new jsPDF() as any;
    doc.setFontSize(16);
    doc.text(`Ledger Export - ${formattedPeriod}`, 14, 20);
    
    doc.setFontSize(10);
    let y = 30;
    doc.text("Date", 14, y);
    doc.text("Ref", 40, y);
    doc.text("Description", 70, y);
    doc.text("Type", 130, y);
    doc.text("Amount", 160, y);
    
    doc.line(14, y + 2, 195, y + 2);
    y += 10;
    
    entries.forEach((row, i) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.date.split('T')[0], 14, y);
      doc.text(row.ref.substring(0, 12), 40, y);
      doc.text(row.description.substring(0, 25), 70, y);
      doc.text(row.entryType, 130, y);
      doc.text(String(row.amount), 160, y);
      y += 8;
    });
    
    doc.save(`ledger_export_${formattedPeriod.replace(' ', '_')}.pdf`);
  };

  return (
    <main className="font-sans">
      
      {/* -------------------------------------------
          PAGE HEADER (MATCHES IMAGE 1 EXACTLY)
      ----------------------------------------------- */}
      <div className="mb-8 flex flex-col gap-5">
        <div className="flex items-center text-[13px]">
          <span className="text-muted-foreground font-medium">Finance</span>
          <span className="text-muted-foreground mx-1.5">›</span>
          <span className="text-muted-foreground font-medium">Ledger & budget</span>
          <span className="mx-4 h-5 w-[1px] bg-border"></span>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Ledger & budget
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            {['Today', 'This week'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPeriod(filter)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  period === filter
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
            
            <div className="relative mx-1">
              <input 
                type="month"
                value={customMonth}
                onClick={() => setPeriod(customMonth)}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomMonth(e.target.value);
                    setPeriod(e.target.value);
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium border-none outline-none transition-all cursor-pointer ${
                  period === customMonth || period === 'May 2026'
                    ? "bg-card text-primary shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              />
            </div>

            {['Q2 2026', 'FY 2026'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPeriod(filter)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  period === filter
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(true)}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              + Add Entry
            </button>
            <div className="h-4 w-[1px] bg-border mx-1"></div>
            <button 
              type="button" 
              onClick={() => setFilterFlag(prev => prev === true ? undefined : true)}
              className={`text-sm font-bold transition-colors ${filterFlag ? 'text-primary' : 'text-foreground hover:text-primary'}`}
            >
              Reconcile
            </button>
            
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <span>Export</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-md border border-border bg-card shadow-lg z-10 animate-in fade-in zoom-in duration-150">
                  <button 
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportCSV();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button 
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportPDF();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------
          KPI RIBBON CARD
      ----------------------------------------------- */}
      <section className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6 w-full">
          
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Opening Balance</span>
            <span className="text-[22px] font-medium text-foreground font-mono tracking-tight whitespace-nowrap">
              {summary ? formatCurrency(summary.openingBalance) : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Total Credits</span>
            <span className="text-[22px] font-medium text-[#2E6B24] font-mono tracking-tight whitespace-nowrap">
              {summary ? formatCurrency(summary.totalCredits) : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Total Debits</span>
            <span className="text-[22px] font-medium text-[#8A2A2A] font-mono tracking-tight whitespace-nowrap">
              {summary ? formatCurrency(summary.totalDebits) : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Net Movement</span>
            <div className="flex items-center gap-1.5 text-[#2E6B24] whitespace-nowrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M4 6h1.5M4 12h1.5M4 18h1.5M18.5 6H20M18.5 12H20M18.5 18H20M6 4v1.5M12 4v1.5M18 4v1.5M6 18.5V20M12 18.5V20M18 18.5V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[22px] font-medium font-mono tracking-tight">
                {summary ? formatMovement(summary.netMovement) : '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Closing Balance</span>
            <div className="inline-flex flex-col border-b-[3px] border-primary pb-1 w-max">
              <span className="text-[22px] font-bold text-primary font-mono tracking-tight leading-none whitespace-nowrap">
                {summary ? formatCurrency(summary.closingBalance) : '-'}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
                {summary?.currencyCode || 'PKR'}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">
              Pending Reconciliation
            </span>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[22px] font-medium text-[#916222] font-mono tracking-tight">
                {summary ? formatCurrency(summary.pendingReconciliation) : '-'}
              </span>
              <button 
                type="button" 
                onClick={() => setFilterFlag(true)}
                className="text-[13px] font-medium text-primary hover:underline ml-1"
              >
                Resolve
              </button>
            </div>
          </div>

        </div>

        <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-[#3B6327]" style={{ width: '58%' }}></div>
          <div className="h-full bg-[#8A2A2A]" style={{ width: '37%' }}></div>
          <div className="h-full bg-[#D0C9F0]" style={{ width: '5%' }}></div>
        </div>
      </section>

      {/* 2. Charts Section Container Group */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget vs Actual</h2>
          <div className="space-y-5">
            {budgetVsActual?.map((item: BudgetVsActualItem) => (
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

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Monthly Trend</h2>
          <div className="flex h-36 items-end justify-between px-2 pt-4 gap-1">
            {monthlyTrend?.map((data: MonthlyTrendItem) => {
              const MAX_H = 112; // h-28 in px
              const parseH = (v: string) => Math.round((parseFloat(v) / 100) * MAX_H);
              const creditPx = parseH(data.creditHeight);
              const debitPx  = parseH(data.debitHeight);
              return (
                <div key={data.month} className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex flex-col justify-end items-center gap-0.5 w-full" style={{ height: `${MAX_H}px` }}>
                    <div
                      className="w-full max-w-[22px] rounded-t-sm bg-[#3B6327] transition-all duration-500"
                      style={{ height: `${creditPx}px` }}
                    />
                    <div
                      className="w-full max-w-[22px] rounded-b-sm bg-[#8A2A2A] transition-all duration-500"
                      style={{ height: `${debitPx}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. General Ledger Data Table */}
      <section className="mb-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-6 py-4.5 gap-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">General Ledger</h2>
          <div className="flex items-center gap-3">
            {showFilter && (
              <>
                <input 
                  type="text" 
                  placeholder="Search Ref or Desc..." 
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                  value={filterAccount || ''}
                  onChange={(e) => setFilterAccount(e.target.value || undefined)}
                >
                  <option value="">All Accounts</option>
                  {chartOfAccounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </>
            )}
            <button 
              type="button" 
              onClick={() => setShowFilter(!showFilter)}
              className={`inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs font-semibold shadow-sm hover:bg-muted ${showFilter ? 'bg-muted text-foreground' : 'bg-card text-muted-foreground'}`}
            >
              <span>Filter</span>
            </button>
          </div>
        </header>

        <div className="overflow-x-auto relative min-h-[200px]">
          {isLoadingEntries && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">Loading...</span>
            </div>
          )}
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
              {entries.map((row: LedgerEntryItem) => {
                const isDebit = row.entryType === 'DEBIT';
                const isCredit = row.entryType === 'CREDIT';
                
                return (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${row.isVoided ? "text-muted-foreground bg-muted/20" : "text-foreground"}`}
                    onDoubleClick={() => {
                      toggleVoidMutation.mutate({ id: row.id, currentlyVoided: row.isVoided });
                    }}
                    title="Double click to toggle void status"
                  >
                    <td className="whitespace-nowrap px-6 py-3.5">
                      {new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
                    </td>
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
                    <td className={`px-4 py-3.5 font-mono text-right ${row.isVoided ? "text-muted-foreground/50" : (isDebit ? "text-[#8A2A2A] font-semibold" : "")}`}>
                      {isDebit ? formatCurrency(row.amount) : "-"}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-right ${row.isVoided ? "text-muted-foreground/50" : (isCredit ? "text-[#2E6B24]" : "")}`}>
                      {isCredit ? formatCurrency(row.amount) : "-"}
                    </td>
                    <td className={`px-6 py-3.5 font-mono text-right font-medium text-primary ${row.isVoided ? 'text-muted-foreground' : ''}`}>
                      -
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && !isLoadingEntries && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted-foreground">
                    No entries found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Bottom Information Grid Blocks */}
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget Tracker YTD</h2>
          <div className="flex items-center justify-around gap-2">
            {budgetTrackers?.map((tracker: BudgetTrackerItem) => {
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (tracker.percentage / 100) * circumference;
              
              const strokeClass = tracker.strokeColor.includes('destructive') 
                ? 'stroke-destructive' 
                : tracker.strokeColor.includes('opacity') 
                  ? 'stroke-primary opacity-60' 
                  : 'stroke-primary';

              return (
                <div key={tracker.id} className="flex flex-col items-center text-center">
                  <div className="relative mb-2.5 flex h-20 w-20 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r={radius} className="stroke-muted" strokeWidth="7" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r={radius} 
                        className={`transition-all duration-300 ${strokeClass}`} 
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

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Chart of Accounts</h2>
          <div className="grid grid-cols-2 gap-3">
            {chartOfAccounts?.map((account: ChartOfAccountItem) => (
              <div 
                key={account.code} 
                onClick={() => {
                  setFilterAccount(account.id);
                  setShowFilter(true);
                  window.scrollTo({ top: 500, behavior: 'smooth' });
                }}
                className="flex items-center rounded border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
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
          <span className="text-primary">Assets ({equation ? formatCurrency(equation.assets) : '0'})</span>
          <span className="text-muted-foreground font-normal">=</span>
          <span className="text-destructive">Liabilities ({equation ? formatCurrency(equation.liabilities) : '0'})</span>
          <span className="text-muted-foreground font-normal">+</span>
          <span className="text-[#2E6B24]">Equity ({equation ? formatCurrency(equation.equity) : '0'})</span>
        </div>
        
        <div className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md border px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
          equation?.isBalanced 
            ? 'bg-[#EBF5EC] border-[#D1E9D4] text-[#2E6B24]' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {equation?.isBalanced ? (
            <>
              <svg className="h-3.5 w-3.5 text-[#2E6B24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Balanced</span>
            </>
          ) : (
            <>
              <span>Out of Balance</span>
            </>
          )}
        </div>
      </footer>

      {/* Add Entry Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg border border-border animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-foreground mb-4">Add Ledger Entry</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addEntryMutation.mutate({
                ...formData,
                amount: Number(formData.amount)
              });
            }} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Date</label>
                  <input type="date" required className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Ref</label>
                  <input type="text" required placeholder="INV-123" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                    value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Account</label>
                <select required className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                  <option value="" disabled>Select Account...</option>
                  {chartOfAccounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Description</label>
                <input type="text" required placeholder="Description of transaction" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Type</label>
                  <select className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    value={formData.entryType} onChange={e => setFormData({...formData, entryType: e.target.value as any})}>
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Amount</label>
                  <input type="number" min="0" step="0.01" required placeholder="0.00" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="hasFlag" 
                  checked={formData.hasFlag} onChange={e => setFormData({...formData, hasFlag: e.target.checked})} />
                <label htmlFor="hasFlag" className="text-sm font-medium text-foreground">Flag for reconciliation</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
                <button type="submit" disabled={addEntryMutation.isPending} className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {addEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}