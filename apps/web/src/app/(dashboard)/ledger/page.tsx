"use client";

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function LedgerBudgetDashboard() {
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/finance/payroll')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="font-sans min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted-foreground font-medium">Loading ledger & budget...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="font-sans min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Failed to load ledger</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="font-sans">
      
      {/* PAGE HEADER */}
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

        <div className="flex flex-wrap items-center gap-6">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            {["Today", "This week", "May 2026", "Q2 2026", "FY 2026"].map((filter) => {
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
          <div className="flex items-center gap-5">
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">Reconcile</button>
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">PDF</button>
            <button type="button" className="text-sm font-bold text-foreground hover:text-primary transition-colors">CSV</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity">
              <span>Export</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* API Status Banner */}
      <section className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Backend Module</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-foreground">{data?.module || 'N/A'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data?.status === 'wip' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {data?.status || 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI RIBBON CARD */}
      <section className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6 w-full">
          {[
            { label: "Opening Balance", value: "—", color: "text-foreground" },
            { label: "Total Credits", value: "—", color: "text-[#2E6B24]" },
            { label: "Total Debits", value: "—", color: "text-[#8A2A2A]" },
            { label: "Net Movement", value: "—", color: "text-[#2E6B24]" },
            { label: "Closing Balance", value: "—", color: "text-primary" },
            { label: "Pending Reconciliation", value: "—", color: "text-[#916222]" },
          ].map((metric) => (
            <div key={metric.label} className="flex flex-col">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">{metric.label}</span>
              <span className={`text-[22px] font-medium font-mono tracking-tight whitespace-nowrap ${metric.color}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-[#3B6327]" style={{ width: '58%' }}></div>
          <div className="h-full bg-[#8A2A2A]" style={{ width: '37%' }}></div>
          <div className="h-full bg-[#D0C9F0]" style={{ width: '5%' }}></div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget vs Actual</h2>
          <div className="flex items-center justify-center min-h-[120px]">
            <p className="text-xs text-muted-foreground">Budget data pending from backend</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Monthly Trend</h2>
          <div className="flex items-center justify-center min-h-[120px]">
            <p className="text-xs text-muted-foreground">Trend data pending from backend</p>
          </div>
        </div>
      </section>

      {/* General Ledger */}
      <section className="mb-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">General Ledger</h2>
          <button type="button" className="inline-flex items-center gap-1 rounded border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-muted">
            <span>Filter</span>
          </button>
        </header>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Ledger data pending</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            The ledger module uses the <strong>/finance/payroll</strong> endpoint which is currently <strong>{data?.status || 'unavailable'}</strong>. Row-level data will populate once the module is connected.
          </p>
        </div>
      </section>

      {/* Bottom Grid */}
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">Budget Tracker YTD</h2>
          <div className="flex items-center justify-around gap-2 min-h-[100px]">
            <p className="text-xs text-muted-foreground">YTD tracking pending</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Chart of Accounts</h2>
          <div className="flex items-center justify-center min-h-[100px]">
            <p className="text-xs text-muted-foreground">Chart of accounts pending</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground font-mono">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Endpoint:</span>
          <span className="text-primary">/finance/payroll</span>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md bg-muted px-3.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>Status: {data?.status || 'unknown'}</span>
        </div>
      </footer>
    </main>
  );
}
