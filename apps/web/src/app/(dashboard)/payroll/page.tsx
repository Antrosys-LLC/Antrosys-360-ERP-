"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Calendar,
  Play,
  Check,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';
import {
  animateRunPayrollSteps,
  approvePayrollLines,
  bulkActionDelay,
  exportPayrollLedger,
  fetchPayrollDashboard,
  fetchPayrollEmployees,
  fetchPayrollPeriods,
  generatePayrollPayslips,
  runPayroll,
  updatePayrollLineStatus,
  updatePayrollPayslipConfig,
  type PayrollDashboardData,
  type PayrollEmployeeRow,
  type PayrollPeriod,
  type PayslipConfig,
} from '@/lib/payroll-api';

type SelectedMap = Record<string, boolean>;

function parseFormattedNumber(val: string) {
  return parseFloat(val.replace(/,/g, '')) || 0;
}

function formatNumber(num: number) {
  return num.toLocaleString('en-US');
}

function mapStatusFilter(statusFilter: string): string | undefined {
  if (statusFilter === 'Processing') return 'PROCESSING';
  if (statusFilter === 'On hold') return 'ON_HOLD';
  if (statusFilter === 'Pending') return 'PENDING';
  if (statusFilter === 'Verified') return 'VERIFIED';
  return undefined;
}

