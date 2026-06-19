import React from 'react';

// ==========================================
// MOCK DATA CONFIGURATIONS (ERP DATA ARRAYS)
// ==========================================

interface LeaveBalance {
  id: string;
  label: string;
  value: string;
  subtext: string;
  progressClass: string;
  iconType: 'tree' | 'heart' | 'coffee' | 'home' | 'plug';
}

const LEAVE_BALANCES: LeaveBalance[] = [
  { id: 'annual', label: 'ANNUAL LEAVE', value: '12', subtext: 'days left', progressClass: 'bg-primary w-[60%]', iconType: 'tree' },
  { id: 'sick', label: 'SICK LEAVE', value: '8', subtext: 'days left', progressClass: 'bg-destructive w-[45%]', iconType: 'heart' },
  { id: 'casual', label: 'CASUAL LEAVE', value: '3', subtext: 'days left', progressClass: 'bg-[#4CAF50] w-[25%]', iconType: 'coffee' },
  { id: 'wfh', label: 'WORK FROM HOME', value: '14', subtext: 'days left', progressClass: 'bg-[#5CACF6] w-[70%]', iconType: 'home' },
  { id: 'unpaid', label: 'UNPAID LEAVE', value: '0', subtext: 'taken', progressClass: 'bg-muted-foreground w-0', iconType: 'plug' },
];

interface TimelineDay {
  dayNum: number;
  status: 'normal' | 'selected' | 'range';
}

// Dynamically generate 31 days for May
const TIMELINE_DAYS: TimelineDay[] = Array.from({ length: 31 }, (_, i) => {
  const dayNum = i + 1;
  let status: 'normal' | 'selected' | 'range' = 'normal';
  if (dayNum === 16) status = 'selected';
  else if (dayNum >= 22 && dayNum <= 24) status = 'range';
  return { dayNum, status };
});

interface LeaveTypeOption {
  id: string;
  label: string;
  isSelected: boolean;
  iconType: 'tree' | 'heart' | 'coffee' | 'home';
}

const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  { id: 'annual', label: 'Annual', isSelected: true, iconType: 'tree' },
  { id: 'sick', label: 'Sick', isSelected: false, iconType: 'heart' },
  { id: 'casual', label: 'Casual', isSelected: false, iconType: 'coffee' },
  { id: 'wfh', label: 'WFH', isSelected: false, iconType: 'home' },
];

interface CalendarDay {
  dayNum: number | null;
  state?: 'normal' | 'muted-range' | 'today' | 'selected-start' | 'selected-mid' | 'selected-end';
}

// May 2024 starts on Wednesday (offset 3 blank slots)
const CALENDAR_DAYS: CalendarDay[] = [
  { dayNum: null }, { dayNum: null }, { dayNum: null },
  { dayNum: 1 }, { dayNum: 2 }, { dayNum: 3 }, { dayNum: 4 }, { dayNum: 5 },
  { dayNum: 6 }, { dayNum: 7 }, { dayNum: 8 }, 
  { dayNum: 9, state: 'muted-range' }, { dayNum: 10, state: 'muted-range' }, 
  { dayNum: 11 }, { dayNum: 12 }, { dayNum: 13 }, { dayNum: 14 }, { dayNum: 15 },
  { dayNum: 16, state: 'today' }, { dayNum: 17 }, { dayNum: 18 }, { dayNum: 19 },
  { dayNum: 20 }, { dayNum: 21 }, 
  { dayNum: 22, state: 'selected-start' }, { dayNum: 23, state: 'selected-mid' }, { dayNum: 24, state: 'selected-end' }, 
  { dayNum: 25 }, { dayNum: 26 }, { dayNum: 27 }, { dayNum: 28 }, { dayNum: 29 }, 
  { dayNum: 30 }, { dayNum: 31 }
];

interface PendingRequest {
  id: string;
  type: string;
  duration: string;
  status: string;
}

const MY_PENDING_REQUESTS: PendingRequest[] = [
  { id: '1', type: 'Annual Leave', duration: 'May 22 - May 24 (3 days)', status: 'PENDING' },
  { id: '2', type: 'WFH', duration: 'May 17 (1 day)', status: 'PENDING' }
];

interface ManagerApproval {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  type: string;
  duration: string;
  warningText?: string;
  attachment?: string;
}

const MANAGER_APPROVALS: ManagerApproval[] = [
  {
    id: 'app-1',
    name: 'Sara Javed',
    initials: 'SJ',
    avatarBg: 'bg-[#EAE8FC] text-primary',
    type: 'Annual Leave',
    duration: 'May 22-24 (3 days)',
    warningText: 'Team overlap detected'
  },
  {
    id: 'app-2',
    name: 'Fawad Khan',
    initials: 'FK',
    avatarBg: 'bg-[#E8F5E9] text-[#2E7D32]',
    type: 'Sick Leave',
    duration: 'May 14-15 (2 days)',
    attachment: 'medical_cert.pdf'
  }
];

