"use client";

import React, { useState } from 'react';
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

// ==========================================
// MOCK DATA STRUCTURES
// ==========================================

const payrollProgress = [
  { step: 1, label: "Data collection", status: "complete" },
  { step: 2, label: "Review & verify", status: "complete" },
  { step: 3, label: "Payroll run", status: "current" },
  { step: 4, label: "CFO approval", status: "upcoming" },
  { step: 5, label: "Disbursement", status: "upcoming" }
];

const totalGrossBreakdown = [
  { label: "Base 72%", percentage: 72, color: "bg-[#6366F1]" },
  { label: "Allowances 16%", percentage: 16, color: "bg-[#818CF8]" },
  { label: "OT 8%", percentage: 8, color: "bg-[#A5B4FC]" },
  { label: "Bonuses 4%", percentage: 4, color: "bg-[#C7D2FE]" }
];

const dynamicDeductions = [
  { label: "Income Tax", value: "6,200,000" },
  { label: "Provident Fund", value: "2,850,000" },
  { label: "Health Ins.", value: "808,000" }
];

const INITIAL_PAYROLL_EMPLOYEES = [
  {
    id: "EMP-01",
    name: "Sarah J.",
    initials: "SJ",
    avatarBg: "bg-purple-100 text-[#7B6AE6]",
    dept: "Sales",
    grade: "L4",
    baseSalary: "285,000",
    allowances: "42,000",
    deductions: "12,000",
    tax: "22,800",
    netPay: "292,200",
    status: "Processing",
    selected: true
  },
  {
    id: "EMP-02",
    name: "Omar M.",
    initials: "OM",
    avatarBg: "bg-indigo-100 text-indigo-700",
    dept: "HR",
    grade: "L3",
    baseSalary: "190,000",
    allowances: "28,000",
    deductions: "8,000",
    tax: "15,200",
    netPay: "194,800",
    status: "Processing",
    selected: false
  },
  {
    id: "EMP-07",
    name: "Madiha R.",
    initials: "MR",
    avatarBg: "bg-red-100 text-red-700",
    dept: "IT",
    grade: "L5",
    baseSalary: "450,000",
    allowances: "65,000",
    deductions: "20,000",
    tax: "45,000",
    netPay: "450,000",
    status: "On hold",
    selected: false
  },
  {
    id: "EMP-08",
    name: "Bilal H.",
    initials: "BH",
    avatarBg: "bg-amber-100 text-amber-700",
    dept: "Ops",
    grade: "L2",
    baseSalary: "120,000",
    allowances: "15,000",
    deductions: "5,000",
    tax: "9,600",
    netPay: "120,400",
    status: "On hold",
    selected: false
  }
];

