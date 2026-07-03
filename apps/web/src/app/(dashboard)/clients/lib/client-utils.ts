export function formatCurrency(amount: number | null | undefined, currency = 'PKR'): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${currency} ${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export function clientInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function formatRenewalDate(dateStr: string | null): { label: string; sub?: string } {
  if (!dateStr) return { label: '—' };
  const d = new Date(dateStr);
  const days = daysUntil(dateStr);
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (days != null && days >= 0 && days <= 60) {
    return { label, sub: `${days} days` };
  }
  return { label };
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTaskDue(dateStr: string | null): string {
  if (!dateStr) return '';
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diff = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  const time = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return 'Tomorrow';
  return due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function healthColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-destructive';
}

export function healthBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-700';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-destructive';
}

export const SALES_STAGE_LABELS: Record<string, string> = {
  INITIAL_CONTACT: 'Initial Contact',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CONTRACT_REVIEW: 'Contract Review',
  CLOSED_WON: 'Closed/Won',
};

export interface HealthMetrics {
  productUsage: number;
  supportTickets: number;
  paymentHistory: number;
  engagement: number;
  nps: number;
}

export function parseHealthMetrics(raw: unknown): HealthMetrics {
  const m = raw as Partial<HealthMetrics> | null;
  return {
    productUsage: m?.productUsage ?? 70,
    supportTickets: m?.supportTickets ?? 70,
    paymentHistory: m?.paymentHistory ?? 70,
    engagement: m?.engagement ?? 70,
    nps: m?.nps ?? 70,
  };
}
