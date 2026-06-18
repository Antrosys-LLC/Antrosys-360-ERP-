import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  MoreHorizontal, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  ChevronDown
} from 'lucide-react';

// ============================================================================
// MOCK DATA STRUCTURES (Easily replaceable with React Query / API fetches)
// ============================================================================

const mockMetrics = [
  {
    id: 'total-revenue',
    title: 'Total Revenue',
    subtitle: 'Total revenue still this month',
    value: '$4.2M',
    change: '+12%',
    isPositive: true,
  },
  {
    id: 'payroll-cost',
    title: 'Payroll Cost',
    subtitle: 'Total payroll cost this month',
    value: '$845K',
    change: '-4%',
    isPositive: false,
  },
  {
    id: 'outstanding-invoices',
    title: 'Outstanding Invoices',
    subtitle: 'Total unpaid still this month',
    value: '$420K',
    change: '+15%',
    isPositive: true,
  },
  {
    id: 'tax-liability',
    title: 'Tax Liability',
    subtitle: 'Estimated tax this period',
    value: '$185K',
    change: '+3.2%',
    isPositive: true,
  },
];

const mockCashflowData = {
  percentage: '+124%',
  months: [
    {
      name: 'August',
      days: [
        { label: 'Mon', activeDots: 1 },
        { label: 'Tue', activeDots: 5 },
        { label: 'Wed', activeDots: 2 },
        { label: 'Thu', activeDots: 1 },
        { label: 'Fri', activeDots: 3 },
        { label: 'Sat', activeDots: 4 },
        { label: 'Sun', activeDots: 1 },
      ]
    },
    {
      name: 'September',
      days: [
        { label: 'Mon', activeDots: 3 },
        { label: 'Tue', activeDots: 4 },
        { label: 'Wed', activeDots: 3 },
        { label: 'Thu', activeDots: 5 },
        { label: 'Fri', activeDots: 4 },
        { label: 'Sat', activeDots: 1 },
        { label: 'Sun', activeDots: 2 },
      ]
    },
    {
      name: 'October',
      days: [
        { label: 'Mon', activeDots: 2 },
        { label: 'Tue', activeDots: 1 },
        { label: 'Wed', activeDots: 4 },
        { label: 'Thu', activeDots: 3 },
        { label: 'Fri', activeDots: 3 },
        { label: 'Sat', activeDots: 2 },
        { label: 'Sun', activeDots: 4 },
      ]
    }
  ]
};

const mockInvoiceStatus = {
  total: 424,
  segments: [
    { label: 'Paid', count: 258, left: 450, color: 'bg-[#735BF2]' },
    { label: 'Pending', count: 89, left: 258, color: 'bg-amber-500' },
    { label: 'Overdue', count: 43, left: 258, color: 'bg-rose-500' },
    { label: 'Draft', count: 34, left: 258, color: 'bg-sky-400' },
  ]
};

