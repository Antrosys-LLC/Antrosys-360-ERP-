'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Phone, Hash, Pencil, CheckCircle2, ChevronRight, ChevronDown, Download, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ============================================================================
// CENTRALIZED DATA STORES
// ============================================================================


const employeeHeaderData = {
  name: "Sara Javed",
  initials: "SJ",
  role: "Senior Engineer",
  department: "Engineering dept",
  sinceDate: "Jan 2022",
  status: "Active",
  type: "Full-time",
  location: "Islamabad · HQ",
  tenure: "3 yrs tenure",
  empId: "ID: EMP-00142",
  email: "sara.javed@antrosys.com",
  phone: "+92 300 1234567",
  handle: "@sara.eng",
  reportsTo: "Zara Khan",
  contractType: "Permanent",
  metrics: [
    { label: "Attendance", value: "94%", strokeColor: "#7B6AE6", percentage: 94 },
    { label: "Performance", value: "88%", strokeColor: "#10B981", percentage: 88 },
    { label: "KPI avg", value: "72%", strokeColor: "#F59E0B", percentage: 72 }
  ]
};

const personalInformation = {
  fields: [
    { label: "Full name", value: "Sara Javed Khan" },
    { label: "Preferred name", value: "Sara" },
    { label: "Date of birth", value: "14 Aug 1995" },
    { label: "Gender", value: "Female" },
    { label: "Nationality", value: "Pakistani" },
    { label: "CNIC", value: "61101-1234567-8" },
    { label: "Personal email", value: "sara.j.95@gmail.com" },
    { label: "Personal phone", value: "+92 321 7654321" }
  ],
  emergencyContact: "Javed Khan (Father) — +92 333 1112233",
  homeAddress: "House 42, Street 10, Sector F-8/4, Islamabad, Pakistan 44000"
};

const employmentSnapshot = [
  { label: "Employee ID", value: "EMP-00142", isLink: false },
  { label: "Department", value: "Engineering", isLink: false },
  { label: "Designation", value: "Senior Engineer", isLink: false },
  { label: "Grade", value: "L4", isLink: false },
  { label: "Line Manager", value: "Zara Khan", isLink: true },
  { label: "Join Date", value: "15 Jan 2022", isLink: false },
  { label: "Probation End", value: "15 Apr 2022", isLink: false, verified: true },
  { label: "Emp Type", value: "Permanent", isLink: false }
];

const skillsData = {
  tags: ["React", "TypeScript", "Node.js", "System Design", "AWS"],
  progress: [
    { skill: "React", percentage: 90 },
    { skill: "TypeScript", percentage: 80 },
    { skill: "System Design", percentage: 70 }
  ]
};

const officeAccessData = {
  details: [
    { label: "Location", value: "Islamabad HQ" },
    { label: "Shift", value: "General (09:00 - 18:00)" },
    { label: "Work Mode", value: "Hybrid" },
    { label: "System Access", value: "ESS (Standard)" },
    { label: "Last Login", value: "Today, 08:45 AM" }
  ],
  activeModules: ["ESS", "Attendance", "Leave", "Payslips", "Documents"]
};

const attendanceCalendarWeeks = [
  [null, null, null, null, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'L', label: 'Late' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'A', label: 'Absent' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'H', label: 'Half-day' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'L', label: 'Late' }, { status: 'L', label: 'Late' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }]
];

