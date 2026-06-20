"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  Flame,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  FileBarChart2,
  Download,
  CircleDot,
} from "lucide-react";

// ============================================================================
// MOCK DATA — replace with API fetches later (React Query hooks)
// ============================================================================

const kpiCards = {
  revenue: {
    label: "Total revenue · May 2026",
    compareLabel: "vs Apr 2026",
    value: "$842,000",
    deltaLabel: "+12.4% month-on-month",
    progressPct: 84,
    footnote: "84% of $1M monthly target",
    sparkline: [40, 52, 48, 60, 55, 70, 65, 78, 72, 85, 80, 92],
  },
  headcount: {
    label: "Total headcount",
    value: 247,
    deltaLabel: "+11 this quarter",
    ringPct: "82%",
    ringFootnote: "300 planned FY2026",
    deptTags: [
      { label: "Eng 82", bg: "#EEEDFE", text: "#534AB7" },
      { label: "Ops 57", bg: "#EAF3DE", text: "#27500A" },
      { label: "+5 more", bg: "#F1EFE8", text: "#444441" },
    ],
  },
  clients: {
    label: "Active clients",
    value: 34,
    deltaLabel: "+3 this month",
    riskTags: [
      { label: "2 at risk", bg: "#FCEBEB", text: "#791F1F" },
      { label: "8 renewal due", bg: "#FAEEDA", text: "#633806" },
    ],
    footnote: "Pipeline: 12 prospects",
  },
  burnRate: {
    label: "Monthly burn rate",
    value: "$318K",
    deltaLabel: "+3.1% vs Apr",
    runwayLabel: "Runway: 14 months",
    barPct: 38,
    footnote: "38% of monthly revenue",
  },
};

type RevenueRange = "Monthly" | "Quarterly" | "Annual";

const revenueTrend = {
  totalLabel: "Total $842K",
  ranges: ["Monthly", "Quarterly", "Annual"] as RevenueRange[],
  months: [
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
  ],
  revenue: [610, 640, 600, 660, 700, 690, 730, 710, 760, 790, 810, 842],
  payrollCost: [340, 350, 345, 360, 365, 358, 372, 368, 380, 390, 395, 400],
  peakMonth: { label: "Peak month", value: "May $842K" },
  ytd: { label: "YTD", value: "$8.6M" },
  avgMonthly: { label: "Avg monthly", value: "$716K" },
  yoyGrowth: { label: "vs last year", value: "+34%" },
};

const costBreakdown = {
  totalLabel: "Total $318K",
  totalCostLabel: "Total cost",
  totalCostValue: "$318K",
  items: [
    { label: "Payroll", pct: 38, value: "$120K", dot: "#7B68EE" },
    { label: "Operations", pct: 21, value: "$67K", dot: "#3B82F6" },
    { label: "Software", pct: 14, value: "$44K", dot: "#14B8A6" },
    { label: "Tax & legal", pct: 12, value: "$39K", dot: "#F59E0B" },
    { label: "Benefits", pct: 9, value: "$29K", dot: "#A855F7" },
    { label: "Other", pct: 6, value: "$18K", dot: "#9CA3AF" },
  ],
  vsLastMonth: [
    { label: "Payroll", delta: "+3.3%", positive: false },
    { label: "Operations", delta: "+0.8%", positive: false },
    { label: "Software", delta: "-2.4%", positive: true },
    { label: "Tax", delta: "+1.2%", positive: false },
  ],
};

type QuickActionTone = "default" | "urgent";

const quickActions: {
  icon: typeof ShieldCheck;
  title: string;
  meta: string;
  tone: QuickActionTone;
}[] = [
  {
    icon: ShieldCheck,
    title: "View audit log",
    meta: "12 new entries since yesterday",
    tone: "default",
  },
  {
    icon: ShieldOff,
    title: "Override approval",
    meta: "1 escalated request pending",
    tone: "urgent",
  },
  {
    icon: FileBarChart2,
    title: "Open BI report",
    meta: "Last generated today, 08:42 AM",
    tone: "default",
  },
  {
    icon: Briefcase,
    title: "Review client pipeline",
    meta: "2 clients at risk · 8 renewals",
    tone: "default",
  },
  {
    icon: Download,
    title: "Export board report",
    meta: "Board meeting May 30, 2026",
    tone: "default",
  },
];