const mockTasks = [
  {
    id: 't1',
    user: {
      name: 'Sarah Jenkins',
      role: 'HR Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    action: 'Approve Payroll #1234',
    priority: 'High',
    date: '2026-01-20',
    time: '01:30 PM'
  },
  {
    id: 't2',
    user: {
      name: 'Michael Chen',
      role: 'Ops Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    action: 'Vendor Expense #882',
    priority: 'Low',
    date: '2026-01-20',
    time: '03:45 PM'
  }
];

const mockActivities = [
  {
    category: 'Accounts Payable',
    items: [
      { id: 'a1', title: 'Payment sent to Vendor #9345', timestamp: '2026-01-05 — 01:30 PM' },
      { id: 'a2', title: 'Payment sent to Vendor #42345', timestamp: '2026-01-05 — 11:15 AM' },
    ]
  },
  {
    category: 'Payroll',
    items: [
      { id: 'a3', title: 'Completed batch #12345', timestamp: '2026-01-04 — 12:30 PM' }
    ]
  }
];

const mockEvents = [
  {
    id: 'e1',
    time: '07:30 AM',
    title: 'Tax Filing Deadline',
    subtitle: 'Q4 State Taxes',
    date: '2026-01-15',
    unit: 'Unit #123',
    highlighted: false,
  },
  {
    id: 'e2',
    time: '09:00 AM',
    title: 'Quarterly Audit',
    subtitle: 'External Auditors - Boardroom',
    date: '',
    unit: '',
    highlighted: true,
  },
  {
    id: 'e3',
    time: '11:30 AM',
    title: 'Board Meeting',
    subtitle: 'Financial Review',
    date: '2026-01-18',
    unit: 'Unit #123',
    highlighted: false,
  }
];

const mockCalendarDays = [
  { day: 'Wed', num: 5, active: true },
  { day: 'Thu', num: 6, active: false },
  { day: 'Fri', num: 7, active: false },
  { day: 'Sat', num: 8, active: false },
  { day: 'Sun', num: 9, active: false },
  { day: 'Mon', num: 10, active: false },
  { day: 'Tue', num: 11, active: false },
];

export default function CFODashboard() {
  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#11142D] p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Good morning, Robert</h1>
          <p className="text-sm text-gray-400 mt-1">Wednesday, January 5, 2026</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-white border border-[#EBEAEF] hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm text-gray-700">
          <Download className="w-4 h-4 text-gray-500" />
          Export Report
        </button>
      </header>

      {/* TOP METRICS GRIDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric) => (
          <div key={metric.id} className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-medium uppercase tracking-wider">{metric.title}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{metric.subtitle}</p>
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                metric.isPositive 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-rose-50 text-rose-600'
              }`}>
                {metric.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* CHARTS & ANALYTICS OVERVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CASHFLOW OVERVIEW MATRIX */}
        <div className="bg-white p-6 rounded-xl border border-[#EBEAEF] shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cashflow Overview</h3>
              <p className="text-3xl font-bold mt-1 text-[#11142D]">{mockCashflowData.percentage}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-[#EBEAEF] px-3 py-1.5 rounded-md font-medium text-gray-600">
                This Year
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="flex items-center border border-[#EBEAEF] rounded-md bg-white overflow-hidden">
                <button className="p-1.5 hover:bg-gray-50 border-r border-[#EBEAEF]"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                <button className="p-1.5 hover:bg-gray-50ッシュ"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
              </div>
            </div>
          </div>

          {/* Dynamic Grid Matrix Simulation */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            {mockCashflowData.months.map((month, mIdx) => (
              <div key={mIdx} className="space-y-4">
                <h4 className="text-xs font-medium text-gray-400">{month.name}</h4>
                <div className="flex justify-between items-end h-32 pt-2">
                  {month.days.map((day, dIdx) => (
                    <div key={dIdx} className="flex flex-col items-center gap-2 flex-1">
                      {/* Interactive Dot Columns */}
                      <div className="flex flex-col gap-1 justify-end h-24">
                        {Array.from({ length: 5 }).map((_, dotIdx) => {
                          const isActive = dotIdx < day.activeDots;
                          return (
                            <span 
                              key={dotIdx} 
                              className={`w-2 h-2 rounded-full transition-colors ${
                                isActive ? 'bg-[#735BF2]' : 'bg-gray-100'
                              }`} 
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INVOICE STATUS SECTOR */}
        <div className="bg-white p-6 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-[#11142D]">Invoice Status</h3>
            <button className="text-xs bg-gray-50 border border-[#EBEAEF] px-3 py-1.5 rounded-md font-medium text-gray-600 flex items-center gap-1">
              This Month
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Donut Circle Structure */}
          <div className="flex items-center justify-center my-6">
            <div className="relative w-36 h-36 rounded-full border-8 border-gray-100 flex items-center justify-center transition-all shadow-inner" style={{ borderColor: '#735BF2 #f59e0b #f43f5e #38bdf8' }}>
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-400">Total</span>
                <span className="text-2xl font-black text-[#11142D]">{mockInvoiceStatus.total}</span>
              </div>
            </div>
          </div>

          {/* Item Progress Indicators */}
          <div className="space-y-3">
            {mockInvoiceStatus.segments.map((segment, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 w-20">
                  <span className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
                  <span className="text-gray-500 font-medium">{segment.label}</span>
                </div>
                <span className="font-bold text-[#11142D] w-8 text-right">{segment.count}</span>
                <div className="flex-1 mx-3 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${segment.color}`} style={{ width: `${(segment.count / mockInvoiceStatus.total) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 min-w-[40px] text-right">{segment.left} Left</span>
              </div>
            ))}
          </div>

          <button className="w-full text-center bg-[#735BF2] hover:bg-[#624be0] text-white text-xs font-semibold py-2.5 rounded-lg mt-5 transition-colors shadow-sm">
            View all
          </button>
        </div>
      </section>

      {/* LOWER FOOTER WORKFLOW CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* YOUR TASKS SECTION */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight">Your Tasks</h3>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 flex-1">
            {mockTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl bg-gray-50 border border-[#EBEAEF] space-y-3">
                <div className="flex items-center gap-3">
                  <img src={task.user.avatar} alt={task.user.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h4 className="text-xs font-bold text-[#11142D]">{task.user.name}</h4>
                    <p className="text-[11px] text-gray-400">{task.user.role}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start pt-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{task.action}</p>
                    <span className={`inline-block text-[10px] font-bold mt-1 ${task.priority === 'High' ? 'text-rose-500' : 'text-gray-400'}`}>{task.priority}</span>
                  </div>
                  <div className="text-right text-[10px] text-gray-400">
                    <p>{task.date}</p>
                    <p>{task.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="inline-flex items-center justify-center px-3 py-1.5 border border-[#EBEAEF] bg-white hover:bg-gray-100 text-xs font-medium rounded-lg text-gray-600 transition-colors">
                    Cancel
                  </button>
                  <button className="inline-flex items-center justify-center px-3 py-1.5 bg-[#735BF2] hover:bg-[#624be0] text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY LOGS */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight">Recent Activity</h3>
            <button className="text-xs text-[#735BF2] font-semibold hover:underline">View all</button>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto">
            {mockActivities.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 block">{group.category}</span>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-[#EBEAEF] bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{item.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.timestamp}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UPCOMING EVENTS SCHEDULE */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold tracking-tight">Upcoming Events</h3>
            <button className="text-xs text-gray-400 font-medium hover:underline">View all</button>
          </div>

          {/* Mini Calendar Row */}
          <div className="border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#11142D]">January 2026</span>
              <div className="flex items-center border border-gray-200 rounded bg-white overflow-hidden scale-90">
                <button className="p-1 hover:bg-gray-50 border-r border-gray-200"><ChevronLeft className="w-3 h-3 text-gray-500" /></button>
                <button className="p-1 hover:bg-gray-50ッシュ"><ChevronRight className="w-3 h-3 text-gray-500" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {mockCalendarDays.map((day, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[9px] font-medium text-gray-400 uppercase block">{day.day}</span>
                  <span className={`w-6 h-6 text-xs flex items-center justify-center mx-auto rounded-full font-semibold transition-all ${
                    day.active ? 'bg-[#735BF2] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}>{day.num}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events Dynamic Items */}
          <div className="space-y-2 flex-1">
            {mockEvents.map((event) => (
              <div 
                key={event.id} 
                className={`p-3 rounded-lg border transition-colors flex gap-3 ${
                  event.highlighted 
                    ? 'bg-purple-50/70 border-purple-200 text-[#735BF2]' 
                    : 'bg-white border-[#EBEAEF] text-[#11142D]'
                }`}
              >
                <div className="flex flex-col items-center justify-center min-w-[50px] text-center border-r border-gray-100 pr-2">
                  <Clock className="w-3.5 h-3.5 opacity-60 mb-1" />
                  <span className="text-[10px] font-bold block leading-none">{event.time.split(' ')[0]}</span>
                  <span className="text-[8px] font-semibold uppercase block tracking-wider opacity-70">{event.time.split(' ')[1]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold truncate ${event.highlighted ? 'text-[#735BF2]' : 'text-gray-900'}`}>{event.title}</h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{event.subtitle}</p>
                  
                  {(event.date || event.unit) && (
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-gray-400 font-medium">
                      {event.date && <span>{event.date}</span>}
                      {event.unit && <span>{event.unit}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}