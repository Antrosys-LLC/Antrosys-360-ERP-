"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportCeoBoardReport,
  fetchCeoClientPipeline,
  fetchCeoCostBreakdown,
  fetchCeoDashboard,
  fetchCeoQuickActions,
  fetchCeoRevenueTrend,
  fetchCeoSystemActivity,
  fetchCeoSystemHealth,
  type RevenueRange,
} from "@/lib/ceo-api";

const REVENUE_RANGES: RevenueRange[] = ["Monthly", "Quarterly", "Annual"];

const QUICK_ACTION_ICONS = {
  audit: ShieldCheck,
  override: ShieldOff,
  bi: FileBarChart2,
  clients: Briefcase,
  export: Download,
} as const;

const BADGE_STYLES = {
  green: "bg-[#EAF3DE] text-[#27500A]",
  purple: "bg-[#EEEDFE] text-[#534AB7]",
  orange: "bg-[#FAEEDA] text-[#633806]",
} as const;

// ============================================================================
// SMALL PRESENTATIONAL HELPERS
// ============================================================================

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
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
  if (months.length < 2 || revenue.length < 2) {
    return (
      <div className="w-full h-[160px] flex items-center justify-center text-[11px] text-[#AAAAAA]">
        No trend data for this period
      </div>
    );
  }
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

