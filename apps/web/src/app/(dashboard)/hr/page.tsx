"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  Users,
  Rocket,
  TrendingDown,
  Plus,
  FileText,
  UserPlus,
  MoreHorizontal,
  ChevronDown,
  Download,
  Bell,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  exportHrDashboard,
  fetchHrDashboard,
  fetchHrEmployeeOptions,
  generateHrLetter,
  startOnboarding,
  type HrLetterType,
} from "@/lib/hr-api";

const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: "bg-[#7B68EE]",
  Operations: "bg-[#EEEDFE]",
  Sales: "bg-[#633806]",
  Finance: "bg-[#791F1F]",
  HR: "bg-[#0C447C]",
  Other: "bg-[#F1EFE8]",
};

const LETTER_TYPES: { value: HrLetterType; label: string }[] = [
  { value: "OFFER", label: "Offer letter" },
  { value: "APPOINTMENT", label: "Appointment letter" },
  { value: "EXPERIENCE", label: "Experience certificate" },
  { value: "SALARY_CERTIFICATE", label: "Salary certificate" },
  { value: "OTHER", label: "Other" },
];

function buildMonthOptions() {
  const options: { month: number; year: number; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    options.push({
      month: d.getUTCMonth() + 1,
      year: d.getUTCFullYear(),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return options;
}

const getSemanticStyle = (type: string) => {
  switch (type) {
    case "success":
      return "bg-[#EAF3DE] text-[#27500A]";
    case "warning":
      return "bg-[#FAEEDA] text-[#633806]";
    case "danger":
      return "bg-[#FCEBEB] text-[#791F1F]";
    case "info":
      return "bg-[#E6F1FB] text-[#0C447C]";
    default:
      return "bg-[#F1EFE8] text-[#444441]";
  }
};

const getStatusPillStyle = (status: string) => {
  const norm = status.toLowerCase();
  if (norm.includes("onboarding")) return getSemanticStyle("warning");
  if (norm.includes("active")) return getSemanticStyle("success");
  if (norm.includes("offer")) return getSemanticStyle("info");
  return getSemanticStyle("neutral");
};

const KPI_ICONS = [Briefcase, Users, Rocket, TrendingDown];

export default function HRDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canWrite = usePermission("hr:write");

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(monthOptions[0]);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [letterOpen, setLetterOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [letterEmployeeId, setLetterEmployeeId] = useState("");
  const [letterType, setLetterType] = useState<HrLetterType>("OFFER");
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState("");
  const [onboardingStartDate, setOnboardingStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-dashboard", selectedPeriod.month, selectedPeriod.year],
    queryFn: () => fetchHrDashboard(selectedPeriod.month, selectedPeriod.year),
  });

  const { data: employeeOptions = [] } = useQuery({
    queryKey: ["hr-employee-options"],
    queryFn: () => fetchHrEmployeeOptions("ALL"),
    enabled: letterOpen || onboardingOpen,
  });

  const userInitials = useMemo(() => {
    const name = session?.user?.name ?? "AM";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [session?.user?.name]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportHrDashboard(selectedPeriod.month, selectedPeriod.year);
      toast({ title: "Export complete", description: "HR dashboard CSV downloaded." });
    } catch {
      toast({ title: "Export failed", description: "Could not download the report.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!letterEmployeeId) {
      toast({ title: "Select an employee", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const result = await generateHrLetter({ employeeId: letterEmployeeId, type: letterType });
      toast({
        title: "HR letter sent",
        description: `PDF emailed to ${result.recipientEmail}${result.mailMode === "console" ? " (dev console log)" : ""}.`,
      });
      setLetterOpen(false);
      setLetterEmployeeId("");
    } catch {
      toast({ title: "Failed to generate letter", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!onboardingEmployeeId) {
      toast({ title: "Select an employee", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const result = await startOnboarding({
        employeeId: onboardingEmployeeId,
        startDate: onboardingStartDate,
      });
      toast({
        title: "Onboarding started",
        description: `${result.employeeName} is now in the onboarding pipeline.`,
      });
      setOnboardingOpen(false);
      setOnboardingEmployeeId("");
      queryClient.invalidateQueries({ queryKey: ["hr-dashboard"] });
    } catch {
      toast({ title: "Failed to start onboarding", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const kpis = data?.kpis ?? [];
  const funnelRows = data?.funnel.rows ?? [];
  const funnelMetrics = data?.funnel.metrics ?? [];
  const departmentHeadcount = data?.departmentHeadcount ?? [];
  const genderSplit = data?.genderSplit ?? { male: 0, female: 0, other: 0 };
  const recentHires = data?.recentHires ?? [];
  const applicantCount = data?.applicantCount ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 text-[#1A1A1A] font-sans antialiased">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">People overview</h1>
          <p className="text-[12px] text-[#888] font-normal">
            {data?.periodLabel ?? selectedPeriod.label} - HR & Talent view
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((o) => !o)}
              className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#7B68EE]" />
              <span>{selectedPeriod.label}</span>
              <ChevronDown className="w-4 h-4 text-[#888]" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-[38px] z-20 min-w-[180px] bg-white border border-[#E0E0E0] rounded-[7px] shadow-lg py-1">
                {monthOptions.map((opt) => (
                  <button
                    key={`${opt.year}-${opt.month}`}
                    onClick={() => {
                      setSelectedPeriod(opt);
                      setPeriodOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F8F9FC] text-[#333]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || isLoading}
            className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#534AB7] hover:bg-[#F8F9FC] transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export</span>
          </button>

          <button
            onClick={() => router.push("/hr/recruitment")}
            className="h-[34px] px-4 flex items-center gap-2 bg-[#7B68EE] text-white rounded-[7px] text-[14px] font-medium hover:bg-[#6A5ACD] transition-colors"
          >
            <span>Post job</span>
          </button>

          <button className="w-[34px] h-[34px] flex items-center justify-center border border-[#E0E0E0] bg-white rounded-[7px] text-[#333] hover:bg-[#F8F9FC]">
            <Bell className="w-4 h-4" />
          </button>

          <div className="w-[34px] h-[34px] bg-[#EEEDFE] rounded-full flex items-center justify-center text-[13px] font-semibold text-[#534AB7]">
            {userInitials}
          </div>
        </div>
      </header>

      {isError && (
        <div className="mb-4 p-3 bg-[#FCEBEB] text-[#791F1F] rounded-[7px] text-[13px] flex items-center justify-between">
          <span>Failed to load HR dashboard data.</span>
          <button onClick={() => refetch()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(isLoading ? KPI_ICONS.map((_, idx) => ({ title: "...", value: "—", metricText: "Loading", metricType: "info", icon: KPI_ICONS[idx] })) : kpis.map((kpi, idx) => ({ ...kpi, icon: KPI_ICONS[idx] }))).map((kpi, idx) => {
          const Icon = kpi.icon ?? KPI_ICONS[idx];
          return (
            <div key={idx} className="bg-[#EEEDFE] rounded-[10px] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-[#888] uppercase">{kpi.title}</span>
                <Icon className="w-4 h-4 text-[#534AB7]" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[28px] font-semibold leading-none">{kpi.value}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getSemanticStyle(kpi.metricType)}`}>
                  {kpi.metricText}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-semibold">Recruitment funnel</h2>
              <button className="text-[#Muted] hover:text-[#1A1A1A]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {(funnelRows.length ? funnelRows : [{ label: "—", count: 0, percentage: 0, color: "bg-[#F0F0F0]" }]).map((row, idx) => (
                <div key={idx} className="flex items-center text-[14px]">
                  <div className="w-24 text-[#333] text-right pr-4 text-[13px]">{row.label}</div>
                  <div className="flex-1 bg-[#F0F0F0] h-[28px] rounded-[4px] overflow-hidden relative">
                    <div className={`${row.color} h-full rounded-[4px]`} style={{ width: `${row.percentage}%` }} />
                  </div>
                  <div className="w-12 text-right font-medium text-[#1A1A1A] pl-4">{row.count}</div>
                  <div className="w-12 text-right text-[12px] text-[#888] pl-2">{row.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-[#E0E0E0]">
            {funnelMetrics.map((metric, idx) => (
              <div key={idx} className="text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-wider text-[#888] font-semibold mb-1">{metric.label}</p>
                <p className={`text-[16px] font-semibold ${metric.highlight || "text-[#1A1A1A]"}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between gap-6">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-semibold">Headcount by department</h2>
              <button className="text-[#Muted] hover:text-[#1A1A1A]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {departmentHeadcount.map((dept, idx) => (
                <div key={idx} className="flex items-center text-[13px]">
                  <div className="w-20 text-[#333]">{dept.name}</div>
                  <div className="flex-1 bg-[#F0F0F0] h-[7px] rounded-full mx-3 overflow-hidden">
                    <div
                      className={`${DEPARTMENT_COLORS[dept.name] ?? "bg-[#F1EFE8]"} h-full rounded-full`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                  <div className="w-6 text-right font-medium text-[#1A1A1A]">{dept.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E0E0E0]">
            <p className="text-[11px] uppercase tracking-wider text-[#888] font-semibold mb-2">Gender split</p>
            <div className="w-full h-[10px] bg-[#F0F0F0] rounded-full overflow-hidden flex mb-3">
              <div className="bg-[#7B68EE] h-full" style={{ width: `${genderSplit.male}%` }} />
              <div className="bg-[#EEEDFE] h-full" style={{ width: `${genderSplit.female}%` }} />
              <div className="bg-[#F1EFE8] h-full" style={{ width: `${genderSplit.other}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#888]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7B68EE]" /> Male{" "}
                <span className="font-semibold text-[#333]">{genderSplit.male}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EEEDFE]" /> Female{" "}
                <span className="font-semibold text-[#333]">{genderSplit.female}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F1EFE8]" /> Other{" "}
                <span className="font-semibold text-[#333]">{genderSplit.other}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <h2 className="text-[16px] font-semibold mb-4">Quick actions</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/hr/recruitment")}
              className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors"
            >
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <Plus className="w-4 h-4" />
                <span className="text-[#333] font-medium">Post job</span>
              </div>
            </button>

            <button
              onClick={() => router.push("/hr/recruitment")}
              className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors"
            >
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <Users className="w-4 h-4" />
                <span className="text-[#333] font-medium">View applicants</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7B68EE] text-white">{applicantCount}</span>
            </button>

            <button
              onClick={() => canWrite && setLetterOpen(true)}
              disabled={!canWrite}
              className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <FileText className="w-4 h-4" />
                <span className="text-[#333] font-medium">Generate HR letter</span>
              </div>
            </button>

            <button
              onClick={() => canWrite && setOnboardingOpen(true)}
              disabled={!canWrite}
              className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <UserPlus className="w-4 h-4" />
                <span className="text-[#333] font-medium">Start onboarding</span>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-semibold">Recent hires</h2>
              <button
                onClick={() => router.push("/hr/employees")}
                className="text-[12px] text-[#534AB7] font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#E0E0E0]">
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Name</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Role</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Status</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Start date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {(recentHires.length ? recentHires : [{ name: "—", role: "—", status: "—", date: "—" }]).map((hire, idx) => (
                    <tr key={idx} className="hover:bg-[#F8F9FC]/50 transition-colors">
                      <td className="p-3 text-[14px] font-semibold text-[#1A1A1A]">{hire.name}</td>
                      <td className="p-3 text-[14px] text-[#333]">{hire.role}</td>
                      <td className="p-3">
                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${getStatusPillStyle(hire.status)}`}>
                          {hire.status}
                        </span>
                      </td>
                      <td className="p-3 text-[13px] text-[#888]">{hire.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate HR letter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12px] font-medium text-[#888] uppercase tracking-wider">Employee</label>
              <select
                value={letterEmployeeId}
                onChange={(e) => setLetterEmployeeId(e.target.value)}
                className="mt-1 w-full h-[38px] border border-[#E0E0E0] rounded-[7px] px-3 text-[14px]"
              >
                <option value="">Select employee</option>
                {employeeOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#888] uppercase tracking-wider">Letter type</label>
              <select
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as HrLetterType)}
                className="mt-1 w-full h-[38px] border border-[#E0E0E0] rounded-[7px] px-3 text-[14px]"
              >
                {LETTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleGenerateLetter}
              disabled={submitting}
              className="h-[36px] px-4 bg-[#7B68EE] text-white rounded-[7px] text-[14px] font-medium hover:bg-[#6A5ACD] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate &amp; send PDF
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start onboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12px] font-medium text-[#888] uppercase tracking-wider">Employee</label>
              <select
                value={onboardingEmployeeId}
                onChange={(e) => setOnboardingEmployeeId(e.target.value)}
                className="mt-1 w-full h-[38px] border border-[#E0E0E0] rounded-[7px] px-3 text-[14px]"
              >
                <option value="">Select employee</option>
                {employeeOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#888] uppercase tracking-wider">Start date</label>
              <input
                type="date"
                value={onboardingStartDate}
                onChange={(e) => setOnboardingStartDate(e.target.value)}
                className="mt-1 w-full h-[38px] border border-[#E0E0E0] rounded-[7px] px-3 text-[14px]"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleStartOnboarding}
              disabled={submitting}
              className="h-[36px] px-4 bg-[#7B68EE] text-white rounded-[7px] text-[14px] font-medium hover:bg-[#6A5ACD] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Start onboarding
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
