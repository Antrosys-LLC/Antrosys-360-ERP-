import { PageHeader } from '@/components/shared/PageHeader';
import {
  DollarSign,
  Users,
  Briefcase,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const kpiCards = [
  {
    title: 'Revenue',
    value: '₹24.5L',
    trend: '+12.5%',
    trendUp: true,
    icon: DollarSign,
  },
  {
    title: 'Headcount',
    value: '342',
    trend: '+8',
    trendUp: true,
    icon: Users,
  },
  {
    title: 'Active Projects',
    value: '28',
    trend: '+3',
    trendUp: true,
    icon: Briefcase,
  },
  {
    title: 'Pending Approvals',
    value: '15',
    trend: '-2',
    trendUp: false,
    icon: ClipboardCheck,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your organization."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <div className="rounded-lg bg-primary/10 p-2">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-foreground">
                {card.value}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {card.trendUp ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  card.trendUp ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {card.trend}
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
