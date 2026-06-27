'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Phone, Hash, Pencil, CheckCircle2, ChevronRight, ChevronDown, Download, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';

function EmployeeDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState("Personal");
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
    apiClient.get('/hr/employees')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [tabParam]);

  const navigationTabs = ["Personal", "Employment", "Documents", "Assets", "Payslips", "Performance", "Leave history", "Attendance logs"];

  if (loading) {
    return (
      <div className="bg-[#f8f9fa] text-foreground min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#7B6AE6]" />
          <span className="text-sm text-muted-foreground font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f8f9fa] text-foreground min-h-screen flex items-center justify-center">
        <div className="bg-white border border-border rounded-[var(--radius)] p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Failed to load employee data</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] text-foreground min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">

        {/* API Status */}
        <div className="bg-white border border-border rounded-[var(--radius)] p-3 mb-4 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center shrink-0">
            <Hash className="w-4 h-4 text-[#7B6AE6]" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Module:</span>
            <span className="text-sm font-bold text-foreground">{data?.module || 'N/A'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              data?.status === 'wip' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {data?.status || 'unknown'}
            </span>
          </div>
        </div>

        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 mb-6">
          <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">Employees</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">Department</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-foreground font-bold">Employee Profile</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm">Edit profile</button>
            <button className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm">Generate HR letter</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7B6AE6] hover:bg-[#6959cf] rounded-[var(--radius)] transition-colors shadow-sm">
              Actions <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Profile Banner */}
        <header className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#7B6AE6]/10 text-[#7B6AE6] font-bold text-2xl flex items-center justify-center border border-[#7B6AE6]/10">
                    —
                  </div>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Employee</span>
              </div>
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Name</h1>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">Role • Department</p>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">Full-time</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">Location</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-muted-foreground/60" /> email</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-muted-foreground/60" /> phone</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border border-border rounded-[var(--radius)] px-5 py-2.5 shadow-sm mb-6">
          <nav className="flex items-center gap-10 overflow-x-auto no-scrollbar bg-transparent">
            {navigationTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 tracking-tight ${
                  activeTab === tab
                    ? "border-[#7B6AE6] text-[#7B6AE6]" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "Personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Personal information</h2>
                <div className="flex items-center justify-center min-h-[100px]">
                  <p className="text-sm text-muted-foreground">Personal data will load from <strong>/hr/employees</strong> endpoint.</p>
                </div>
              </section>
            </div>
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-transparent">
                      <th colSpan={2} className="px-6 py-4 text-base font-bold text-foreground tracking-tight">Employment snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border bg-transparent">
                      <td colSpan={2} className="px-6 py-3.5 text-sm text-muted-foreground text-center">Data pending from backend</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        )}

        {activeTab === "Payslips" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Payslips · 2026</h2>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Download className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Payslip data pending from backend</p>
            </div>
          </div>
        )}

        {activeTab === "Attendance logs" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Attendance logs · May 2026</h2>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">Attendance data pending from backend</p>
            </div>
          </div>
        )}

        {activeTab !== "Personal" && activeTab !== "Payslips" && activeTab !== "Attendance logs" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Hash className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">{activeTab}</h2>
            <p className="text-sm text-muted-foreground max-w-md">This section will display data from the backend once available.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading profile...</span>
        </div>
      </div>
    }>
      <EmployeeDashboardContent />
    </Suspense>
  );
}
