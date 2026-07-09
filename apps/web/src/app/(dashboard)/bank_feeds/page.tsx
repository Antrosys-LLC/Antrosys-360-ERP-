"use client";
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

// ==========================================
// TYPES
// ==========================================

interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  type: string;
  status: string;
  statusVariant: 'success' | 'warning';
  currency: string;
  balance: string;
  lastSynced: string;
  canSync: boolean;
  syncLabel?: string;
  conversionText?: string;
}

interface HealthMetrics {
  currentPeriod: string;
  totalLines: string;
  autoMatched: string;
  needsReview: string;
  unmatched: string;
  percentages: {
    autoMatched: string;
    pendingReview: string;
    requiresAction: string;
  };
}

interface SuggestedMatch {
  id: string;
  title: string;
  amount: string;
  date: string;
  accountInfo: string;
  reasons: Array<{ type: string; text: string }>;
}

interface BankLine {
  id: string;
  date: string;
  description: string;
  reference: string;
  accountTag: string;
  amount: string;
  type: 'credit' | 'debit';
  confidence: number;
  confidenceLabel: string;
  confidenceVariant: 'success' | 'warning' | 'danger';
  extraBadge?: string;
  subAmountLabel?: string;
  suggestedMatch: SuggestedMatch | null;
}

interface PriorityException {
  id: string;
  date: string;
  bank: string;
  amount: string;
  description: string;
  hasActions: boolean;
}

interface ConnectionStatus {
  bank: string;
  schedule: string;
  variant: 'success' | 'warning' | 'danger';
}

interface PaginatedResponse<T> {
  lines: T[];
  total: number;
  page: number;
  limit: number;
}

