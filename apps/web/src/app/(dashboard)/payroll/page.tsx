"use client";

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { 
  Search, 
  Calendar,
  Play, 
  Check, 
  SlidersHorizontal, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Info
} from 'lucide-react';

export default function PayrollDashboard() {
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
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#6366F1]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500 font-medium">Loading payroll...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Failed to load payroll</h3>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FC] min-h-screen text-[#1A1A1A] antialiased">
      <main className="max-w-[1360px] mx-auto p-5 space-y-4">
        
        {/* Module Header Title & Integrated Action Section */}
        <div className="pt-1">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-950 flex items-center gap-1.5">
                Payroll <span className="text-gray-300 font-light">•</span> Module
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">
                API: {data?.module || 'payroll'} · Status: {data?.status || 'unknown'}
              </p>
            </div>
          </div>
          <div className="h-[1px] bg-gray-200/60 w-full mt-3.5" />
        </div>

        {/* API Status Banner */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Backend Module Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-gray-900">{data?.module || 'N/A'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data?.status === 'wip' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {data?.status || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Linear Progress Stepper Component */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm relative">
          <div className="relative flex justify-between items-center max-w-[920px] mx-auto pt-1">
            <div className="absolute left-[30px] right-[30px] top-[14px] h-[3px] bg-gray-100 z-0" />
            <div className="absolute left-[30px] w-[45%] top-[14px] h-[3px] bg-[#10B981] z-0" />

            {[
              { step: 1, label: "Data collection", status: "complete" },
              { step: 2, label: "Review & verify", status: "complete" },
              { step: 3, label: "Payroll run", status: "current" },
              { step: 4, label: "CFO approval", status: "upcoming" },
              { step: 5, label: "Disbursement", status: "upcoming" }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center relative z-10 w-24">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                  ${step.status === 'complete' ? 'bg-[#10B981] text-white' : ''}
                  ${step.status === 'current' ? 'bg-[#EEEEFF] border border-[#6366F1] text-[#6366F1] shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : ''}
                  ${step.status === 'upcoming' ? 'bg-white text-gray-300 border-2 border-gray-150' : ''}
                `}>
                  {step.status === 'complete' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : step.status === 'current' ? (
                    <div className="w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center">
                      <Play className="w-2 h-2 fill-white stroke-none ml-0.5" />
                    </div>
                  ) : (
                    <span className="text-gray-400 font-medium">{step.step}</span>
                  )}
                </div>
                <span className={`text-[11px] mt-2 font-medium whitespace-nowrap tracking-tight
                  ${step.status === 'current' ? 'text-gray-950 font-bold' : 'text-gray-400'}
                `}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-4 font-normal">
            Payroll module is currently in <span className="font-semibold text-gray-700">development</span>.
          </p>
        </section>

        {/* Aggregate KPI Financial Overview Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Total Gross Pay</span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">—</h2>
            </div>
          </div>
          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Total Deductions</span>
              <h2 className="text-2xl font-bold text-[#D97706] tracking-tight mt-0.5">—</h2>
            </div>
          </div>
          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Net Payroll</span>
              <h2 className="text-2xl font-bold text-[#10B981] tracking-tight">—</h2>
              <p className="text-[11px] text-gray-400 pt-0.5 font-normal">Awaiting data</p>
            </div>
          </div>
        </section>

        {/* Functional Search and Processing Controls Toolbar */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#EBECEF] rounded-[10px] p-2.5 shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative w-full max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                className="w-full bg-[#F8F9FC] text-xs pl-9 pr-4 py-1.5 border border-[#E5E7EB] rounded-[6px] placeholder-gray-400 focus:outline-none focus:border-[#6366F1]"
              />
            </div>
            {["Department", "Status", "Grade"].map((filter, i) => (
              <select key={i} className="bg-white border border-[#E5E7EB] rounded-[6px] text-xs px-2.5 py-1.5 text-gray-600 focus:outline-none focus:border-[#6366F1] cursor-pointer">
                <option>{filter}</option>
              </select>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5 text-gray-400" />
              Export
            </button>
          </div>
        </section>

        {/* Empty State for Payroll Ledger */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] overflow-hidden shadow-sm">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-[#6366F1]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Payroll data pending</h3>
            <p className="text-xs text-gray-500 max-w-md">
              The backend payroll module is currently in <strong>{data?.status || 'development'}</strong> status. 
              Full payslip processing, employee-level breakdowns, and payslip generation will be available once the module is live.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