export default function PayrollDashboard() {
  const [dashboard, setDashboard] = useState<PayrollDashboardData | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployeeRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState('');
  const [runLifecycleOverride, setRunLifecycleOverride] = useState<PayrollDashboardData['lifecycle'] | null>(null);
  const [selected, setSelected] = useState<SelectedMap>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [options, setOptions] = useState<PayslipConfig>({
    email: true,
    pdf: true,
    whatsapp: false,
    template: 'standard',
  });

  const payrollIdRef = useRef<string | null>(null);
  const payrollId = dashboard?.payroll?.id ?? null;
  payrollIdRef.current = payrollId;
  const currencyCode = dashboard?.currencyCode ?? 'PKR';

  // Initial load only — never re-run on pagination/filter changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const [dash, periodList] = await Promise.all([
          fetchPayrollDashboard(),
          fetchPayrollPeriods(),
        ]);
        if (cancelled) return;
        setDashboard(dash);
        setSelectedPeriodKey(dash.period.key);
        setPeriods(periodList);
        if (dash.payslipGeneration?.config) {
          setOptions(dash.payslipGeneration.config);
        }
        if (dash.payroll?.id) {
          const empData = await fetchPayrollEmployees(dash.payroll.id, { page: 1, limit: 12 });
          if (!cancelled) {
            setEmployees(empData.items);
            setPagination(empData.pagination);
            setPage(1);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load payroll data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pagination + filters — no full-page loading overlay
  useEffect(() => {
    const id = payrollIdRef.current;
    if (!id || initialLoading) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPayrollEmployees(id, {
          search: search || undefined,
          department: department || undefined,
          status: mapStatusFilter(statusFilter),
          grade: gradeFilter || undefined,
          page,
          limit: 12,
        });
        if (!cancelled) {
          setEmployees(data.items);
          setPagination(data.pagination);
        }
      } catch {
        if (!cancelled) setError('Failed to load employee ledger.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payrollId, page, search, department, statusFilter, gradeFilter, initialLoading]);

  const toggleOption = async (key: keyof PayslipConfig) => {
    const next = { ...options, [key]: !options[key] };
    setOptions(next);
    if (payrollId) {
      try {
        await updatePayrollPayslipConfig(payrollId, next);
      } catch {
        setOptions(options);
      }
    }
  };

  const setTemplate = async (template: 'standard' | 'detailed') => {
    const next = { ...options, template };
    setOptions(next);
    if (payrollId) {
      try {
        await updatePayrollPayslipConfig(payrollId, next);
      } catch {
        /* keep local */
      }
    }
  };

  const handleSelectAll = () => {
    const allSelected = employees.length > 0 && employees.every((emp) => selected[emp.id]);
    const next: SelectedMap = { ...selected };
    for (const emp of employees) {
      next[emp.id] = !allSelected;
    }
    setSelected(next);
  };

  const toggleEmployee = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedEmployees = employees.filter((emp) => selected[emp.id]);
  const pageTotals = {
    baseSalary: formatNumber(
      selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.baseSalary), 0),
    ),
    allowances: formatNumber(
      selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.allowances), 0),
    ),
    deductions: formatNumber(
      selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.deductions), 0),
    ),
    tax: formatNumber(selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.tax), 0)),
    netPay: formatNumber(
      selectedEmployees.reduce((sum, emp) => sum + parseFormattedNumber(emp.netPay), 0),
    ),
  };

  const handleRunPayroll = async () => {
    const period = selectedPeriodKey || dashboard?.period.key;
    if (!period) return;

    setBulkLoading(true);
    setError(null);

    try {
      const runPromise = runPayroll({ period });

      await animateRunPayrollSteps((lifecycle) => {
        setRunLifecycleOverride(lifecycle);
      });

      const dash = await runPromise;
      setRunLifecycleOverride(null);
      setDashboard(dash);
      setSelectedPeriodKey(dash.period.key);
      setPage(1);
      if (dash.payslipGeneration?.config) {
        setOptions(dash.payslipGeneration.config);
      }
      if (dash.payroll?.id) {
        const empData = await fetchPayrollEmployees(dash.payroll.id, { page: 1, limit: 12 });
        setEmployees(empData.items);
        setPagination(empData.pagination);
      }
      setPeriods(await fetchPayrollPeriods());
    } catch (err: unknown) {
      setRunLifecycleOverride(null);
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? 'Payroll already exists for this period.' : 'Failed to run payroll.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApproveLines = async () => {
    if (!payrollId) return;
    const ids = employees.filter((e) => selected[e.id]).map((e) => e.id);
    if (ids.length === 0) return;

    setBulkLoading(true);
    try {
      await bulkActionDelay();
      const dash = await approvePayrollLines(payrollId, ids);
      setDashboard(dash);
    } catch {
      setError('Failed to approve selected employees.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleGeneratePayslips = async (scope: 'all' | 'verified_only') => {
    if (!payrollId) return;
    setBulkLoading(true);
    try {
      await bulkActionDelay();
      const result = await generatePayrollPayslips(payrollId, scope);
      setDashboard(result.dashboard);
    } catch {
      setError('Failed to generate payslips.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    if (!payrollId) return;
    try {
      await exportPayrollLedger(payrollId);
    } catch {
      setError('Failed to export payroll ledger.');
    }
  };

  const handlePeriodChange = async (periodKey: string) => {
    if (periodKey === selectedPeriodKey) return;
    setSelectedPeriodKey(periodKey);
    setPage(1);
    setError(null);
    setRunLifecycleOverride(null);

    try {
      const dash = await fetchPayrollDashboard({ period: periodKey });
      setDashboard(dash);
      if (dash.payslipGeneration?.config) {
        setOptions(dash.payslipGeneration.config);
      }
      if (dash.payroll?.id) {
        const empData = await fetchPayrollEmployees(dash.payroll.id, { page: 1, limit: 12 });
        setEmployees(empData.items);
        setPagination(empData.pagination);
      } else {
        setEmployees([]);
        setPagination({ page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch {
      setError('Failed to load payroll for selected period.');
    }
  };

  if (initialLoading && !dashboard) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  const lifecycle = runLifecycleOverride ?? dashboard?.lifecycle;
  const metrics = dashboard?.metrics;
  const payslipGen = dashboard?.payslipGeneration;
  const periodLabel =
    periods.find((p) => p.key === selectedPeriodKey)?.label ?? dashboard?.period.label ?? '—';

  return (
    <div className="bg-[#F8F9FC] min-h-screen text-[#1A1A1A] antialiased">
      <main className="max-w-[1360px] mx-auto p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="pt-1">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-950 flex items-center gap-1.5">
                Payroll <span className="text-gray-300 font-light">•</span> {periodLabel}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">
                {dashboard?.employeeCount ?? 0} employees · {currencyCode} cycle
              </p>
            </div>

            <div className="flex flex-col items-end gap-3.5">
              <div className="relative">
                <select
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white border border-[#EBECEF] pl-8 pr-3 py-1.5 rounded-[6px] shadow-sm appearance-none cursor-pointer min-w-[140px]"
                  value={selectedPeriodKey}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  disabled={bulkLoading}
                >
                  {periods.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={handleRunPayroll}
                disabled={bulkLoading || !!payrollId}
                className="bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white px-4 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm tracking-wide min-w-[120px] justify-center"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current stroke-none" />
                )}
                Run payroll
              </button>
            </div>
          </div>
          <div className="h-[1px] bg-gray-200/60 w-full mt-3.5" />
        </div>

        {/* Progress stepper */}
        <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm relative">
          <div className="relative flex justify-between items-center max-w-[920px] mx-auto pt-1">
            <div className="absolute left-[30px] right-[30px] top-[14px] h-[3px] bg-gray-100 z-0" />
            <div
              className="absolute left-[30px] top-[14px] h-[3px] bg-[#10B981] z-0 transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(lifecycle?.progressPct ?? 0, 100)}%`,
                maxWidth: 'calc(100% - 60px)',
              }}
            />

            {(lifecycle?.steps ?? []).map((step, idx) => (
              <div key={idx} className="flex flex-col items-center relative z-10 w-24">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${step.status === 'complete' ? 'bg-[#10B981] text-white' : ''}
                  ${step.status === 'current' ? 'bg-[#EEEEFF] border border-[#6366F1] text-[#6366F1] shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : ''}
                  ${step.status === 'upcoming' ? 'bg-white text-gray-300 border-2 border-gray-150' : ''}
                `}
                >
                  {step.status === 'complete' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : step.status === 'current' ? (
                    bulkLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6366F1]" />
                    ) : (
                      <div className="w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center">
                        <Play className="w-2 h-2 fill-white stroke-none ml-0.5" />
                      </div>
                    )
                  ) : (
                    <span className="text-gray-400 font-medium">{step.step}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium whitespace-nowrap tracking-tight
                  ${step.status === 'current' ? 'text-gray-950 font-bold' : 'text-gray-400'}
                `}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-4 font-normal">
            {bulkLoading && runLifecycleOverride ? (
              <>Running payroll cycle for selected period…</>
            ) : (
              <>
                System is currently processing calculations for{' '}
                <span className="font-semibold text-gray-700">
                  {lifecycle?.activeProcessingCount ?? 0}
                </span>{' '}
                active personnel records.
              </>
            )}
          </p>
        </section>

        {/* KPI widgets */}
        {metrics ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Total Gross Pay
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
                    {metrics.totalGross.amount}
                  </h2>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium mb-1.5 px-0.5">
                    {metrics.totalGross.breakdown.map((bar, i) => (
                      <span key={i}>{bar.label}</span>
                    ))}
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full flex overflow-hidden">
                    {metrics.totalGross.breakdown.map((bar, i) => (
                      <div
                        key={i}
                        style={{ width: `${bar.percentage}%` }}
                        className={`${bar.color} h-full`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Total Deductions
                  </span>
                  <h2 className="text-2xl font-bold text-[#D97706] tracking-tight mt-0.5">
                    {metrics.totalDeductions.amount}
                  </h2>
                </div>
                <div className="space-y-1.5 mt-2">
                  {metrics.totalDeductions.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs border-b border-gray-100/70 pb-1 last:border-0 last:pb-0"
                    >
                      <span className="text-gray-400 font-normal">{item.label}</span>
                      <span className="font-bold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm min-h-[160px] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Net Payroll
                  </span>
                  <h2 className="text-2xl font-bold text-[#10B981] tracking-tight">
                    {metrics.netPayroll.amount}
                  </h2>
                  <p className="text-[11px] text-gray-400 pt-0.5 font-normal">Net/Gross Ratio</p>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-gray-100"
                      strokeWidth="3"
                      strokeDasharray="6,1.8"
                      stroke="currentColor"
                      fill="none"
                      r="14"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-[#10B981]"
                      strokeWidth="3"
                      strokeDasharray={`${metrics.netPayroll.netToGrossRatioPct * 0.88},100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      r="14"
                      cx="18"
                      cy="18"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {metrics.netPayroll.netToGrossRatioPct}%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#EBECEF] rounded-[10px] p-4 shadow-sm">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Employer Liability
              </span>
              <h2 className="text-xl font-bold text-red-700 mt-0.5">
                {metrics.employerLiability.amount}
              </h2>
              <div className="flex items-center gap-1 text-gray-400 text-[11px] mt-1.5 font-normal">
                <Info className="w-3.5 h-3.5" />
                <span>{metrics.employerLiability.note}</span>
              </div>
            </section>
          </>
        ) : (
          <section className="bg-white border border-[#EBECEF] rounded-[10px] p-8 shadow-sm text-center">
            <p className="text-sm text-gray-500">
              No payroll batch for this period. Click <strong>Run payroll</strong> to start.
            </p>
          </section>
        )}

        {payrollId && (
          <>
            <section className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#EBECEF] rounded-[10px] p-2.5 shadow-sm">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative w-full max-w-xs">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-[#F8F9FC] text-xs pl-9 pr-4 py-1.5 border border-[#E5E7EB] rounded-[6px] placeholder-gray-400 focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-[#E5E7EB] rounded-[6px] text-xs px-2.5 py-1.5 text-gray-600 focus:outline-none focus:border-[#6366F1] cursor-pointer"
                >
                  <option value="">Department</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Ops">Ops</option>
                  <option value="Finance">Finance</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-[#E5E7EB] rounded-[6px] text-xs px-2.5 py-1.5 text-gray-600 focus:outline-none focus:border-[#6366F1] cursor-pointer"
                >
                  <option value="">Status</option>
                  <option value="Processing">Processing</option>
                  <option value="On hold">On hold</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                </select>
                <select
                  value={gradeFilter}
                  onChange={(e) => {
                    setGradeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-[#E5E7EB] rounded-[6px] text-xs px-2.5 py-1.5 text-gray-600 focus:outline-none focus:border-[#6366F1] cursor-pointer"
                >
                  <option value="">Grade</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                  <option value="L4">L4</option>
                  <option value="L5">L5</option>
                </select>
                <button className="p-1.5 border border-[#E5E7EB] rounded-[6px] bg-white hover:bg-gray-50 text-gray-500 transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                  Export
                </button>
                <button
                  onClick={handleApproveLines}
                  disabled={bulkLoading || selectedEmployees.length === 0}
                  className="bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-[#6366F1] px-3.5 py-1.5 rounded-[6px] text-xs font-semibold tracking-wide transition-colors"
                >
                  Approve & process
                </button>
              </div>
            </section>

            <section className="bg-white border border-[#EBECEF] rounded-[10px] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#EBECEF]">
                <h3 className="text-sm font-bold text-gray-900">Payroll run · {periodLabel}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {pagination.total} employees · {dashboard?.payroll?.netPayrollCompact} net
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FC] border-b border-[#EBECEF] text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={employees.length > 0 && employees.every((emp) => selected[emp.id])}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1] cursor-pointer"
                        />
                      </th>
                      <th className="p-4 font-bold">Employee</th>
                      <th className="p-4 font-bold">Dept</th>
                      <th className="p-4 font-bold">Grade</th>
                      <th className="p-4 font-bold text-right">Base Salary</th>
                      <th className="p-4 font-bold text-right">Allowances</th>
                      <th className="p-4 font-bold text-right">Deductions</th>
                      <th className="p-4 font-bold text-right">Tax</th>
                      <th className="p-4 font-bold text-right">Net Pay</th>
                      <th className="p-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium">
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={`hover:bg-[#F8F9FC]/50 transition-colors ${selected[emp.id] ? 'bg-indigo-50/40' : ''}`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!selected[emp.id]}
                            onChange={() => toggleEmployee(emp.id)}
                            className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1] cursor-pointer"
                          />
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full ${emp.avatarBg} flex items-center justify-center font-bold text-[10px] flex-shrink-0`}
                          >
                            {emp.initials}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{emp.employeeCode}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 font-normal">{emp.dept}</td>
                        <td className="p-4 text-gray-400 font-normal">{emp.grade}</td>
                        <td className="p-4 text-right text-gray-700">
                          {currencyCode} {emp.baseSalary}
                        </td>
                        <td className="p-4 text-right text-gray-700">
                          {currencyCode} {emp.allowances}
                        </td>
                        <td className="p-4 text-right text-amber-600">
                          {currencyCode} {emp.deductions}
                        </td>
                        <td className="p-4 text-right text-amber-600">
                          {currencyCode} {emp.tax}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600">
                          {currencyCode} {emp.netPay}
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={emp.statusCode}
                            onChange={async (e) => {
                              if (!payrollId) return;
                              await updatePayrollLineStatus(payrollId, emp.id, {
                                status: e.target.value,
                              });
                              const empData = await fetchPayrollEmployees(payrollId, {
                                search: search || undefined,
                                department: department || undefined,
                                status: mapStatusFilter(statusFilter),
                                grade: gradeFilter || undefined,
                                page,
                                limit: 12,
                              });
                              setEmployees(empData.items);
                              setPagination(empData.pagination);
                              const dash = await fetchPayrollDashboard({
                                period: selectedPeriodKey,
                              });
                              setDashboard(dash);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border-0 cursor-pointer
                              ${emp.status === 'Processing' ? 'bg-purple-50 text-[#6366F1]' : ''}
                              ${emp.status === 'On hold' ? 'bg-red-50 text-red-500' : ''}
                              ${emp.status === 'Pending' ? 'bg-amber-50 text-amber-600' : ''}
                              ${emp.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : ''}
                            `}
                          >
                            <option value="PROCESSING">Processing</option>
                            <option value="ON_HOLD">On hold</option>
                            <option value="PENDING">Pending</option>
                            <option value="VERIFIED">Verified</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-[#F8F9FC]/60 font-bold border-t border-gray-200 text-gray-900">
                      <td className="p-4" />
                      <td colSpan={3} className="p-4 font-bold text-gray-900">
                        Page Totals (Selected)
                      </td>
                      <td className="p-4 text-right">
                        {currencyCode} {pageTotals.baseSalary}
                      </td>
                      <td className="p-4 text-right">
                        {currencyCode} {pageTotals.allowances}
                      </td>
                      <td className="p-4 text-right text-amber-600">
                        {currencyCode} {pageTotals.deductions}
                      </td>
                      <td className="p-4 text-right text-amber-600">
                        {currencyCode} {pageTotals.tax}
                      </td>
                      <td className="p-4 text-right text-emerald-600 text-sm font-extrabold">
                        {currencyCode} {pageTotals.netPay}
                      </td>
                      <td className="p-4" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>
                  {pagination.total === 0
                    ? 'No employees'
                    : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )} of ${pagination.total} employees`}
                </span>
                <div className="flex items-center gap-4 text-gray-600">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-50 rounded disabled:opacity-40"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-gray-800">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-50 rounded disabled:opacity-40"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#EBECEF] rounded-[10px] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-gray-900">Payslip generation</h3>
                <span className="bg-[#EEEBFF] text-[#6366F1] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {payslipGen?.totalToGenerate ?? 0} payslips to generate
                </span>
              </div>

              <div className="h-[1px] bg-gray-100 w-full mb-4" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-gray-100 pb-5 mb-5">
                <div className="lg:col-span-4 space-y-3.5">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
                    Options
                  </span>
                  {(
                    [
                      { id: 'email' as const, label: 'Email payslips' },
                      { id: 'pdf' as const, label: 'Generate PDF' },
                      { id: 'whatsapp' as const, label: 'WhatsApp notification' },
                    ] as const
                  ).map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between max-w-xs">
                      <span
                        className={`text-xs font-medium transition-colors duration-200 ${options[opt.id] ? 'text-gray-700' : 'text-gray-500'}`}
                      >
                        {opt.label}
                      </span>
                      <div
                        onClick={() => toggleOption(opt.id)}
                        className={`w-8 h-4.5 rounded-full p-0.5 cursor-pointer flex items-center transition-all duration-200
                          ${options[opt.id] ? 'bg-[#6366F1] justify-end' : 'bg-gray-200 justify-start'}
                        `}
                      >
                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-4 lg:border-l lg:border-r lg:border-gray-150 lg:px-6">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block mb-3">
                    Templates
                  </span>
                  <div className="flex items-center gap-3">
                    {(['standard', 'detailed'] as const).map((tpl) => (
                      <div
                        key={tpl}
                        onClick={() => setTemplate(tpl)}
                        className={`rounded-[8px] p-3 w-[130px] h-[85px] cursor-pointer flex flex-col justify-between transition-all duration-150
                          ${options.template === tpl
                            ? 'border-2 border-[#6366F1] bg-[#F5F4FF]'
                            : 'border border-gray-200 bg-white opacity-60 hover:opacity-90'
                          }`}
                      >
                        <span
                          className={`text-[11px] font-bold block capitalize ${options.template === tpl ? 'text-[#6366F1]' : 'text-gray-600'}`}
                        >
                          {tpl}
                        </span>
                        <div className="space-y-1.5 mb-1">
                          <div
                            className={`h-1 w-16 rounded-full ${options.template === tpl ? 'bg-[#DCD8FF]' : 'bg-gray-300'}`}
                          />
                          <div
                            className={`h-1 w-24 rounded-full ${options.template === tpl ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`}
                          />
                          <div
                            className={`h-1 w-10 rounded-full ${options.template === tpl ? 'bg-[#EBE9FF]' : 'bg-gray-200'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 flex items-center gap-6 justify-center lg:justify-start">
                  <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        className="text-gray-100"
                        strokeWidth="3"
                        strokeDasharray="6,1.8"
                        stroke="currentColor"
                        fill="none"
                        r="14"
                        cx="18"
                        cy="18"
                      />
                      <circle
                        className="text-[#6366F1]"
                        strokeWidth="3"
                        strokeDasharray={`${(payslipGen?.progressPct ?? 0) * 0.88},100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        r="14"
                        cx="18"
                        cy="18"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-gray-900">
                        {payslipGen?.progressPct ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs min-w-[160px]">
                    <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block mb-1">
                      Status
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-normal">Data verified</span>
                      <span className="font-bold text-gray-900">
                        {payslipGen?.verified ?? 0}/{payslipGen?.totalToGenerate ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-normal">On hold</span>
                      <span className="font-bold text-red-500">{payslipGen?.onHold ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-normal">Pending</span>
                      <span className="font-bold text-amber-500">{payslipGen?.pending ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleGeneratePayslips('all')}
                  disabled={bulkLoading}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white px-4 py-2 rounded-[4px] text-xs font-semibold tracking-wide transition-colors shadow-sm"
                >
                  Generate all payslips
                </button>
                <button
                  onClick={() => handleGeneratePayslips('verified_only')}
                  disabled={bulkLoading}
                  className="bg-[#EEF0FF] hover:bg-indigo-100 disabled:opacity-60 text-[#6366F1] px-4 py-2 rounded-[4px] text-xs font-semibold tracking-wide transition-colors"
                >
                  Generate for verified only ({payslipGen?.verified ?? 0})
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