const clientPipeline = {
  totalLabel: "34 active",
  stages: [
    { label: "Prospect", count: 12, max: 34 },
    { label: "Proposal", count: 9, max: 34 },
    { label: "Negotiation", count: 5, max: 34 },
    { label: "Active", count: 34, max: 34 },
    { label: "At risk", count: 2, max: 34 },
  ],
  footerStats: [
    { label: "ARR", value: "$4.2M" },
    { label: "MRR", value: "$350K" },
  ],
  topClientLabel: "Top client: Nexus Corp $42K/mo",
};

type ActivityTone = "success" | "info" | "warning" | "danger" | "neutral";

const systemActivity: {
  tone: ActivityTone;
  title: string;
  meta: string;
  time: string;
}[] = [
  {
    tone: "success",
    title: "Payroll run initiated",
    meta: "Nadia Qureshi · Finance",
    time: "4m ago",
  },
  {
    tone: "info",
    title: "New hire onboarded",
    meta: "Sara Javed · Engineering",
    time: "32m ago",
  },
  {
    tone: "warning",
    title: "Leave approved — Omar Mirza (3 days)",
    meta: "Zara Khan · Manager",
    time: "1h ago",
  },
  {
    tone: "danger",
    title: "Override request escalated to CEO",
    meta: "System · Compliance",
    time: "2h ago",
  },
  {
    tone: "info",
    title: "Client Nexus Corp — Invoice sent $42K",
    meta: "Nadia Qureshi · Finance",
    time: "3h ago",
  },
  {
    tone: "neutral",
    title: "Audit log exported for board package",
    meta: "Dawood Akhtar (you)",
    time: "5h ago",
  },
];

type ServiceStatus = "Operational" | "Degraded";

const systemHealth: { label: string; status: ServiceStatus }[] = [
  { label: "API gateway", status: "Operational" },
  { label: "Stripe billing", status: "Operational" },
  { label: "Payroll engine", status: "Operational" },
  { label: "Auth / SSO", status: "Operational" },
  { label: "File storage", status: "Degraded" },
  { label: "Email service", status: "Operational" },
  { label: "Audit logging", status: "Operational" },
];

const systemUptime = {
  pct: "99.7% uptime",
  period: "last 30 days",
  lastChecked: "Last checked 2 min ago",
};