function activityToneDot(tone: "success" | "info" | "warning" | "danger" | "neutral") {
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

function statusDotColor(status: "Operational" | "Degraded") {
  return status === "Operational" ? "#3B6D11" : "#F59E0B";
}

function statusBadgeClasses(status: "Operational" | "Degraded") {
  return status === "Operational"
    ? "bg-[#EAF3DE] text-[#27500A]"
    : "bg-[#FAEEDA] text-[#633806]";
}

// ============================================================================
// PAGE
// ============================================================================

export default function CeoDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [compare, setCompare] = useState(false);
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("Monthly");

  const periodParams = { month, year, compare };

  const dashboardQuery = useQuery({
    queryKey: ["ceo", "dashboard", month, year, compare],
    queryFn: () => fetchCeoDashboard(periodParams),
  });

  const revenueTrendQuery = useQuery({
    queryKey: ["ceo", "revenue-trend", month, year, compare, revenueRange],
    queryFn: () => fetchCeoRevenueTrend({ ...periodParams, range: revenueRange }),
  });

  const costBreakdownQuery = useQuery({
    queryKey: ["ceo", "cost-breakdown", month, year, compare],
    queryFn: () => fetchCeoCostBreakdown(periodParams),
  });

  const pipelineQuery = useQuery({
    queryKey: ["ceo", "client-pipeline"],
    queryFn: fetchCeoClientPipeline,
  });

  const quickActionsQuery = useQuery({
    queryKey: ["ceo", "quick-actions"],
    queryFn: fetchCeoQuickActions,
  });

  const activityQuery = useQuery({
    queryKey: ["ceo", "system-activity"],
    queryFn: fetchCeoSystemActivity,
  });

  const healthQuery = useQuery({
    queryKey: ["ceo", "system-health"],
    queryFn: fetchCeoSystemHealth,
  });

  const header = dashboardQuery.data?.header;
  const kpiCards = dashboardQuery.data?.kpiCards;
  const revenueTrend = revenueTrendQuery.data;
  const costBreakdown = costBreakdownQuery.data;
  const clientPipeline = pipelineQuery.data;
  const quickActions = quickActionsQuery.data ?? [];
  const systemActivity = activityQuery.data ?? [];
  const systemHealth = healthQuery.data?.services ?? [];
  const systemUptime = healthQuery.data?.uptime ?? {
    pct: "—",
    period: "last 30 days",
    lastChecked: "—",
  };

  const monthInputValue = `${year}-${String(month).padStart(2, "0")}`;

  const handleExport = async () => {
    const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    try {
      const blob = await exportCeoBoardReport(fromDate, toDate);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ceo-board-report-${fromDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "Board report exported" });
    } catch {
      toast({ variant: "destructive", title: "Export failed" });
    }
  };

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    if (action.id === "export") {
      handleExport();
      return;
    }
    router.push(action.href);
  };

  const conicGradient = costBreakdown?.items.length
    ? (() => {
        let cursor = 0;
        const stops = costBreakdown.items.map((item) => {
          const start = cursor;
          cursor += item.pct;
          return `${item.dot} ${start}% ${cursor}%`;
        });
        return `conic-gradient(${stops.join(", ")})`;
      })()
    : "conic-gradient(#E0E0E0 0% 100%)";

  return (
    <div className="flex flex-col gap-3">
      {/* HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
        <div className="space-y-3">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight">
            {header?.greeting ?? "Good morning"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#888888]">
            <span>{header?.subtitle ?? "CEO · Full system access"}</span>
            {(header?.badges ?? []).map((badge) => (
              <span
                key={badge.id}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${BADGE_STYLES[badge.tone]}`}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {badge.label} {badge.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#1A1A1A] bg-white border border-[#E0E0E0] rounded-lg px-3 py-2 cursor-pointer">
            <Calendar size={14} className="text-[#888888]" />
            <input
              type="month"
              value={monthInputValue}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-");
                setYear(Number(y));
                setMonth(Number(m));
              }}
              className="bg-transparent outline-none cursor-pointer text-[12px]"
            />
          </label>
          <button
            type="button"
            onClick={() => setCompare((v) => !v)}
            className={`text-[12px] font-medium px-4 py-2 rounded-lg border transition-colors ${
              compare
                ? "bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]"
                : "bg-white border-[#E0E0E0] text-[#534AB7] hover:bg-[#F8F9FC]"
            }`}
          >
            Compare period
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center size-10 bg-white border border-[#E0E0E0] rounded-lg hover:bg-[#F8F9FC] transition-colors"
            aria-label="Export board report"
          >
            <Download size={16} className="text-[#888888]" />
          </button>
        </div>
      </header>

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
                {kpiCards?.revenue.label ?? "Total revenue"}
              </span>
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {kpiCards?.revenue.compareLabel ?? "—"}
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-3">
            {kpiCards?.revenue.value ?? "—"}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <TrendingUp
                size={12}
                strokeWidth={2}
                className="text-[#27500A]"
              />
              <span className="text-[12px] text-[#27500A]">
                {kpiCards?.revenue.deltaLabel ?? "—"}
              </span>
            </div>
            <Sparkline data={kpiCards?.revenue.sparkline ?? []} />
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EEEDFE] overflow-hidden mb-2">
            <div
              className="h-full bg-[#7B68EE] rounded-full"
              style={{ width: `${kpiCards?.revenue.progressPct ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] text-[#AAAAAA] text-right">
            {kpiCards?.revenue.footnote ?? ""}
          </span>
        </div>

        {/* Total headcount */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4">
            <Users size={14} strokeWidth={1.8} className="text-[#888888]" />
            <span className="text-[11px] text-[#888888]">
              {kpiCards?.headcount.label ?? "Total headcount"}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[26px] font-bold text-[#1A1A1A] leading-none">
                {kpiCards?.headcount.value ?? "—"}
              </div>
              <span className="text-[11px] text-[#27500A]">
                {kpiCards?.headcount.deltaLabel ?? "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="size-8 rounded-full bg-white border border-[#EEEDFE] flex items-center justify-center">
                <span className="text-[#534AB7] font-semibold text-[10px]">
                  {kpiCards?.headcount.ringPct ?? "—"}
                </span>
              </div>
              <span className="text-[10px] text-[#AAAAAA] whitespace-nowrap">
                {kpiCards?.headcount.ringFootnote ?? ""}
              </span>
            </div>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex items-center gap-1 flex-wrap">
            {(kpiCards?.headcount.deptTags ?? []).map((tag) => (
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
              {kpiCards?.clients.label ?? "Active clients"}
            </span>
          </div>
          <div className="mb-4">
            <div className="text-[26px] font-bold text-[#1A1A1A] leading-none mb-2">
              {kpiCards?.clients.value ?? "—"}
            </div>
            <span className="text-[11px] text-[#27500A]">
              {kpiCards?.clients.deltaLabel ?? "—"}
            </span>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {(kpiCards?.clients.riskTags ?? []).map((tag) => (
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
              {kpiCards?.clients.footnote ?? ""}
            </span>
          </div>
        </div>

        {/* Monthly burn rate */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4">
            <Flame size={14} strokeWidth={1.8} className="text-[#888888]" />
            <span className="text-[11px] text-[#888888]">
              {kpiCards?.burnRate.label ?? "Monthly burn rate"}
            </span>
          </div>
          <div className="mb-4">
            <div className="text-[24px] font-bold text-[#A32D2D] leading-none mb-2">
              {kpiCards?.burnRate.value ?? "—"}
            </div>
            <span className="text-[11px] text-[#791F1F]">
              {kpiCards?.burnRate.deltaLabel ?? "—"}
            </span>
          </div>
          <div className="border-t border-[#E0E0E080] pt-2.5 flex flex-col gap-2">
            <span className="text-[11px] text-[#888888]">
              {kpiCards?.burnRate.runwayLabel ?? "—"}
            </span>
            <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full bg-[#E24B4A] rounded-full"
                style={{ width: `${kpiCards?.burnRate.barPct ?? 0}%` }}
              />
            </div>
            <span className="text-[10px] text-[#AAAAAA]">
              {kpiCards?.burnRate.footnote ?? ""}
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
                {REVENUE_RANGES.map((range) => (
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
                {revenueTrend?.totalLabel ?? "—"}
              </span>
            </div>
          </div>

          <RevenueChart
            months={revenueTrend?.months ?? []}
            revenue={revenueTrend?.revenue ?? []}
            payrollCost={revenueTrend?.payrollCost ?? []}
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
              revenueTrend?.peakMonth,
              revenueTrend?.ytd,
              revenueTrend?.avgMonthly,
              revenueTrend?.yoyGrowth,
            ]
              .filter(Boolean)
              .map((stat) => (
              <div key={stat!.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#AAAAAA]">{stat!.label}</span>
                <span className="text-[12px] font-semibold text-[#1A1A1A]">
                  {stat!.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Cost breakdown · {costBreakdown?.periodLabel ?? header?.periodLabel ?? "—"}
            </span>
            <span className="text-[11px] font-semibold text-[#534AB7] bg-[#EEEDFE] px-2 py-1 rounded-md">
              {costBreakdown?.totalLabel ?? "—"}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="size-[88px] rounded-full shrink-0 relative"
              style={{ background: conicGradient }}
            >
              <div className="absolute inset-[12px] rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-[14px] font-bold text-[#1A1A1A] leading-none">
                  {costBreakdown?.totalCostValue ?? "—"}
                </span>
                <span className="text-[9px] text-[#AAAAAA] mt-0.5">
                  {costBreakdown?.totalCostLabel ?? ""}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {(costBreakdown?.items ?? []).map((item) => (
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
              vs prior period
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(costBreakdown?.vsLastMonth ?? []).map((stat) => (
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
      <div className="grid grid-cols-4 gap-3 min-w-0 items-stretch">
        {/* Quick actions */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex flex-col h-[220px] min-h-0">
          <span className="text-[12px] font-semibold text-[#1A1A1A] mb-2 shrink-0">
            Quick actions · CEO
          </span>
          <div className="flex flex-col gap-0.5 -mx-0.5 overflow-y-auto min-h-0 flex-1">
            {quickActions.map((action) => {
              const Icon =
                QUICK_ACTION_ICONS[action.id as keyof typeof QUICK_ACTION_ICONS] ??
                Briefcase;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-[#F8F9FC] text-left transition-colors w-full"
                >
                  <div
                    className={`size-6 rounded-md flex items-center justify-center shrink-0 ${
                      action.tone === "urgent" ? "bg-[#FCEBEB]" : "bg-[#EEEDFE]"
                    }`}
                  >
                    <Icon
                      size={12}
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
                      <span className="text-[11px] font-medium text-[#1A1A1A] truncate">
                        {action.title}
                      </span>
                      {action.tone === "urgent" && (
                        <span className="text-[8px] font-medium text-[#791F1F] bg-[#FCEBEB] px-1 py-px rounded-full shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-[#AAAAAA] truncate block">
                      {action.meta}
                    </span>
                  </div>
                  <ChevronRight
                    size={12}
                    strokeWidth={1.8}
                    className="text-[#CCCCCC] shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Client pipeline */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex flex-col h-[220px] min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[12px] font-semibold text-[#1A1A1A]">
              Client pipeline
            </span>
            <span className="text-[9px] text-[#AAAAAA]">
              {clientPipeline?.totalLabel ?? "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0">
            {(clientPipeline?.stages ?? []).map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#888888]">
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-medium text-[#1A1A1A]">
                    {stage.count}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
                  <div
                    className="h-full bg-[#7B68EE] rounded-full"
                    style={{ width: `${(stage.count / stage.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0E0E0] mt-2 pt-2 shrink-0">
            <div className="flex items-center gap-3 mb-1">
              {(clientPipeline?.footerStats ?? []).map((stat) => (
                <div key={stat.label}>
                  <span className="text-[8px] text-[#AAAAAA] block">
                    {stat.label}
                  </span>
                  <span className="text-[11px] font-semibold text-[#1A1A1A]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[9px] text-[#AAAAAA] truncate block">
              {clientPipeline?.topClientLabel ?? ""}
            </span>
          </div>
        </div>

        {/* System activity */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex flex-col h-[220px] min-w-0 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[12px] font-semibold text-[#1A1A1A]">
              System activity
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[#27500A] font-medium">
              <CircleDot size={9} strokeWidth={2.5} />
              Live
            </span>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-0.5">
            {systemActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 min-w-0">
                <span
                  className="size-1.5 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: activityToneDot(item.tone) }}
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <span
                    className="text-[10.5px] text-[#1A1A1A] leading-snug block break-all line-clamp-2"
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
                    <span className="text-[9px] text-[#AAAAAA] truncate min-w-0">
                      {item.meta}
                    </span>
                    <span className="text-[9px] text-[#AAAAAA] shrink-0">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/audit-logs")}
            className="text-[10px] font-medium text-[#534AB7] mt-2 pt-2 border-t border-[#E0E0E0] text-left hover:underline shrink-0"
          >
            View full audit log →
          </button>
        </div>

        {/* System health */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex flex-col h-[220px] min-h-0">
          <span className="text-[12px] font-semibold text-[#1A1A1A] mb-2 shrink-0">
            System health
          </span>
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0">
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
                  <span className="text-[10.5px] text-[#1A1A1A]">
                    {service.label}
                  </span>
                </div>
                <span
                  className={`text-[8px] font-medium px-1.5 py-0.5 rounded-md ${statusBadgeClasses(service.status)}`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0E0E0] mt-2 pt-2 flex flex-col gap-1 shrink-0">
            <span className="text-[10px] font-medium text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded-md text-center">
              {systemUptime.pct} · {systemUptime.period}
            </span>
            <span className="text-[9px] text-[#AAAAAA] text-center">
              {systemUptime.lastChecked}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
