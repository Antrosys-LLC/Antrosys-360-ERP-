"use client";

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

const RenderIcon = ({ type, className = "w-5 h-5" }: { type: string; className?: string }) => {
  switch (type) {
    case 'tree':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M9 7l3-3 3 3M8 12l4-4 4 4M6 17l6-6 6 6" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14a6 6 0 0110.657-3.543L19 14H6zm14-4h.01M4 20h16a1 1 0 011 1H3a1 1 0 011-1z" />
        </svg>
      );
    case 'home':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'plug':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function LeaveManagementDashboard() {
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/operations/leave')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted-foreground font-medium">Loading leave management...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Failed to load leave data</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans flex flex-col">
      
      {/* DASHBOARD CONTAINER MAIN STRUCTURE */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-8 space-y-6">
        
        {/* API Status Banner */}
        <section className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module Status</span>
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

        {/* TOP ROW: SUMMARY BALANCE KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: 'annual', label: 'ANNUAL LEAVE', value: '—', subtext: 'days left', iconType: 'tree' },
            { id: 'sick', label: 'SICK LEAVE', value: '—', subtext: 'days left', iconType: 'heart' },
            { id: 'casual', label: 'CASUAL LEAVE', value: '—', subtext: 'days left', iconType: 'coffee' },
            { id: 'wfh', label: 'WORK FROM HOME', value: '—', subtext: 'days left', iconType: 'home' },
            { id: 'unpaid', label: 'UNPAID LEAVE', value: '—', subtext: 'taken', iconType: 'plug' },
          ].map((balance) => (
            <article key={balance.id} className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground block">{balance.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold">{balance.value}</span>
                    <span className="text-xs text-muted-foreground">{balance.subtext}</span>
                  </div>
                </div>
                <div className="p-1.5 rounded text-muted-foreground">
                  <RenderIcon type={balance.iconType} className="w-5 h-5 opacity-70" />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* TWO-COLUMN GRID: CONTENT INTERFACE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Employee: Request Leave</h2>
              <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Leave Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'annual', label: 'Annual', iconType: 'tree' },
                      { id: 'sick', label: 'Sick', iconType: 'heart' },
                      { id: 'casual', label: 'Casual', iconType: 'coffee' },
                      { id: 'wfh', label: 'WFH', iconType: 'home' },
                    ].map((option, idx) => (
                      <div key={option.id} className={`flex items-center justify-between p-3 rounded-[var(--radius)] border cursor-pointer transition-all ${
                        idx === 0 ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20' : 'border-border bg-card text-foreground hover:bg-muted/50'
                      }`}>
                        <div className="flex items-center gap-2.5 text-sm font-medium">
                          <RenderIcon type={option.iconType} className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#FFFDF5] border border-[#FFE082] rounded-[var(--radius)] p-4 flex gap-3 items-start">
                  <div className="text-[#F57F17] mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#F57F17]">Team Conflict Warning</h4>
                    <p className="text-xs text-[#F57F17] opacity-90 leading-relaxed">
                      2 team members are also on leave during May 22-24. Approval may be delayed.
                    </p>
                  </div>
                </div>
                <button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm py-3 rounded-[var(--radius)] transition-opacity flex items-center justify-center gap-2 shadow-sm">
                  <span>Submit request</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Pending Requests</h3>
              <div className="bg-card border border-border rounded-[var(--radius)] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">No pending requests. Data loads from API.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Manager: Approvals</h2>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Pending
                </span>
              </div>

              <div className="bg-card border border-border rounded-[var(--radius)] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">Approvals will appear once backend is connected.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-foreground">Team Schedule</h3>
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border text-left">
                {[
                  { value: '—', label: 'Pending' },
                  { value: '—', label: 'Total Taken' },
                  { value: '—', label: 'Attendance', colorClass: 'text-[#4CAF50]' },
                  { value: '—', label: 'On Leave Today' },
                ].map((metric, i) => (
                  <div key={i} className="space-y-1">
                    <div className={`text-sm font-bold text-foreground ${metric.colorClass || ''}`}>{metric.value}</div>
                    <div className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