interface ScheduleMetric {
  value: string;
  label: string;
  colorClass?: string;
}

const SCHEDULE_METRICS: ScheduleMetric[] = [
  { value: '5', label: 'Pending' },
  { value: '12', label: 'Total Taken' },
  { value: '94%', label: 'Attendance', colorClass: 'text-[#4CAF50]' },
  { value: '2', label: 'On Leave Today' }
];

// ==========================================
// UTILITY SVG ICON COMPONENTS
// ==========================================

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

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================

export default function LeaveManagementDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans flex flex-col">
      
      {/* GLOBAL HEADER BAR 
        Changed from fixed positioning to standard document flow / sticky 
        to prevent overlapping with external sidebars.
      */}
      <header className="sticky top-0 w-full h-[var(--topbar-height)] bg-card border-b border-border flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">ERP Core</span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="relative hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-64 h-9 pl-9 pr-4 bg-muted/50 border border-border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          
          <button className="text-muted-foreground hover:text-foreground relative transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer shadow-sm">
            U
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTAINER MAIN STRUCTURE */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-8 space-y-6">
        
        {/* TOP ROW: SUMMARY BALANCE KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {LEAVE_BALANCES.map((balance) => (
            <article key={balance.id} className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground block">{balance.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold">{balance.value}</span>
                    <span className="text-xs text-muted-foreground">{balance.subtext}</span>
                  </div>
                </div>
                <div className={`p-1.5 rounded text-muted-foreground`}>
                  <RenderIcon type={balance.iconType} className="w-5 h-5 opacity-70" />
                </div>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full mt-5 overflow-hidden">
                <div className={`h-full rounded-full ${balance.progressClass}`}></div>
              </div>
            </article>
          ))}
        </section>

        {/* TIMELINE TRACKER MINI CALENDAR */}
        <section className="bg-card border border-border rounded-[var(--radius)] py-3 px-4 shadow-sm w-full overflow-hidden">
          <div className="flex items-center overflow-x-auto pb-1 custom-scrollbar">
            <div className="text-sm font-medium px-4 text-muted-foreground border-r border-border mr-3 sticky left-0 bg-card z-10">
              May
            </div>
            <div className="flex items-center gap-1.5 min-w-max pr-4">
              {TIMELINE_DAYS.map((day) => {
                let cellStyle = "text-muted-foreground bg-[#F8F9FB] hover:bg-muted";
                if (day.status === 'selected') {
                  cellStyle = "bg-primary text-primary-foreground font-medium shadow-sm ring-1 ring-primary ring-offset-1";
                } else if (day.status === 'range') {
                  cellStyle = "bg-[#EAE8FC] text-primary font-medium";
                }
                return (
                  <div 
                    key={day.dayNum} 
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer transition-colors ${cellStyle}`}
                  >
                    {day.dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TWO-COLUMN GRID: CONTENT INTERFACE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: REQUEST SYSTEM & PERSONAL SUBMISSIONS (6 SPAN) */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* COMPONENT: REQUEST LEAVE FORM BLOCK */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Employee: Request Leave</h2>
              
              <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-6">
                
                {/* SELECT LEAVE TYPE GRID */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Leave Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {LEAVE_TYPE_OPTIONS.map((option) => (
                      <div 
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-[var(--radius)] border cursor-pointer transition-all ${
                          option.isSelected 
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20' 
                            : 'border-border bg-card text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-sm font-medium">
                          <RenderIcon type={option.iconType} className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                        {option.isSelected && (
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* MINI MONTH CALENDAR SELECTOR */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Select Dates (May 2024)</label>
                  <div className="border border-border rounded-[var(--radius)] p-5 bg-card">
                    
                    {/* CALENDAR DAYS HEADER */}
                    <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-muted-foreground mb-3">
                      <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                    </div>
                    
                    {/* CALENDAR MONTH GRID */}
                    <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
                      {CALENDAR_DAYS.map((day, index) => {
                        if (day.dayNum === null) {
                          return <div key={`empty-${index}`} />;
                        }

                        let itemClass = "text-foreground hover:bg-muted rounded-full";
                        
                        if (day.state === 'muted-range') {
                          itemClass = "bg-muted text-muted-foreground font-medium rounded-sm";
                        } else if (day.state === 'today') {
                          itemClass = "border border-primary font-bold text-foreground rounded-full";
                        } else if (day.state === 'selected-start' || day.state === 'selected-mid' || day.state === 'selected-end') {
                          itemClass = "bg-primary text-primary-foreground font-medium rounded-full";
                        }

                        return (
                          <div key={`day-${day.dayNum}`} className="py-0.5 flex items-center justify-center">
                            <span className={`w-8 h-8 flex items-center justify-center cursor-pointer text-sm transition-colors ${itemClass}`}>
                              {day.dayNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* CONFLICT NOTIFICATION BANNER */}
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

                {/* FORM SUBMIT ACTION */}
                <button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm py-3 rounded-[var(--radius)] transition-opacity flex items-center justify-center gap-2 shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" transform="rotate(180 12 12)" />
                  </svg>
                  <span>Submit request</span>
                </button>
              </div>
            </div>

            {/* COMPONENT: PENDING REQUEST TRACKER LIST */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Pending Requests</h3>
              <div className="space-y-3">
                {MY_PENDING_REQUESTS.map((req) => (
                  <article key={req.id} className="bg-card border border-border rounded-[var(--radius)] p-4 flex items-center justify-between shadow-sm border-l-4 border-l-[#FFC107]">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{req.type}</h4>
                      <p className="text-xs text-muted-foreground">{req.duration}</p>
                    </div>
                    <span className="bg-[#FFFDF5] text-[#FFC107] border border-[#FFE082] text-[10px] font-bold px-2 py-1 rounded">
                      {req.status}
                    </span>
                  </article>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: TEAM OPERATIONS & MANAGEMENT CONTEXT (6 SPAN) */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* COMPONENT: MANAGER APPROVAL CONTROL HUB */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Manager: Approvals</h2>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                  5 Pending
                </span>
              </div>

              <div className="space-y-4">
                {MANAGER_APPROVALS.map((approval) => (
                  <article key={approval.id} className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm space-y-4">
                    
                    {/* USER APPLICANT PROFILE DETAILS */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${approval.avatarBg}`}>
                        {approval.initials}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-foreground leading-none">{approval.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {approval.type} <span className="mx-1">•</span> {approval.duration}
                        </p>
                      </div>
                    </div>

                    {/* CONDITIONAL SYSTEM CONTEXTUAL LABELS */}
                    {approval.warningText && (
                      <div className="inline-flex items-center gap-1.5 bg-[#FFFDF5] text-[#F57F17] text-xs font-medium px-2.5 py-1.5 rounded border border-[#FFE082]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{approval.warningText}</span>
                      </div>
                    )}

                    {approval.attachment && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F6FDF7] text-[#2E7D32] text-xs font-medium px-2.5 py-1.5 rounded border border-[#C8E6C9] cursor-pointer hover:bg-[#E8F5E9] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{approval.attachment}</span>
                      </div>
                    )}

                    {/* DECISION ACTION INTERFACE */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button className="bg-[#FEECEB] hover:bg-[#FDD8D8] text-destructive text-sm font-medium py-2.5 rounded-[var(--radius)] transition-colors text-center">
                        Decline
                      </button>
                      <button className="bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium py-2.5 rounded-[var(--radius)] transition-opacity text-center shadow-sm">
                        Approve
                      </button>
                    </div>

                  </article>
                ))}
              </div>
            </div>

            {/* COMPONENT: LIVE TEAM SCHEDULE & CAPACITY ANALYTICS VISUALIZER */}
            <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-foreground">Team Schedule (May)</h3>
              
              {/* SIMULATED GANTT METRIC SYSTEM GRAPH */}
              <div className="relative h-24 bg-[#F8F9FB] border border-border rounded-[var(--radius)] overflow-hidden">
                
                {/* GRAPH PLOTTED BAR TRACKS */}
                <div className="absolute top-3 left-[25%] w-[12%] h-2.5 bg-[#4CAF50] rounded-full"></div>
                <div className="absolute top-10 left-[10%] w-[6%] h-2.5 bg-destructive rounded-full"></div>
                
                {/* CURRENT TIME "TODAY" VERTICAL DATA MARKER */}
                <div className="absolute left-[60%] inset-y-0 w-[1px] bg-primary flex flex-col items-center z-10">
                  <span className="absolute -top-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-sm font-medium transform -translate-y-1/2">
                    Today
                  </span>
                </div>

                <div className="absolute top-16 left-[53%] w-[12%] h-2.5 bg-primary/40 rounded-full"></div>
                <div className="absolute top-10 left-[70%] w-[20%] h-2.5 bg-[#5CACF6] rounded-full"></div>
              </div>

              {/* OVERVIEW SYSTEM AGGREGATION FOOTER METRICS */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border text-left">
                {SCHEDULE_METRICS.map((metric, i) => (
                  <div key={i} className="space-y-1">
                    <div className={`text-sm font-bold text-foreground ${metric.colorClass || ''}`}>
                      {metric.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* Helper style for hiding scrollbar visually but keeping functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}