export default function BankFeedsDashboard() {
  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [bankLines, setBankLines] = useState<BankLine[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [priorityExceptions, setPriorityExceptions] = useState<PriorityException[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);

  // UI states
  const [selectedLine, setSelectedLine] = useState<BankLine | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'review' | 'unmatched'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      const [accountsRes, healthRes, linesRes, exceptionsRes, connectionsRes] = await Promise.all([
        apiClient.get('/finance/bank-feeds/accounts'),
        apiClient.get('/finance/bank-feeds/reconciliation-health'),
        apiClient.get(`/finance/bank-feeds/transactions?tab=${activeTab}&page=${currentPage}&limit=50${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`),
        apiClient.get('/finance/bank-feeds/priority-exceptions'),
        apiClient.get('/finance/bank-feeds/connections'),
      ]);

      setAccounts(accountsRes.data.data);
      setHealthMetrics(healthRes.data.data);
      setBankLines(linesRes.data.data.lines);
      setTotalLines(linesRes.data.data.total);
      setCurrentPage(linesRes.data.data.page);
      setPriorityExceptions(exceptionsRes.data.data);
      setConnectionStatuses(connectionsRes.data.data);
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchQuery, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSync = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      await apiClient.post(`/finance/bank-feeds/accounts/${accountId}/sync`);
      showToast('Account synced successfully');
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Sync failed', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmMatch = async () => {
    if (!selectedLine || !selectedLine.suggestedMatch) return;
    setConfirmingId(selectedLine.id);
    try {
      await apiClient.post(`/finance/bank-feeds/transactions/${selectedLine.id}/confirm`, {
        entryId: selectedLine.suggestedMatch.id,
      });
      showToast('Match confirmed successfully');
      setSelectedLine(null);
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to confirm match', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleRejectMatch = async () => {
    if (!selectedLine) return;
    try {
      await apiClient.post(`/finance/bank-feeds/transactions/${selectedLine.id}/reject`);
      showToast('Match rejected');
      setSelectedLine(null);
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to reject match', 'error');
    }
  };

  const handleCreateJournal = async (transactionId: string) => {
    try {
      await apiClient.post(`/finance/bank-feeds/transactions/${transactionId}/create-journal`);
      showToast('Journal entry created');
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to create journal', 'error');
    }
  };

  const handleConnectBank = async (data: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    currencyCode: string;
    balance: number;
    provider: string;
    scheduleType: string;
  }) => {
    try {
      await apiClient.post('/finance/bank-feeds/accounts', data);
      showToast('Bank connected successfully');
      setShowConnectModal(false);
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to connect bank', 'error');
    }
  };

  const filteredLines = bankLines;

  return (
    <div className="bg-background min-h-screen text-foreground font-sans relative antialiased">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-[var(--radius)] shadow-lg text-xs font-medium text-white transition-all animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
        }`}>
          {toast.message}
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-card border-b border-border sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-[var(--topbar-height)]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs text-muted-foreground space-x-1.5">
            <span>Finance</span>
            <span>&gt;</span>
            <span className="text-secondary-foreground font-medium">Bank feeds</span>
          </div>
          <span className="text-muted-foreground text-sm font-light">|</span>
          <h1 className="text-xl font-bold tracking-tight">Bank feeds</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
            />
          </div>

          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-card border border-border hover:bg-muted text-xs font-medium rounded-[var(--radius)] transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6" />
            </svg>
            <span>{loading ? 'Loading...' : 'Sync All'}</span>
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-[var(--radius)] shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Connect Bank</span>
          </button>

          <div className="h-4 w-px bg-border mx-1"></div>

          <button className="p-1.5 text-muted-foreground hover:text-foreground relative rounded-full hover:bg-muted transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT SHELL */}
      <main className="p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* ROW 1: CONNECTED ACCOUNTS GRID */}
        <section>
          <div className="flex items-center space-x-2 mb-3">
            <h2 className="text-base font-semibold tracking-tight">Connected Accounts</h2>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-full">
              {accounts.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-sm animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                ))
              : accounts.map((account) => (
                  <article
                    key={account.id}
                    className={`bg-card border rounded-[var(--radius)] p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
                      account.statusVariant === 'success' ? 'border-l-[3px] border-l-[#7B6AE6]' :
                      'border-l-[3px] border-l-[#F59E0B]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {account.bankName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-foreground leading-tight">{account.bankName}</h3>
                          <p className="text-[11px] text-muted-foreground">{account.currency} {account.accountNumber} <span className="text-[10px] text-muted-foreground/80 font-normal">({account.type})</span></p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        account.statusVariant === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        ● {account.status}
                      </span>
                    </div>

                    <div className="mt-4 pt-1">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Available Balance</p>
                      <div className="flex items-baseline space-x-1 mt-0.5">
                        <span className="text-xs font-semibold text-foreground">{account.currency}</span>
                        <span className="text-xl font-bold tracking-tight text-foreground">{account.balance}</span>
                      </div>
                      {account.conversionText && (
                        <p className="text-[10px] text-muted-foreground/90 mt-0.5 italic">{account.conversionText}</p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <span>Last synced: {account.lastSynced}</span>
                      </span>

                      {account.canSync ? (
                        <button
                          onClick={() => handleSync(account.id)}
                          disabled={syncingId === account.id}
                          className="text-primary font-semibold hover:underline flex items-center space-x-0.5 bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
                        >
                          <svg className={`w-3 h-3 ${syncingId === account.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.25 15.6" />
                          </svg>
                          <span>{syncingId === account.id ? 'Syncing...' : 'Sync'}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground/70 flex items-center space-x-1 bg-muted px-1.5 py-0.5 rounded border border-border/60 text-[10px]">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>{account.syncLabel || 'Batch only'}</span>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
          </div>
        </section>

        {/* ROW 2: RECONCILIATION HEALTH PROGRESS BLOCK */}
        {healthMetrics && (
          <section className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">Reconciliation Health</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Current period: {healthMetrics.currentPeriod}</p>
              </div>

              <div className="flex items-center space-x-6 mt-3 md:mt-0">
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Lines</span>
                  <span className="text-base font-bold text-foreground">{healthMetrics.totalLines}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-green-600 uppercase tracking-wider">Auto-Matched</span>
                  <span className="text-base font-bold text-green-600">{healthMetrics.autoMatched}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Needs Review</span>
                  <span className="text-base font-bold text-amber-600">{healthMetrics.needsReview}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-destructive uppercase tracking-wider">Unmatched</span>
                  <span className="text-base font-bold text-destructive">{healthMetrics.unmatched}</span>
                </div>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3.5 bg-muted rounded-full overflow-hidden flex mb-3">
              <div className="bg-green-500 h-full" style={{ width: healthMetrics.percentages.autoMatched }} title={`Auto-matched: ${healthMetrics.percentages.autoMatched}`}></div>
              <div className="bg-amber-400 h-full" style={{ width: healthMetrics.percentages.pendingReview }} title={`Pending Review: ${healthMetrics.percentages.pendingReview}`}></div>
              <div className="bg-destructive h-full" style={{ width: healthMetrics.percentages.requiresAction }} title={`Requires Action: ${healthMetrics.percentages.requiresAction}`}></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                <span><strong>{healthMetrics.percentages.autoMatched}</strong> Automatically Reconciled</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span><strong>{healthMetrics.percentages.pendingReview}</strong> Pending Review</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-destructive inline-block"></span>
                <span><strong>{healthMetrics.percentages.requiresAction}</strong> Requires Action</span>
              </div>
            </div>
          </section>
        )}

        {/* ROW 3: MAIN DUAL LAYOUT PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* LEFT: TABLE OF RECONCILED LINES (75% WIDTH) */}
          <section className="bg-card border border-border rounded-[var(--radius)] shadow-sm lg:col-span-3 overflow-hidden">

            {/* Table Control/Tabs bar */}
            <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between bg-card gap-2">
              <div className="flex items-center space-x-1">
                <h3 className="text-xs font-bold text-foreground mr-3">Unreconciled Bank Lines</h3>

                <nav className="flex space-x-1 bg-muted p-0.5 rounded-[var(--radius)]" aria-label="Tabs">
                  <button
                    onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                    className={`px-3 py-1 text-[11px] font-medium rounded-[calc(var(--radius)-2px)] transition-all ${
                      activeTab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setActiveTab('review'); setCurrentPage(1); }}
                    className={`px-3 py-1 text-[11px] font-medium rounded-[calc(var(--radius)-2px)] transition-all ${
                      activeTab === 'review' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Review ({healthMetrics?.needsReview || '0'})
                  </button>
                  <button
                    onClick={() => { setActiveTab('unmatched'); setCurrentPage(1); }}
                    className={`px-3 py-1 text-[11px] font-medium rounded-[calc(var(--radius)-2px)] transition-all ${
                      activeTab === 'unmatched' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Unmatched ({healthMetrics?.unmatched || '0'})
                  </button>
                </nav>
              </div>

              <div className="flex items-center space-x-2 text-muted-foreground self-end sm:self-auto">
                <button className="p-1 hover:text-foreground hover:bg-muted rounded transition-colors" title="Filter columns">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 11.293A1 1 0 013 10.586V4z" />
                  </svg>
                </button>
                <button className="p-1 hover:text-foreground hover:bg-muted rounded transition-colors" title="Toggle Layout">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7" />
                  </svg>
                </button>
                <button className="p-1 hover:text-foreground hover:bg-muted rounded transition-colors" title="More options">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* DYNAMIC DATA DATA-TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    <th className="py-2.5 px-4 w-10 text-center">
                      <input type="checkbox" className="rounded border-border text-primary focus:ring-ring" />
                    </th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-3 w-28">Account</th>
                    <th className="py-2.5 px-4 text-right w-44">Debit / Credit</th>
                    <th className="py-2.5 px-4 w-52">Match Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-3 px-4 text-center"><div className="h-3 bg-muted rounded w-3 mx-auto"></div></td>
                          <td className="py-3 px-3"><div className="h-3 bg-muted rounded w-16"></div></td>
                          <td className="py-3 px-4"><div className="h-3 bg-muted rounded w-48"></div></td>
                          <td className="py-3 px-3"><div className="h-3 bg-muted rounded w-14"></div></td>
                          <td className="py-3 px-4"><div className="h-3 bg-muted rounded w-20 ml-auto"></div></td>
                          <td className="py-3 px-4"><div className="h-3 bg-muted rounded w-32"></div></td>
                        </tr>
                      ))
                    : filteredLines.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                            No transactions found
                          </td>
                        </tr>
                      )
                      : filteredLines.map((line) => {
                        const isSelected = selectedLine?.id === line.id;
                        return (
                          <tr
                            key={line.id}
                            onClick={() => setSelectedLine(line)}
                            className={`cursor-pointer hover:bg-muted/50 transition-colors group ${
                              isSelected ? 'bg-secondary/40' : line.confidence === 0 ? 'bg-red-50/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-border text-primary focus:ring-ring" />
                            </td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                              {line.date}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                {line.description}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center space-x-2">
                                <span>{line.reference}</span>
                                {line.extraBadge && (
                                  <span className="px-1.5 py-0.2 bg-secondary text-secondary-foreground rounded text-[9px] uppercase font-bold font-sans">
                                    {line.extraBadge}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-1.5 py-0.5 border border-border bg-card rounded text-[10px] font-semibold text-muted-foreground shadow-2xs">
                                {line.accountTag}
                              </span>
                            </td>
                            <td className={`py-3 px-4 text-right font-bold font-mono tracking-tight ${
                              line.type === 'credit' ? 'text-green-700' : 'text-amber-900'
                            }`}>
                              {line.amount}
                              {line.subAmountLabel && (
                                <span className="block text-[9px] font-normal font-sans text-muted-foreground mt-0.5">
                                  {line.subAmountLabel}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                {line.confidence > 0 ? (
                                  <>
                                    <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          line.confidenceVariant === 'success' ? 'bg-green-500' : 'bg-amber-400'
                                        }`}
                                        style={{ width: `${line.confidence}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-[11px] font-medium ${
                                      line.confidenceVariant === 'success' ? 'text-green-700' : 'text-amber-700'
                                    }`}>
                                      {line.confidenceLabel}
                                    </span>
                                  </>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-destructive border border-red-200 uppercase tracking-wide">
                                    ⚠ {line.confidenceLabel}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing 1-{Math.min(50, totalLines)} of {totalLines} lines</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2 py-1 border border-border bg-card rounded hover:bg-muted disabled:opacity-40 transition-colors text-[11px] font-medium"
                >
                  &lt; Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage * 50 >= totalLines}
                  className="px-2 py-1 border border-border bg-card rounded hover:bg-muted text-[11px] font-medium disabled:opacity-40"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT PANELS COLLAPSED SIDEBAR STRUCTURE (25% WIDTH) */}
          <div className="space-y-5 lg:col-span-1">

            {/* PRIORITY EXCEPTIONS CARD LIST */}
            <section className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-sm">
              <div className="flex items-start space-x-2 mb-1">
                <span className="text-destructive text-sm mt-0.5">⚠</span>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Priority Exceptions</h3>
                  <p className="text-[11px] text-muted-foreground">Requires manual intervention</p>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border border-border/80 rounded-[var(--radius)] bg-card overflow-hidden animate-pulse p-3">
                        <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))
                  : priorityExceptions.length === 0
                    ? (
                      <div className="text-center py-4 text-[11px] text-muted-foreground">
                        No exceptions
                      </div>
                    )
                    : priorityExceptions.map((ex) => (
                      <div key={ex.id} className="border border-border/80 rounded-[var(--radius)] bg-card overflow-hidden">
                        <div className="p-3 bg-muted/20">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{ex.date} • {ex.bank}</span>
                            <span className="font-bold font-mono text-amber-950">{ex.amount}</span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground mt-1">{ex.description}</h4>
                        </div>

                        {ex.hasActions && (
                          <div className="p-2 bg-card border-t border-border/60 flex flex-col space-y-1.5">
                            <button
                              onClick={() => handleCreateJournal(ex.id)}
                              className="w-full text-left px-2.5 py-1.5 border border-border hover:bg-muted/60 rounded text-[11px] font-medium flex items-center space-x-2 transition-colors"
                            >
                              <span className="text-primary text-xs">+</span>
                              <span>Create Journal Entry</span>
                            </button>
                            <button className="w-full text-left px-2.5 py-1.5 border border-border hover:bg-muted/60 rounded text-[11px] font-medium flex items-center space-x-2 transition-colors">
                              <span className="text-muted-foreground text-xs">📁</span>
                              <span>Assign Category directly</span>
                            </button>
                            <button className="w-full text-left px-2.5 py-1.5 border border-border hover:bg-muted/60 rounded text-[11px] font-medium flex items-center space-x-2 transition-colors">
                              <span className="text-muted-foreground text-xs">👤</span>
                              <span>Mark as Personal / Dir. Loan</span>
                            </button>
                          </div>
                        )}

                        {!ex.hasActions && (
                          <div className="p-2 bg-card border-t border-border/40 flex justify-end">
                            <button className="p-1 text-muted-foreground hover:text-primary transition-colors text-[10px] font-bold flex items-center space-x-0.5">
                              <span>Action Exception</span>
                              <span>➔</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            </section>

            {/* INTEGRATION CONNECTION FEEDS STATUS */}
            <section className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-sm">
              <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-3">
                Connection Status
              </h3>
              <ul className="space-y-2 text-xs">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <li key={i} className="flex justify-between items-center py-0.5 animate-pulse">
                        <div className="h-3 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </li>
                    ))
                  : connectionStatuses.map((conn, idx) => (
                    <li key={idx} className="flex justify-between items-center py-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          conn.variant === 'success' ? 'bg-green-500' : 'bg-amber-400'
                        }`}></span>
                        <span className="font-medium text-foreground">{conn.bank}</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {conn.schedule}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>

          </div>
        </div>
      </main>

      {/* =======================================================
          INTERACTIVE SIDEBAR SLIDE-OVER DRAWER (REVIEW MATCH)
          ======================================================= */}
      {selectedLine && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedLine(null)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer content layout frame: PURE WHITE BACKDROP */}
            <div className="w-[440px] max-w-md bg-white border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

              {/* Drawer Top Header Area */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
                <h2 className="text-base font-bold text-foreground">Review Match</h2>
                <button
                  onClick={() => setSelectedLine(null)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Dynamic Context Scroll Frame */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">

                {/* Section A: Bank Account Incoming Line Feed Details Box */}
                <div className="border-[1.5px] border-l-[4px] border-border border-l-green-600 rounded-[var(--radius)] p-4 shadow-2xs">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-muted-foreground block">
                    Bank Line ({selectedLine.accountTag})
                  </span>

                  <div className="flex justify-between items-start mt-1.5">
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      {selectedLine.description}
                    </h3>
                    <span className={`text-sm font-bold font-mono tracking-tight ${
                      selectedLine.type === 'credit' ? 'text-green-700' : 'text-amber-950'
                    }`}>
                      {selectedLine.amount}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground font-medium mt-3 pt-2 border-t border-dashed border-border/80">
                    <span>{selectedLine.date}</span>
                    <span className="font-mono">{selectedLine.reference}</span>
                  </div>
                </div>

                {/* Section B: Radial Score Matching Gauge Indicator */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-amber-50 border-2 border-amber-300">
                    <span className="text-xs font-bold text-amber-700">{selectedLine.confidence}%</span>
                    {/* Ring Accents */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 animate-spin-slow"></div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-2">
                    Automated Match Confidence Score
                  </span>
                </div>

                {/* Section C: Suggested Match Detail or Fallback State */}
                {selectedLine.suggestedMatch ? (
                  <div className="border border-primary/40 bg-secondary/10 rounded-[var(--radius)] overflow-hidden shadow-2xs">

                    {/* Sub header container */}
                    <div className="px-4 py-2.5 bg-secondary/30 border-b border-primary/20 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wide flex items-center space-x-1.5">
                        <span>✨</span> <span>Suggested Match</span>
                      </span>
                      <span className="px-2 py-0.5 bg-card border border-border rounded text-[9px] font-mono font-semibold text-muted-foreground">
                        Journal Entry
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-bold text-primary">
                          {selectedLine.suggestedMatch.id}: {selectedLine.suggestedMatch.title}
                        </h4>
                        <span className="text-xs font-bold font-mono text-foreground">
                          {selectedLine.suggestedMatch.amount}
                        </span>
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5 pb-3 border-b border-border/60">
                        <span>{selectedLine.suggestedMatch.date}</span>
                        <span>{selectedLine.suggestedMatch.accountInfo}</span>
                      </div>

                      {/* Rule Match Reasons Trace Listing */}
                      <div className="mt-4 space-y-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Match Reasons:
                        </p>

                        {selectedLine.suggestedMatch.reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-[11px]">
                            <span className="mt-0.5 shrink-0">
                              {reason.type === 'success' ? '✅' : '⚠️'}
                            </span>
                            <span className={reason.type === 'success' ? 'text-green-800' : 'text-amber-800'}>
                              {reason.text}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-[var(--radius)] p-6 text-center space-y-3 bg-muted/10">
                    <p className="text-xs text-muted-foreground">
                      No automated system reconciliation suggestions matching criteria found for this specific ledger transaction line.
                    </p>
                    <button
                      onClick={() => handleCreateJournal(selectedLine.id)}
                      className="px-3 py-1.5 bg-card border border-border text-[11px] font-semibold rounded hover:bg-muted transition-colors"
                    >
                      Manually Create Matching Voucher
                    </button>
                  </div>
                )}

                {/* Alternate Actions link row */}
                <button className="w-full py-2.5 border border-dashed border-border hover:border-primary hover:text-primary rounded-[var(--radius)] text-xs font-medium text-muted-foreground flex items-center justify-center space-x-2 transition-all bg-card">
                  <span>🔍</span>
                  <span>Find other match alternative</span>
                </button>

              </div>

              {/* Drawer Fixed Footer Sticky Controls Bar */}
              <div className="p-4 border-t border-border bg-muted/10 grid grid-cols-3 gap-3">
                <button
                  onClick={handleRejectMatch}
                  className="px-4 py-2 bg-card border border-border hover:bg-muted text-xs font-semibold rounded-[var(--radius)] transition-colors text-center"
                >
                  Reject
                </button>
                <button
                  onClick={handleConfirmMatch}
                  disabled={!selectedLine.suggestedMatch || confirmingId === selectedLine.id}
                  className="col-span-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-semibold rounded-[var(--radius)] shadow-sm transition-colors text-center disabled:opacity-50"
                >
                  {confirmingId === selectedLine.id ? 'Confirming...' : 'Confirm Match'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          CONNECT BANK MODAL
          ======================================================= */}
      {showConnectModal && <ConnectBankModal
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectBank}
      />}

    </div>
  );
}

// ==========================================
// CONNECT BANK MODAL COMPONENT
// ==========================================

function ConnectBankModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (data: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    currencyCode: string;
    balance: number;
    provider: string;
    scheduleType: string;
  }) => Promise<void>;
}) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('Primary');
  const [currencyCode, setCurrencyCode] = useState('PKR');
  const [balance, setBalance] = useState(0);
  const [provider, setProvider] = useState('API');
  const [scheduleType, setScheduleType] = useState('Real-time');
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;
    setConnecting(true);
    try {
      await onConnect({ bankName, accountNumber, accountType, currencyCode, balance, provider, scheduleType });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-full px-4">
        <div className="bg-white rounded-[var(--radius)] shadow-2xl w-full max-w-md border border-border" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Connect Bank</h2>
            <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                placeholder="e.g. Meezan Bank"
                className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                placeholder="Last 4 digits"
                className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Primary</option>
                  <option>Payroll</option>
                  <option>Forex</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Currency</label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>PKR</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Balance</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                min={0}
                step="0.01"
                className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>API</option>
                  <option>SFTP</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Schedule</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Real-time</option>
                  <option>Hourly</option>
                  <option>Daily EOD</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-xs font-semibold rounded-[var(--radius)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting || !bankName || !accountNumber}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-semibold rounded-[var(--radius)] shadow-sm transition-colors disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