const attendanceLogsTable = [
  { date: "01 May 2026", day: "Fri", checkIn: "08:55 AM", checkOut: "05:00 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "04 May 2026", day: "Mon", checkIn: "08:50 AM", checkOut: "06:30 PM", total: "9.6 hrs", ot: "1.6 hrs", otColor: "text-[#7B6AE6]", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "05 May 2026", day: "Tue", checkIn: "08:58 AM", checkOut: "05:05 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "06 May 2026", day: "Wed", checkIn: "09:00 AM", checkOut: "05:00 PM", total: "8.0 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "07 May 2026", day: "Thu", checkIn: "09:35 AM", checkOut: "06:00 PM", total: "8.4 hrs", ot: "-", status: "Late", textColor: "text-amber-600", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { date: "08 May 2026", day: "Fri", checkIn: "08:50 AM", checkOut: "05:15 PM", total: "8.4 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "11 May 2026", day: "Mon", checkIn: "08:55 AM", checkOut: "05:45 PM", total: "8.8 hrs", ot: "0.8 hrs", otColor: "text-[#7B6AE6]", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "12 May 2026", day: "Tue", checkIn: "08:50 AM", checkOut: "05:00 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "13 May 2026", day: "Wed", checkIn: "-", checkOut: "-", total: "0 hrs", ot: "-", status: "Absent", color: "bg-rose-50 text-rose-500 border-rose-100" },
  { date: "14 May 2026", day: "Thu", checkIn: "08:55 AM", checkOut: "05:05 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" }
];

const payslipsData = [
  { month: "May 2026", gross: "PKR 350,000", deductions: "PKR 15,000", tax: "PKR 25,000", net: "PKR 310,000", status: "Processing", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { month: "Apr 2026", gross: "PKR 350,000", deductions: "PKR 15,000", tax: "PKR 25,000", net: "PKR 310,000", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { month: "Mar 2026", gross: "PKR 350,000", deductions: "PKR 15,000", tax: "PKR 25,000", net: "PKR 310,000", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { month: "Feb 2026", gross: "PKR 350,000", deductions: "PKR 15,000", tax: "PKR 25,000", net: "PKR 310,000", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { month: "Jan 2026", gross: "PKR 350,000", deductions: "PKR 15,000", tax: "PKR 25,000", net: "PKR 310,000", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { month: "Dec 2025", gross: "PKR 310,000", deductions: "PKR 12,000", tax: "PKR 20,000", net: "PKR 278,000", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function EmployeeDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState("Personal");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const navigationTabs = [
    { name: "Personal" },
    { name: "Employment" },
    { name: "Documents" },
    { name: "Assets" },
    { name: "Payslips" },
    { name: "Performance" },
    { name: "Leave history" },
    { name: "Attendance logs" }
  ];

  return (
    <div className="bg-[#f8f9fa] text-foreground min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">

        {/* ==========================================
            COMPONENT 0: BREADCRUMB & ACTIONS PANEL
           ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 mb-6">
          <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <Link href="/hr/employees" className="text-muted-foreground hover:text-foreground cursor-pointer">Employees</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <Link href="/hr/employees?department=Engineering" className="text-muted-foreground hover:text-foreground cursor-pointer">Engineering</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-foreground font-bold">Sara Javed</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm">
              Edit profile
            </button>
            <button className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm">
              Generate HR letter
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7B6AE6] hover:bg-[#6959cf] rounded-[var(--radius)] transition-colors shadow-sm">
              Actions <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* ==========================================
            COMPONENT 1: HERO PROFILE BANNER
           ========================================== */}
        <header className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#7B6AE6]/10 text-[#7B6AE6] font-bold text-2xl flex items-center justify-center border border-[#7B6AE6]/10">
                    {employeeHeaderData.initials}
                  </div>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Since {employeeHeaderData.sinceDate}</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{employeeHeaderData.name}</h1>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {employeeHeaderData.role} <span className="text-border mx-1">•</span> {employeeHeaderData.department}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {employeeHeaderData.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.type}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.location}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.tenure}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium tracking-wide text-muted-foreground">{employeeHeaderData.empId}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.email}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.phone}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Hash className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.handle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 border-t xl:border-t-0 pt-4 xl:pt-0 border-border">
              <div className="border-l border-border pl-6 pr-4 hidden sm:block">
                <table className="text-xs font-medium border-separate border-spacing-y-1.5">
                  <tbody>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Reports to:</td>
                      <td className="text-[#7B6AE6] hover:underline cursor-pointer font-bold">{employeeHeaderData.reportsTo}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Department:</td>
                      <td className="text-foreground font-semibold">Engineering</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Location:</td>
                      <td className="text-foreground font-semibold">Islamabad HQ</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Contract:</td>
                      <td className="text-foreground font-semibold">Permanent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-l border-border pl-6 flex items-center gap-6 justify-between w-full sm:w-auto">
                {employeeHeaderData.metrics.map((metric, idx) => {
                  const radius = 16;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (metric.percentage / 100) * circumference;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center gap-1">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle className="text-muted/40" strokeWidth="2.5" stroke="currentColor" fill="none" cx="18" cy="18" r={radius} />
                          <circle 
                            strokeWidth="2.5" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500" 
                            stroke={metric.strokeColor} 
                            strokeLinecap="round" 
fill="none" 
                            cx="18" 
                            cy="18" 
                            r={radius} 
                          />
                        </svg>
                        <span className="text-xs font-bold text-foreground z-10">{metric.value}</span>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground tracking-tight whitespace-nowrap">{metric.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </header>

        {/* =========================================================================
            COMPONENT 2: NAVIGATION TAB BAR
           ========================================================================= */}
        <div className="bg-white border border-border rounded-[var(--radius)] px-5 py-2.5 shadow-sm mb-6">
          <nav className="flex items-center gap-10 overflow-x-auto no-scrollbar bg-transparent">
            {navigationTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.name)}
                className={`pb-1 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 tracking-tight ${
                  activeTab === tab.name
                    ? "border-[#7B6AE6] text-[#7B6AE6]" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* ==========================================
            COMPONENT 3: DATA PANELS CONTAINER
           ========================================== */}

        {/* EMPLOYMENT STUB */}
        {activeTab === "Employment" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Hash className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Employment details</h2>
            <p className="text-sm text-muted-foreground max-w-md">Job history, promotions, contract details, and organizational changes will appear here.</p>
          </div>
        )}

        {/* DOCUMENTS STUB */}
        {activeTab === "Documents" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Documents</h2>
            <p className="text-sm text-muted-foreground max-w-md">Uploaded documents, certificates, ID copies, and signed agreements will appear here.</p>
          </div>
        )}

        {/* ASSETS STUB */}
        {activeTab === "Assets" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Assigned assets</h2>
            <p className="text-sm text-muted-foreground max-w-md">Laptops, access cards, equipment, and other assigned company assets will appear here.</p>
          </div>
        )}

        {/* PAYSLIPS VIEW */}
        {activeTab === "Payslips" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm flex flex-col">
            
            {/* Header Block */}
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Payslips · 2026</h2>
              <div className="relative">
                <select className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer">
                  <option>2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-t border-b border-border text-muted-foreground font-semibold bg-white">
                    <th className="px-6 py-3 font-semibold text-left">Month</th>
                    <th className="px-6 py-3 font-semibold text-right">Gross</th>
                    <th className="px-6 py-3 font-semibold text-right">Deductions</th>
                    <th className="px-6 py-3 font-semibold text-right">Tax</th>
                    <th className="px-6 py-3 font-semibold text-right">Net pay</th>
                    <th className="px-6 py-3 font-semibold text-left">Status</th>
                    <th className="px-6 py-3 font-semibold text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslipsData.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0 border-border bg-white hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.month}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.gross}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.deductions}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.tax}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-foreground">{row.net}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <button className="inline-flex items-center gap-1.5 text-[#7B6AE6] hover:underline font-bold text-xs">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer YTD Summary Capsules */}
            <div className="p-6 pt-4 pb-6 flex flex-wrap gap-2.5">
              <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                YTD gross: PKR 1.66M
              </div>
              <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                YTD deductions: PKR 186K
              </div>
              <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                YTD net: PKR 1.39M
              </div>
            </div>

          </div>
        )}

        {/* PERFORMANCE STUB */}
        {activeTab === "Performance" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Pencil className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Performance reviews</h2>
            <p className="text-sm text-muted-foreground max-w-md">KPI scores, review cycles, manager feedback, and goal tracking will appear here.</p>
          </div>
        )}

        {/* LEAVE HISTORY STUB */}
        {activeTab === "Leave history" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Leave history</h2>
            <p className="text-sm text-muted-foreground max-w-md">Leave balances, approved requests, and absence records will appear here.</p>
          </div>
        )}

        {/* ATTENDANCE LOGS VIEW */}
        {activeTab === "Attendance logs" && (
          
          /* ==================================================================================
             ATTENDANCE VIEW BLOCK 
             ================================================================================== */
          <div className="space-y-6">
            
            {/* Main Log Sheet Card Box Component Container */}
            <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm flex flex-col">
              
              {/* Top Heading Actions Header Block */}
              <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Attendance logs · May 2026</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer">
                      <option>May 2026</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[var(--radius)] text-xs font-bold bg-white hover:bg-muted/50 transition-colors text-foreground shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* Calendar View subdivision box */}
              <div className="px-6 pb-6">
                <div className="border border-border rounded-[var(--radius)] p-4 bg-white shadow-none">
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[700px] space-y-2">
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground pb-1">
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                      </div>
                      
                      {attendanceCalendarWeeks.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-cols-7 gap-2">
                          {week.map((day, dIdx) => {
                            if (!day) return <div key={dIdx} className="h-10"></div>;
                            
                            let baseColor = "bg-muted/40 text-muted-foreground";
                            if (day.status === 'P') baseColor = "bg-[#7B6AE6]/10 text-[#7B6AE6]";
                            if (day.status === 'L') baseColor = "bg-amber-100/70 text-amber-800";
                            if (day.status === 'A') baseColor = "bg-rose-100/60 text-rose-700";
                            if (day.status === 'H') baseColor = "bg-emerald-100/70 text-emerald-800";
                            if (day.status === 'HO') baseColor = "bg-blue-50 text-blue-500";

                            return (
                              <div 
                                key={dIdx} 
                                className={`h-10 rounded-[var(--radius)] flex items-center justify-center text-xs font-bold ${baseColor}`}
                                title={day.label}
                              >
                                {day.status}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid Label Legend */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 mt-3 border-t border-border text-[11px] font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#7B6AE6]/10 inline-block"></span>Present 12</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100/70 inline-block"></span>Late 1</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-100/60 inline-block"></span>Absent 1</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100/70 inline-block"></span>Leaves 2</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-50 inline-block"></span>Holidays 1</div>
                  </div>
                </div>
              </div>

              {/* List Table subdivision box */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-t border-b border-border text-muted-foreground font-bold bg-white">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Day</th>
                      <th className="px-6 py-3 font-semibold">Check-in</th>
                      <th className="px-6 py-3 font-semibold">Check-out</th>
                      <th className="px-6 py-3 font-semibold">Total hrs</th>
                      <th className="px-6 py-3 font-semibold">OT</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogsTable.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-border bg-white hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-foreground">{row.date}</td>
                        <td className="px-6 py-3.5 font-medium text-muted-foreground">{row.day}</td>
                        <td className={`px-6 py-3.5 font-semibold ${row.textColor || 'text-foreground'}`}>{row.checkIn}</td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">{row.checkOut}</td>
                        <td className="px-6 py-3.5 font-bold text-foreground">{row.total}</td>
                        <td className={`px-6 py-3.5 font-bold ${row.otColor || 'text-muted-foreground'}`}>{row.ot}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* ================================================================
                SEPARATED INDEPENDENT MONTHLY SUMMARY CARD
               ================================================================ */}
            <div className="bg-white border border-border rounded-[var(--radius)] px-6 py-4 flex flex-row justify-between items-center text-xs font-bold shadow-sm">
              <span className="text-muted-foreground font-medium">
                Monthly summary: <span className="text-foreground font-bold">156.4 hrs</span> · <span className="text-foreground font-bold">2.4 hrs OT</span> · <span className="text-foreground font-bold">94% attendance</span>
              </span>
              <button className="text-[#7B6AE6] hover:underline transition-all">
                View full log
              </button>
            </div>

          </div>
        )}

        {/* PERSONAL VIEW */}
        {activeTab === "Personal" && (
          
          /* =========================================================
             STANDARD DEFAULT PERSONAL INFO VIEW BLOCK
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Personal information</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                  {personalInformation.fields.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground tracking-tight">{field.label}</span>
                      <span className="block text-sm text-foreground font-semibold">{field.value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-muted-foreground tracking-tight">Emergency contact</span>
                    <span className="block text-sm text-foreground font-semibold">{personalInformation.emergencyContact}</span>
                  </div>
                  
                  <div className="border-t border-border pt-4 space-y-1">
                    <span className="block text-xs font-medium text-muted-foreground tracking-tight">Home address</span>
                    <span className="block text-sm text-foreground font-semibold leading-relaxed">{personalInformation.homeAddress}</span>
                  </div>
                </div>
              </section>

              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Skills & expertise</h2>
                  <button className="text-muted-foreground/70 hover:text-foreground p-1 transition-colors border border-border rounded bg-muted/20" aria-label="Modify Matrix">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {skillsData.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted/40 border border-border rounded-[var(--radius)] text-xs font-semibold text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  {skillsData.progress.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold tracking-tight">
                        <span className="text-foreground">{item.skill}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full">
                        <div 
                          className="h-full bg-[#7B6AE6] rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-transparent">
                      <th colSpan={2} className="px-6 py-4 text-base font-bold text-foreground tracking-tight">
                        Employment snapshot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employmentSnapshot.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-border bg-transparent hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-muted-foreground w-[40%] tracking-tight">{row.label}</td>
                        <td className="px-6 py-3.5 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className={row.isLink ? "text-[#7B6AE6] cursor-pointer hover:underline" : ""}>
                              {row.value}
                            </span>
                            {row.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Office & access</h2>
                
                <div className="space-y-3.5">
                  {officeAccessData.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 border-dashed border-border/70">
                      <span className="font-medium text-muted-foreground tracking-tight">{detail.label}</span>
                      <span className="font-bold text-foreground tracking-tight">{detail.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-bold text-muted-foreground tracking-tight">Active Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {officeAccessData.activeModules.map((mod, idx) => (
                      <span 
                        key={idx} 
                        className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wider ${
                          mod === "ESS" 
                            ? "bg-[#7B6AE6]/10 text-[#7B6AE6] border-[#7B6AE6]/20" 
                            : "bg-muted/40 text-muted-foreground border-border"
                        }`}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

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