export default function PayrollDashboard() {
  const [activeTemplate, setActiveTemplate] = useState<'standard' | 'detailed'>('standard');
  const [employees, setEmployees] = useState(INITIAL_PAYROLL_EMPLOYEES);
  const [options, setOptions] = useState({
    email: true,
    pdf: true,
    whatsapp: false
  });

  const toggleOption = (key: 'email' | 'pdf' | 'whatsapp') => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = employees.every(emp => emp.selected);
    setEmployees(prev =>
      prev.map(emp => ({ ...emp, selected: !allSelected }))
    );
  };

  const toggleEmployee = (id: string) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === id ? { ...emp, selected: !emp.selected } : emp
      )
    );
  };

  const parseFormattedNumber = (val: string) => {
    return parseFloat(val.replace(/,/g, '')) || 0;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const selectedEmployees = employees.filter(emp => emp.selected);
  const pageTotals = {
    baseSalary: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.baseSalary), 0)),
    allowances: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.allowances), 0)),
    deductions: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.deductions), 0)),
    tax: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.tax), 0)),
    netPay: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.netPay), 0)),
  };

  return (
    <div className="bg-[#F8F9FC] min-h-screen text-[#1A1A1A] antialiased">
      <main className="max-w-[1360px] mx-auto p-5 space-y-4">
        
        {/* Module Header Title & Integrated Action Section */}
        <div className="pt-1">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-950 flex items-center gap-1.5">
                Payroll <span className="text-gray-300 font-light">•</span> May 2026
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">247 employees · PKR cycle</p>
            </div>
            
            <div className="flex flex-col items-end gap-3.5">
              <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-950 transition-colors bg-white border border-[#EBECEF] px-3 py-1.5 rounded-[6px] shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Period Selector</span>
              </button>
              
              <button className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm tracking-wide">
                <Play className="w-3 h-3 fill-current stroke-none" />
                Run payroll
              </button>
            </div>
          </div>
          <div className="h-[1px] bg-gray-200/60 w-full mt-3.5" />
        </div>

        {/* Linear Progress Stepper Component */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm relative">
          <div className="relative flex justify-between items-center max-w-[920px] mx-auto pt-1">
            <div className="absolute left-[30px] right-[30px] top-[14px] h-[3px] bg-gray-100 z-0" />
            <div className="absolute left-[30px] w-[45%] top-[14px] h-[3px] bg-[#10B981] z-0" />

            {payrollProgress.map((step, idx) => (
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
            System is currently processing calculations for <span className="font-semibold text-gray-700">247</span> active personnel records.
          </p>
        </section>

        {/* Aggregate KPI Financial Overview Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Total Gross Pay</span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">PKR 83,980,000</h2>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium mb-1.5 px-0.5">
                {totalGrossBreakdown.map((bar, i) => (
                  <span key={i}>{bar.label}</span>
                ))}
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full flex overflow-hidden">
                {totalGrossBreakdown.map((bar, i) => (
                  <div key={i} style={{ width: `${bar.percentage}%` }} className={`${bar.color} h-full`} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Total Deductions</span>
              <h2 className="text-2xl font-bold text-[#D97706] tracking-tight mt-0.5">PKR 9,858,000</h2>
            </div>
            <div className="space-y-1.5 mt-2">
              {dynamicDeductions.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-gray-100/70 pb-1 last:border-0 last:pb-0">
                  <span className="text-gray-400 font-normal">{item.label}</span>
                  <span className="font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Net Payroll</span>
              <h2 className="text-2xl font-bold text-[#10B981] tracking-tight">PKR 74,122,000</h2>
              <p className="text-[11px] text-gray-400 pt-0.5 font-normal">Net/Gross Ratio</p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="text-gray-100" strokeWidth="3" strokeDasharray="6,1.8" stroke="currentColor" fill="none" r="14" cx="18" cy="18" />
                <circle className="text-[#10B981]" strokeWidth="3" strokeDasharray="24,10" strokeLinecap="round" stroke="currentColor" fill="none" r="14" cx="18" cy="18" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800">88%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Auxiliary Banner Component */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-4 shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Employer Liability</span>
          <h2 className="text-xl font-bold text-red-700 mt-0.5">PKR 6,224,000</h2>
          <div className="flex items-center gap-1 text-gray-400 text-[11px] mt-1.5 font-normal">
            <Info className="w-3.5 h-3.5" />
            <span>Excludes pending EOBI updates</span>
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
            <button className="p-1.5 border border-[#E5E7EB] rounded-[6px] bg-white hover:bg-gray-50 text-gray-500 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5 text-gray-400" />
              Export
            </button>
            <button className="bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] px-3.5 py-1.5 rounded-[6px] text-xs font-semibold tracking-wide transition-colors">
              Approve & process
            </button>
          </div>
        </section>

        {/* Comprehensive Payroll Ledger Matrix View */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#EBECEF]">
            <h3 className="text-sm font-bold text-gray-900">Payroll run · May 2026</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">247 employees · PKR 74.12M net</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#EBECEF] text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={employees.length > 0 && employees.every(emp => emp.selected)}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1] cursor-pointer" 
                    />
                  </th>
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Dept</th>
                  <th className="p-4 font-bold">Grade</th>
                  <th className="p-4 font-bold text-right">Base Salary</th>
                  <th className="p-4 font-bold text-right">Allowances</th>
                  <th className="p-4 font-bold text-right">Deductions</th>
                  <th className="p-4 font-bold text-right">Tax</th>
                  <th className="p-4 font-bold text-right">Net Pay</th>
                  <th className="p-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                {employees.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-[#F8F9FC]/50 transition-colors ${emp.selected ? 'bg-indigo-50/40' : ''}`}>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={emp.selected} 
                        onChange={() => toggleEmployee(emp.id)}
                        className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1] cursor-pointer" 
                      />
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full ${emp.avatarBg} flex items-center justify-center font-bold text-[10px] flex-shrink-0`}>
                        {emp.initials}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block leading-tight">{emp.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">{emp.id}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-normal">{emp.dept}</td>
                    <td className="p-4 text-gray-400 font-normal">{emp.grade}</td>
                    <td className="p-4 text-right text-gray-700">PKR {emp.baseSalary}</td>
                    <td className="p-4 text-right text-gray-700">PKR {emp.allowances}</td>
                    <td className="p-4 text-right text-amber-600">PKR {emp.deductions}</td>
                    <td className="p-4 text-right text-amber-600">PKR {emp.tax}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">PKR {emp.netPay}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide inline-block
                        ${emp.status === 'Processing' ? 'bg-purple-50 text-[#6366F1]' : 'bg-red-50 text-red-500'}
                      `}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                
                <tr className="bg-[#F8F9FC]/60 font-bold border-t border-gray-200 text-gray-900">
                  <td className="p-4" />
                  <td colSpan={3} className="p-4 font-bold text-gray-900">Page Totals (Selected)</td>
                  <td className="p-4 text-right">PKR {pageTotals.baseSalary}</td>
                  <td className="p-4 text-right">PKR {pageTotals.allowances}</td>
                  <td className="p-4 text-right text-amber-600">PKR {pageTotals.deductions}</td>
                  <td className="p-4 text-right text-amber-600">PKR {pageTotals.tax}</td>
                  <td className="p-4 text-right text-emerald-600 text-sm font-extrabold">PKR {pageTotals.netPay}</td>
                  <td className="p-4" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Showing 1-12 of 247 employees</span>
            <div className="flex items-center gap-4 text-gray-600">
              <button className="p-1 hover:bg-gray-50 rounded opacity-40 cursor-not-allowed" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-800">Page 1 of 21</span>
              <button className="p-1 hover:bg-gray-50 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Configuration Segment Block: Automated Payslip Engine */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-gray-900">Payslip generation</h3>
            <span className="bg-[#EEEBFF] text-[#6366F1] text-[10px] font-bold px-2 py-0.5 rounded-full">
              247 payslips to generate
            </span>
          </div>

          <div className="h-[1px] bg-gray-100 w-full mb-4" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-gray-100 pb-5 mb-5">
            <div className="lg:col-span-4 space-y-3.5">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">Options</span>
              {([
                { id: 'email', label: 'Email payslips', active: options.email },
                { id: 'pdf', label: 'Generate PDF', active: options.pdf },
                { id: 'whatsapp', label: 'WhatsApp notification', active: options.whatsapp }
              ] as const).map((opt) => (
                <div key={opt.id} className="flex items-center justify-between max-w-xs">
                  <span className={`text-xs font-medium transition-colors duration-200 ${opt.active ? 'text-gray-700' : 'text-gray-500'}`}>
                    {opt.label}
                  </span>
                  <div 
                    onClick={() => toggleOption(opt.id)}
                    className={`w-8 h-4.5 rounded-full p-0.5 cursor-pointer flex items-center transition-all duration-200
                      ${opt.active ? 'bg-[#6366F1] justify-end' : 'bg-gray-200 justify-start'}
                    `}
                  >
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 lg:border-l lg:border-r lg:border-gray-150 lg:px-6">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block mb-3">Templates</span>
              <div className="flex items-center gap-3">
                
                <div 
                  onClick={() => setActiveTemplate('standard')}
                  className={`rounded-[8px] p-3 w-[130px] h-[85px] cursor-pointer flex flex-col justify-between transition-all duration-150
                    ${activeTemplate === 'standard' 
                      ? 'border-2 border-[#6366F1] bg-[#F5F4FF]' 
                      : 'border border-gray-200 bg-white opacity-60 hover:opacity-90'
                    }`}
                >
                  <span className={`text-[11px] font-bold block ${activeTemplate === 'standard' ? 'text-[#6366F1]' : 'text-gray-600'}`}>
                    Standard
                  </span>
                  <div className="space-y-1.5 mb-1">
                    <div className={`h-1 w-16 rounded-full ${activeTemplate === 'standard' ? 'bg-[#DCD8FF]' : 'bg-gray-300'}`} />
                    <div className={`h-1 w-24 rounded-full ${activeTemplate === 'standard' ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`} />
                    <div className={`h-1 w-10 rounded-full ${activeTemplate === 'standard' ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`} />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTemplate('detailed')}
                  className={`rounded-[8px] p-3 w-[130px] h-[85px] cursor-pointer flex flex-col justify-between transition-all duration-150
                    ${activeTemplate === 'detailed' 
                      ? 'border-2 border-[#6366F1] bg-[#F5F4FF]' 
                      : 'border border-gray-200 bg-white opacity-60 hover:opacity-90'
                    }`}
                >
                  <span className={`text-[11px] font-bold block ${activeTemplate === 'detailed' ? 'text-[#6366F1]' : 'text-gray-600'}`}>
                    Detailed
                  </span>
                  <div className="space-y-1.5 mb-1">
                    <div className={`h-1 w-20 rounded-full ${activeTemplate === 'detailed' ? 'bg-[#DCD8FF]' : 'bg-gray-300'}`} />
                    <div className={`h-1 w-20 rounded-full ${activeTemplate === 'detailed' ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`} />
                    <div className={`h-1 w-20 rounded-full ${activeTemplate === 'detailed' ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`} />
                  </div>
                </div>

              </div>
            </div>

            <div className="lg:col-span-4 flex items-center gap-6 justify-center lg:justify-start">
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle className="text-gray-100" strokeWidth="3" strokeDasharray="6,1.8" stroke="currentColor" fill="none" r="14" cx="18" cy="18" />
                  <circle className="text-[#6366F1]" strokeWidth="3" strokeDasharray="0,100" strokeLinecap="round" stroke="currentColor" fill="none" r="14" cx="18" cy="18" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-gray-900">0%</span>
                </div>
              </div>
              <div className="space-y-0.5 text-xs min-w-[160px]">
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block mb-1">Status</span>
                <div className="flex items-center justify-between"><span className="text-gray-500 font-normal">Data verified</span><span className="font-bold text-gray-900">243/247</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500 font-normal">On hold</span><span className="font-bold text-red-500">2</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500 font-normal">Pending</span><span className="font-bold text-amber-500">2</span></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-[4px] text-xs font-semibold tracking-wide transition-colors shadow-sm">
              Generate all payslips
            </button>
            <button className="bg-[#EEF0FF] hover:bg-indigo-100 text-[#6366F1] px-4 py-2 rounded-[4px] text-xs font-semibold tracking-wide transition-colors">
              Generate for verified only (243)
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}