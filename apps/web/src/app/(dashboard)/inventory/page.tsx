import React from 'react';

// ============================================================================
// MOCK DATA
// ============================================================================

const kpiData = [
  { id: 1, title: 'Total Revenue', value: '$1.24M', trend: '+12.5%', isPositive: true },
  { id: 2, title: 'Active Projects', value: '142', trend: '+5.2%', isPositive: true },
  { id: 3, title: 'Profit Margin', value: '24.8%', trend: '-1.4%', isPositive: false },
  { id: 4, title: 'Pending Invoices', value: '38', trend: '-8.1%', isPositive: true }, // Less pending is good
];

const chartData = [
  { month: 'Jan', revenue: 45, expenses: 30 },
  { month: 'Feb', revenue: 52, expenses: 32 },
  { month: 'Mar', revenue: 48, expenses: 35 },
  { month: 'Apr', revenue: 61, expenses: 38 },
  { month: 'May', revenue: 59, expenses: 40 },
  { month: 'Jun', revenue: 75, expenses: 42 },
];

const recentTransactions = [
  { id: 'TRX-8291', date: '2026-07-10', department: 'Enterprise Sales', amount: '$14,200.00', status: 'Completed' },
  { id: 'TRX-8292', date: '2026-07-09', department: 'Marketing', amount: '$1,850.00', status: 'Pending' },
  { id: 'TRX-8293', date: '2026-07-08', department: 'IT Infrastructure', amount: '$22,400.00', status: 'Completed' },
  { id: 'TRX-8294', date: '2026-07-08', department: 'Human Resources', amount: '$850.00', status: 'Failed' },
  { id: 'TRX-8295', date: '2026-07-07', department: 'Enterprise Sales', amount: '$5,100.00', status: 'Completed' },
];

// ============================================================================
// DUMB COMPONENTS
// ============================================================================

const StatCard = ({ title, value, trend, isPositive }: { title: string; value: string; trend: string; isPositive: boolean }) => (
  <div className="bg-card text-card-foreground border border-border p-6 rounded-[var(--radius)] shadow-sm flex flex-col justify-between">
    <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
    <div className="flex items-baseline justify-between">
      <span className="text-3xl font-bold">{value}</span>
      <span className={`text-sm font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const TransactionTable = ({ data }: { data: typeof recentTransactions }) => (
  <div className="bg-card border border-border rounded-[var(--radius)] overflow-x-auto shadow-sm">
    <table className="w-full text-sm text-left">
      <thead className="bg-muted text-muted-foreground text-xs uppercase border-b border-border">
        <tr>
          <th className="px-6 py-4 font-medium">Transaction ID</th>
          <th className="px-6 py-4 font-medium">Date</th>
          <th className="px-6 py-4 font-medium">Department</th>
          <th className="px-6 py-4 font-medium text-right">Amount</th>
          <th className="px-6 py-4 font-medium text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
            <td className="px-6 py-4 font-medium text-foreground">{row.id}</td>
            <td className="px-6 py-4 text-muted-foreground">{row.date}</td>
            <td className="px-6 py-4 text-muted-foreground">{row.department}</td>
            <td className="px-6 py-4 text-right font-medium">{row.amount}</td>
            <td className="px-6 py-4 flex justify-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                row.status === 'Completed' ? 'bg-primary/10 text-primary border-primary/20' :
                row.status === 'Pending' ? 'bg-accent text-accent-foreground border-border' :
                'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChartPlaceholder = ({ data }: { data: typeof chartData }) => (
  <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm h-80 flex flex-col">
    <h3 className="text-lg font-medium text-foreground mb-6">Revenue vs Expenses (H1)</h3>
    <div className="flex-1 flex items-end justify-between gap-2 mt-auto border-b border-border pb-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 w-full group">
          <div className="w-full flex justify-center gap-1 h-48 items-end">
            {/* Revenue Bar */}
            <div 
              className="bg-primary rounded-t-sm w-1/3 transition-all group-hover:opacity-80" 
              style={{ height: `${d.revenue}%` }}
              title={`Revenue: ${d.revenue}k`}
            />
            {/* Expenses Bar */}
            <div 
              className="bg-secondary rounded-t-sm w-1/3 border border-border transition-all group-hover:opacity-80" 
              style={{ height: `${d.expenses}%` }}
              title={`Expenses: ${d.expenses}k`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function BusinessIntelligenceDashboard() {
  return (
    <main className="erp-content">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time financial and operational overview.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
          </svg>
          Export Report
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi) => (
          <StatCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            isPositive={kpi.isPositive}
          />
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart taking up 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <ChartPlaceholder data={chartData} />
        </div>
        
        {/* Secondary Info / Insights taking up 1/3 width */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">Key Insights</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 pb-4 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Revenue target exceeded</p>
                <p className="text-xs text-muted-foreground mt-1">Q2 revenue is 12.5% higher than projected.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 pb-4 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Infrastructure costs rising</p>
                <p className="text-xs text-muted-foreground mt-1">Server costs increased by 4% this month.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Data Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Recent Transactions</h2>
        </div>
        <TransactionTable data={recentTransactions} />
      </section>
    </main>
  );
}