import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Hash, Pencil, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';

// ============================================================================
// CENTRALIZED DUMB MOCK DATA (Ready for clean API substitution)
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

const navigationTabs = [
  { name: "Personal", current: true },
  { name: "Employment", current: false },
  { name: "Documents", current: false },
  { name: "Assets", current: false },
  { name: "Payslips", current: false },
  { name: "Performance", current: false },
  { name: "Leave history", current: false },
  { name: "Attendance logs", current: false }
];

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

// ============================================================================
// MAIN FILE EXPORT
// ============================================================================

export default function EmployeeDashboardPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Tightened top padding to eliminate structural whitespace gap */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-6 pt-2 space-y-6">

        {/* ==========================================
            COMPONENT 0: BREADCRUMB & ACTIONS PANEL
           ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <Link href={`/hr/employees?role=${encodeURIComponent(employeeHeaderData.role)}`} className="text-muted-foreground hover:text-foreground cursor-pointer">Employees</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">Engineering</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-foreground font-bold">Sara Javed</span>
          </div>

          {/* Action Callouts */}
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
        <header className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* Left Hand: Identity Profile Information */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#7B6AE6]/10 text-[#7B6AE6] font-bold text-2xl flex items-center justify-center border border-[#7B6AE6]/10">
                    {employeeHeaderData.initials}
                  </div>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>
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
                
                {/* Meta System Pills */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {employeeHeaderData.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.type}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.location}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.tenure}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium tracking-wide text-muted-foreground">{employeeHeaderData.empId}</span>
                </div>

                {/* Communication Access Nodes */}
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

            {/* Right Hand: Context Segment Columns with Explicit Dividers */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 border-t xl:border-t-0 pt-4 xl:pt-0 border-border">
              
              {/* Vertical Border 1: Assignment Column */}
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

              {/* Vertical Border 2: Ring Visual Statistics Wrapper */}
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

        {/* ==========================================
            COMPONENT 2: TABS SUB-NAVIGATION BAR
           ========================================== */}
        <nav className="border-b border-border flex items-center gap-6 overflow-x-auto no-scrollbar">
          {navigationTabs.map((tab, idx) => (
            <button
              key={idx}
              className={`pb-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 tracking-tight ${
                tab.current 
                  ? "border-[#7B6AE6] text-[#7B6AE6]" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>

        {/* ==========================================
            COMPONENT 3: DATA SUB-GRID PANELS
           ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Block Space (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Box 1: Personal Profile Info Card */}
            <section className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Personal information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                {personalInformation.fields.map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="block text-xs font-medium text-muted-foreground tracking-tight">{field.label}</span>
                    <span className="block text-sm text-foreground font-semibold">{field.value}</span>
                  </div>
                ))}
              </div>

              {/* Explicit Separator before Emergency Contact */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground tracking-tight">Emergency contact</span>
                  <span className="block text-sm text-foreground font-semibold">{personalInformation.emergencyContact}</span>
                </div>
                
                {/* Explicit Separator between Emergency Contact and Home Address */}
                <div className="border-t border-border pt-4 space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground tracking-tight">Home address</span>
                  <span className="block text-sm text-foreground font-semibold leading-relaxed">{personalInformation.homeAddress}</span>
                </div>
              </div>
            </section>

            {/* Box 2: Skills and Expertise Capability Metric Map */}
            <section className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Skills & expertise</h2>
                <button className="text-muted-foreground/70 hover:text-foreground p-1 transition-colors border border-border rounded bg-muted/20" aria-label="Modify Matrix">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Pill Tag Lists */}
              <div className="flex flex-wrap gap-1.5">
                {skillsData.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-muted/40 border border-border rounded-[var(--radius)] text-xs font-semibold text-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Graphical Linear Loading Bars */}
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

          {/* Right Block Space (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Box 3: Seamless Integrated Employment Snapshot Table */}
            <section className="bg-card text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
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
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50 dark:fill-transparent" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Box 4: Office Access Permissions Node */}
            <section className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Office & access</h2>
              
              <div className="space-y-3.5">
                {officeAccessData.details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 border-dashed border-border/70">
                    <span className="font-medium text-muted-foreground tracking-tight">{detail.label}</span>
                    <span className="font-bold text-foreground tracking-tight">{detail.value}</span>
                  </div>
                ))}
              </div>

              {/* Active Modules Block */}
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

      </div>
    </div>
  );
}