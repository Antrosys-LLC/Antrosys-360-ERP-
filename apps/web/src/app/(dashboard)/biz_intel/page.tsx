import React from 'react';

// ==========================================
// MOCK DATA CONFIGURATIONS (No hardcoded rows)
// ==========================================

const mockTabs = [
  { id: 'library', name: 'Report Library', active: true },
  { id: 'builder', name: 'Custom Builder', active: false },
  { id: 'scheduled', name: 'Scheduled Reports', active: false },
  { id: 'shared', name: 'Shared with me', active: false },
  { id: 'favourites', name: 'Favourites', active: false },
];

const mockFilterChips = [
  { label: 'All reports (24)', active: true },
  { label: 'Finance (8)', active: false },
  { label: 'HR & people (6)', active: false },
  { label: 'Operations (5)', active: false },
  { label: 'Sales (5)', active: false },
];

const mockMiniMetrics = [
  { 
    title: 'Revenue overview', 
    lastRun: 'Last run: 2h ago', 
    borderClass: 'border-l-[#7B6AE6]', 
    sparklinePoints: '0,25 20,20 40,30 60,10 80,22 100,5' 
  },
  { 
    title: 'Headcount & attrition', 
    lastRun: 'Last run: 1d ago', 
    borderClass: 'border-l-emerald-500', 
    sparklinePoints: '0,15 20,18 40,10 60,25 80,20 100,28' 
  },
  { 
    title: 'Payroll cost analysis', 
    lastRun: 'Last run: 3d ago', 
    borderClass: 'border-l-amber-600', 
    sparklinePoints: '0,28 20,25 40,22 60,15 80,18 100,10' 
  },
];

const mockReportCards = [
  {
    title: 'Monthly P&L',
    description: 'Standard profit and loss statement with MoM variance.',
    updated: 'Updated: Today',
    iconType: 'trend'
  },
  {
    title: 'Sales Pipeline',
    description: 'Active deals by stage, probability, and expected close date.',
    updated: 'Updated: 2d ago',
    iconType: 'pipeline'
  },
  {
    title: 'Budget vs Actual',
    description: 'Departmental spending analysis against allocated budgets.',
    updated: 'Updated: 1w ago',
    iconType: 'target'
  },
  {
    title: 'Employee Turnover',
    description: 'Attrition rates by department and tenure brackets.',
    updated: 'Updated: 1m ago',
    iconType: 'turnover'
  },
];

const mockDataSources = [
  {
    category: 'Finance',
    isOpen: true,
    items: ['Revenue', 'Expenses', 'Margin %'],
  },
  {
    category: 'HR',
    isOpen: true,
    items: ['Headcount', 'Payroll cost'],
  },
  {
    category: 'Time Dimensions',
    isOpen: true,
    items: ['Month'],
  },
];

const mockChartBars = [
  { month: 'Dec', revenueHeight: '42%', payrollHeight: '18%' },
  { month: 'Jan', revenueHeight: '48%', payrollHeight: '22%' },
  { month: 'Feb', revenueHeight: '38%', payrollHeight: '20%' },
  { month: 'Mar', revenueHeight: '62%', payrollHeight: '26%' },
  { month: 'Apr', revenueHeight: '56%', payrollHeight: '28%' },
  { month: 'May', revenueHeight: '78%', payrollHeight: '32%' },
];

const mockSchedules = [
  { title: 'Weekly Sales', info: 'Every Mon, 8:00 AM', icon: 'mail' },
  { title: 'Monthly P&L', info: '1st of Month, 9:00 AM', icon: 'pdf' },
];

const mockRecentActivity = [
  { name: 'Revenue overview', duration: '1.2s', status: 'Completed', failed: false },
  { name: 'Headcount & attrition', duration: '3.4s', status: 'Completed', failed: false },
  { name: 'Payroll cost analysis', duration: '-', status: 'Failed', failed: true },
];

// ==========================================
// COMPONENT IMPLEMENTATION
// ==========================================