// ============================================================================
// SMALL PRESENTATIONAL HELPERS
// ============================================================================

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#7B68EE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RevenueChart({
  months,
  revenue,
  payrollCost,
}: {
  months: string[];
  revenue: number[];
  payrollCost: number[];
}) {
  const w = 560;
  const h = 160;
  const max = Math.max(...revenue);
  const min = Math.min(...payrollCost) * 0.85;

  const toPoints = (data: number[]) =>
    data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
      })
      .join(" ");

  const revenuePoints = toPoints(revenue);
  const revenueArea = `0,${h} ${revenuePoints} ${w},${h}`;
  const payrollPoints = toPoints(payrollCost);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[160px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B68EE" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7B68EE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={revenueArea} fill="url(#revenueFill)" />
        <polyline
          points={revenuePoints}
          fill="none"
          stroke="#7B68EE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={payrollPoints}
          fill="none"
          stroke="#C7C2F2"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center justify-between mt-2 px-0.5">
        {months.map((m) => (
          <span key={m} className="text-[10px] text-[#AAAAAA] font-normal">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function activityToneDot(tone: ActivityTone) {
  switch (tone) {
    case "success":
      return "#3B6D11";
    case "info":
      return "#3B82F6";
    case "warning":
      return "#F59E0B";
    case "danger":
      return "#E24B4A";
    default:
      return "#AAAAAA";
  }
}

function statusDotColor(status: ServiceStatus) {
  return status === "Operational" ? "#3B6D11" : "#F59E0B";
}

function statusBadgeClasses(status: ServiceStatus) {
  return status === "Operational"
    ? "bg-[#EAF3DE] text-[#27500A]"
    : "bg-[#FAEEDA] text-[#633806]";
}

// ============================================================================
// PAGE
// ============================================================================

export default function CeoDashboardPage() {
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("Monthly");

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Total revenue */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp
                size={14}
                strokeWidth={1.8}
                className="text-[#888888]"
              />
              <span className="text-[11px] text-[#888888]">
                {kpiCards.revenue.label}
              </span>
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {kpiCards.revenue.compareLabel}
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-3">
            {kpiCards.revenue.value}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <TrendingUp
                size={12}
                strokeWidth={2}
                className="text-[#27500A]"
              />
              <span className="text-[12px] text-[#27500A]">
                {kpiCards.revenue.deltaLabel}
              </span>
            </div>
            <Sparkline data={kpiCards.revenue.sparkline} />
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EEEDFE] overflow-hidden mb-2">
            <div
              className="h-full bg-[#7B68EE] rounded-full"
              style={{ width: `${kpiCards.revenue.progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-[#AAAAAA] text-right">
            {kpiCards.revenue.footnote}
          </span>
        </div>

        {/* Total headcount */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4">
            <Users size={14} strokeWidth={1.8} className="text-[#888888]" />
            <span className="text-[11px] text-[#888888]">
              {kpiCards.headcount.label}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[26px] font-bold text-[#1A1A1A] leading-none">
                {kpiCards.headcount.value}
              </div>
              <span className="text-[11px] text-[#27500A]">
                {kpiCards.headcount.deltaLabel}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="size-8 rounded-full bg-white border border-[#EEEDFE] flex items-center justify-center">
                <span className="text-[#534AB7] font-semibold text-[10px]">
                  {kpiCards.headcount.ringPct}
                </span>
              </div>
              <span className="text-[10px] text-[#AAAAAA] whitespace-nowrap">
                {kpiCards.headcount.ringFootnote}
              </span>
            </div>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex items-center gap-1 flex-wrap">
            {kpiCards.headcount.deptTags.map((tag) => (
              <span
                key={tag.label}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: tag.bg, color: tag.text }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Active clients */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4">
            <Briefcase size={14} strokeWidth={1.8} className="text-[#888888]" />
            <span className="text-[11px] text-[#888888]">
              {kpiCards.clients.label}
            </span>
          </div>
          <div className="mb-4">
            <div className="text-[26px] font-bold text-[#1A1A1A] leading-none mb-2">
              {kpiCards.clients.value}
            </div>
            <span className="text-[11px] text-[#27500A]">
              {kpiCards.clients.deltaLabel}
            </span>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {kpiCards.clients.riskTags.map((tag) => (
                <span
                  key={tag.label}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: tag.bg, color: tag.text }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {kpiCards.clients.footnote}
            </span>
          </div>
        </div>

        {/* Monthly burn rate */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4">
            <Flame size={14} strokeWidth={1.8} className="text-[#888888]" />
            <span className="text-[11px] text-[#888888]">
              {kpiCards.burnRate.label}
            </span>
          </div>
          <div className="mb-4">
            <div className="text-[24px] font-bold text-[#A32D2D] leading-none mb-2">
              {kpiCards.burnRate.value}
            </div>
            <span className="text-[11px] text-[#791F1F]">
              {kpiCards.burnRate.deltaLabel}
            </span>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex flex-col gap-2">
            <span className="text-[11px] text-[#888888]">
              {kpiCards.burnRate.runwayLabel}
            </span>
            <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full bg-[#E24B4A] rounded-full"
                style={{ width: `${kpiCards.burnRate.barPct}%` }}
              />
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {kpiCards.burnRate.footnote}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue trend + Cost breakdown */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-3">
        {/* Revenue trend chart */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Revenue trend · last 12 months
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#F8F9FC] rounded-md p-0.5">
                {revenueTrend.ranges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setRevenueRange(range)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                      revenueRange === range
                        ? "bg-white text-[#534AB7] shadow-sm"
                        : "text-[#888888]"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-[#534AB7] bg-[#EEEDFE] px-2 py-1 rounded-md">
                {revenueTrend.totalLabel}
              </span>
            </div>
          </div>

          <RevenueChart
            months={revenueTrend.months}
            revenue={revenueTrend.revenue}
            payrollCost={revenueTrend.payrollCost}
          />

          <div className="flex items-center gap-4 mt-3 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#7B68EE] rounded-full" />
              <span className="text-[11px] text-[#888888]">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#C7C2F2] rounded-full border-dashed" />
              <span className="text-[11px] text-[#888888]">Payroll cost</span>
            </div>
          </div>

          <div className="grid grid-cols-4 border-t border-[#E0E0E0] pt-3">
            {[
              revenueTrend.peakMonth,
              revenueTrend.ytd,
              revenueTrend.avgMonthly,
              revenueTrend.yoyGrowth,
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#AAAAAA]">{stat.label}</span>
                <span className="text-[12px] font-semibold text-[#1A1A1A]">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Cost breakdown · May 2026
            </span>
            <span className="text-[11px] font-semibold text-[#534AB7] bg-[#EEEDFE] px-2 py-1 rounded-md">
              {costBreakdown.totalLabel}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="size-[88px] rounded-full shrink-0 relative"
              style={{
                background: `conic-gradient(#7B68EE 0% 38%, #3B82F6 38% 59%, #14B8A6 59% 73%, #F59E0B 73% 85%, #A855F7 85% 94%, #9CA3AF 94% 100%)`,
              }}
            >
              <div className="absolute inset-[12px] rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-[14px] font-bold text-[#1A1A1A] leading-none">
                  {costBreakdown.totalCostValue}
                </span>
                <span className="text-[9px] text-[#AAAAAA] mt-0.5">
                  {costBreakdown.totalCostLabel}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {costBreakdown.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.dot }}
                    />
                    <span className="text-[11px] text-[#1A1A1A] truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#AAAAAA]">
                      {item.pct}%
                    </span>
                    <span className="text-[11px] font-medium text-[#1A1A1A] w-10 text-right">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E0E0E0] pt-3">
            <span className="text-[10px] text-[#AAAAAA] block mb-2">
              vs Apr 2026
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {costBreakdown.vsLastMonth.map((stat) => (
                <span
                  key={stat.label}
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                    stat.positive
                      ? "bg-[#EAF3DE] text-[#27500A]"
                      : "bg-[#FCEBEB] text-[#791F1F]"
                  }`}
                >
                  {stat.label} {stat.delta}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions + Client pipeline + System activity + System health */}
      <div className="grid grid-cols-4 gap-3">
        {/* Quick actions */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <span className="text-[13px] font-semibold text-[#1A1A1A] mb-3">
            Quick actions · CEO
          </span>
          <div className="flex flex-col gap-1 -mx-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  className="flex items-center gap-2.5 px-1 py-2 rounded-md hover:bg-[#F8F9FC] text-left transition-colors"
                >
                  <div
                    className={`size-7 rounded-md flex items-center justify-center shrink-0 ${
                      action.tone === "urgent" ? "bg-[#FCEBEB]" : "bg-[#EEEDFE]"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.8}
                      className={
                        action.tone === "urgent"
                          ? "text-[#791F1F]"
                          : "text-[#534AB7]"
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-[#1A1A1A] truncate">
                        {action.title}
                      </span>
                      {action.tone === "urgent" && (
                        <span className="text-[9px] font-medium text-[#791F1F] bg-[#FCEBEB] px-1.5 py-px rounded-full shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#AAAAAA] truncate block">
                      {action.meta}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.8}
                    className="text-[#CCCCCC] shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Client pipeline */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Client pipeline
            </span>
            <span className="text-[10px] text-[#AAAAAA]">
              {clientPipeline.totalLabel}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 flex-1">
            {clientPipeline.stages.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#888888]">
                    {stage.label}
                  </span>
                  <span className="text-[11px] font-medium text-[#1A1A1A]">
                    {stage.count}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
                  <div
                    className="h-full bg-[#7B68EE] rounded-full"
                    style={{ width: `${(stage.count / stage.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0E0E0] mt-3 pt-3">
            <div className="flex items-center gap-4 mb-2">
              {clientPipeline.footerStats.map((stat) => (
                <div key={stat.label}>
                  <span className="text-[9px] text-[#AAAAAA] block">
                    {stat.label}
                  </span>
                  <span className="text-[12px] font-semibold text-[#1A1A1A]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {clientPipeline.topClientLabel}
            </span>
          </div>
        </div>

        {/* System activity */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              System activity
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#27500A] font-medium">
              <CircleDot size={10} strokeWidth={2.5} />
              Live
            </span>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {systemActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span
                  className="size-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: activityToneDot(item.tone) }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11.5px] text-[#1A1A1A] leading-snug block">
                    {item.title}
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-[#AAAAAA] truncate">
                      {item.meta}
                    </span>
                    <span className="text-[10px] text-[#AAAAAA] shrink-0 ml-2">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-[11px] font-medium text-[#534AB7] mt-3 pt-3 border-t border-[#E0E0E0] text-left hover:underline"
          >
            View full audit log →
          </button>
        </div>

        {/* System health */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <span className="text-[13px] font-semibold text-[#1A1A1A] mb-3">
            System health
          </span>
          <div className="flex flex-col gap-2 flex-1">
            {systemHealth.map((service) => (
              <div
                key={service.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: statusDotColor(service.status) }}
                  />
                  <span className="text-[11.5px] text-[#1A1A1A]">
                    {service.label}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${statusBadgeClasses(service.status)}`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0E0E0] mt-3 pt-3 flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#27500A] bg-[#EAF3DE] px-2 py-1 rounded-md text-center">
              {systemUptime.pct} · {systemUptime.period}
            </span>
            <span className="text-[10px] text-[#AAAAAA] text-center">
              {systemUptime.lastChecked}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