export default function BusinessIntelligenceDashboard() {
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1A1A1A] font-sans antialiased">
      
      {/* Top Header Bar */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <span>BI & Reports</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xl font-bold text-[#7B6AE6]">Business Intelligence</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#7B6AE6] text-[#7B6AE6] rounded text-sm font-semibold bg-white hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>May 1 – May 31, 2026</span>
          </button>

          {/* Quick Actions */}
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </button>

          {/* New Report Button */}
          <button className="bg-[#7B6AE6] hover:bg-opacity-90 text-white font-medium text-sm px-4 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all">
            <span>+</span> New report
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 ml-1">
            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">BI</div>
          </div>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs */}
      <nav className="px-6 bg-white border-b border-gray-200 flex gap-6 text-sm font-medium text-gray-500">
        {mockTabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-3 px-1 border-b-2 transition-colors ${
              tab.active 
                ? 'border-[#7B6AE6] text-[#7B6AE6] font-semibold' 
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {/* Main Canvas Workspace Container */}
      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Row 1: Segment Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {mockFilterChips.map((chip, index) => (
            <button
              key={index}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                chip.active 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Row 2: Sparkline Executions Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockMiniMetrics.map((card, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-md p-4 border border-gray-200 border-l-4 ${card.borderClass} flex items-center justify-between shadow-sm`}
            >
              <div>
                <h3 className="text-sm font-bold text-gray-800">{card.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{card.lastRun}</p>
              </div>
              <div className="w-24 h-8">
                <svg className="w-full h-full" viewBox="0 0 100 30">
                  <polyline
                    fill="none"
                    stroke={index === 0 ? '#7B6AE6' : index === 1 ? '#10b981' : '#b45309'}
                    strokeWidth="2"
                    points={card.sparklinePoints}
                  />
                </svg>
              </div>
            </div>
          ))}
        </section>

        {/* Row 3: Report Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockReportCards.map((report, index) => (
            <div key={index} className="bg-white rounded-md border border-gray-200 p-5 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div>
                {/* Visual Icon Blocks */}
                <div className="w-10 h-10 rounded bg-[#f0effd] flex items-center justify-center text-[#7B6AE6] mb-4">
                  {report.iconType === 'trend' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {report.iconType === 'pipeline' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  )}
                  {report.iconType === 'target' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22a10 10 0 100-20 10 10 0 000 20zm0 0v-3m0-14V3m9 9h-3m-14 0H3" />
                    </svg>
                  )}
                  {report.iconType === 'turnover' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">{report.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">{report.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                <span>{report.updated}</span>
                <button className="text-[#7B6AE6] hover:text-opacity-80 font-bold tracking-wider uppercase text-[11px] transition-colors">Run</button>
              </div>
            </div>
          ))}
        </section>

        <hr className="border-gray-200 my-6" />

        {/* Section: Custom Report Builder Workspace */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-sm tracking-wide">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span>Custom Report Builder</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 text-gray-900 grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-sm">
            
            {/* Column A: Data Sources */}
            <div className="lg:col-span-3 border-r border-gray-200 p-4 bg-white space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data Sources</h5>
              
              {mockDataSources.map((source, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 py-1">
                    <span>{source.category}</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="space-y-1 pl-1">
                    {source.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 shadow-sm cursor-grab hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-2 gap-0.5 opacity-30">
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column B: Canvas Layout Container */}
            <div className="lg:col-span-6 p-4 flex flex-col justify-between min-h-[420px] bg-white">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canvas Preview</h5>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-12 items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg p-2 min-h-[42px]">
                  <div className="col-span-2 text-xs font-bold text-gray-400 pl-1">X-Axis</div>
                  <div className="col-span-10 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#f0effd] text-[#7B6AE6] text-xs font-semibold px-2 py-0.5 rounded border border-[#cbd2f6]">
                      Month <button className="text-sm font-light text-[#7B6AE6] hover:text-opacity-70">×</button>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg p-2 min-h-[42px]">
                  <div className="col-span-2 text-xs font-bold text-gray-400 pl-1">Y-Axis</div>
                  <div className="col-span-10 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#f0effd] text-[#7B6AE6] text-xs font-semibold px-2 py-0.5 rounded border border-[#cbd2f6]">
                      Revenue <button className="text-sm font-light text-[#7B6AE6] hover:text-opacity-70">×</button>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-[#f0effd] text-[#7B6AE6] text-xs font-semibold px-2 py-0.5 rounded border border-[#cbd2f6]">
                      Payroll cost <button className="text-sm font-light text-[#7B6AE6] hover:text-opacity-70">×</button>
                    </span>
                  </div>
                </div>
              </div>

              {/* Central Chart Visual Overlay */}
              <div className="mt-6 flex-1 flex flex-col justify-end bg-white border border-gray-200 rounded-lg p-4 min-h-[220px]">
                <div className="w-full h-full flex items-stretch relative">
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 font-bold z-10 select-none pointer-events-none">
                    <span>1M</span>
                    <span>500K</span>
                    <span>0</span>
                  </div>

                  <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-60">
                    <div className="w-full border-t border-gray-100"></div>
                    <div className="w-full border-t border-gray-100"></div>
                    <div className="w-full border-t border-gray-100"></div>
                  </div>

                  <div className="flex-1 ml-8 flex items-end justify-around h-full pb-6 z-20">
                    {mockChartBars.map((item, idx) => (
                      <div key={idx} className="h-full flex flex-col justify-end items-center w-12 group">
                        <div className="flex items-end gap-1 w-full h-full justify-center">
                          <div 
                            className="w-3 bg-[#7B6AE6] rounded-t-sm transition-all" 
                            style={{ height: item.revenueHeight }}
                          />
                          <div 
                            className="w-3 bg-[#8c6227] rounded-t-sm transition-all" 
                            style={{ height: item.payrollHeight }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold mt-2 absolute bottom-0">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column C: Custom Configuration Controls */}
            <div className="lg:col-span-3 border-l border-gray-200 p-4 bg-white flex flex-col justify-between">
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settings</h5>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Show data labels</label>
                    <div className="w-8 h-4 bg-[#7B6AE6] rounded-full relative p-0.5 cursor-pointer flex items-center justify-end">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Show legend</label>
                    <div className="w-8 h-4 bg-[#7B6AE6] rounded-full relative p-0.5 cursor-pointer flex items-center justify-end">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">Trendline</label>
                    <div className="w-8 h-4 bg-gray-200 rounded-full relative p-0.5 cursor-pointer flex items-center justify-start">
                      <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 block">Active Filters</label>
                  <div className="border border-gray-200 rounded px-2.5 py-1.5 flex items-center justify-between bg-white text-xs shadow-sm">
                    <span className="text-gray-800 font-medium">Date: Last 6 Months</span>
                    <button className="text-gray-400 text-sm font-semibold hover:text-gray-600">×</button>
                  </div>
                  <button className="text-[11px] text-[#7B6AE6] font-bold hover:underline block pt-1">+ Add filter</button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 block">Export Format</label>
                  <div className="border border-gray-200 rounded px-2.5 py-1.5 flex items-center justify-between bg-white text-xs shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-gray-800 font-medium">PDF Document (.pdf)</span>
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button className="w-full bg-[#7B6AE6] hover:bg-opacity-95 text-white font-bold text-xs tracking-wide py-2.5 rounded shadow-sm mt-6 uppercase transition-all">
                Save & Run
              </button>
            </div>
          </div>
        </section>

        {/* Section: Scheduled & Recent Runs */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-sm tracking-wide">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scheduled & Recent Runs</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Active Schedules Cards block */}
            <div className="lg:col-span-5 space-y-2">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Schedules</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockSchedules.map((sched, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-md p-4 flex items-start justify-between hover:border-gray-300 transition-all shadow-sm">
                    <div className="space-y-1">
                      <h6 className="text-xs font-bold text-gray-900">{sched.title}</h6>
                      <p className="text-[11px] text-gray-500 font-medium">{sched.info}</p>
                    </div>
                    
                    <div className="text-[#7B6AE6] opacity-90 pl-2">
                      {sched.icon === 'mail' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Activity Logs Table */}
            <div className="lg:col-span-7 space-y-2">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h5>
              
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Report Name</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {mockRecentActivity.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className={`py-3 px-4 ${row.failed ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                          {row.name}
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-medium">{row.duration}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.failed 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}