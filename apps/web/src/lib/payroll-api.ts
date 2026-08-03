import apiClient from '@/lib/api-client';

export type LifecycleStepStatus = 'complete' | 'current' | 'upcoming';
export type PayslipTemplate = 'standard' | 'detailed';

export interface PayrollLifecycleStep {
  step: number;
  label: string;
  status: LifecycleStepStatus;
}

export interface PayrollDashboardData {
  period: {
    key: string;
    label: string;
    start: string;
    end: string;
  };
  currencyCode: string;
  employeeCount: number;
  lifecycle: {
    steps: PayrollLifecycleStep[];
    progressPct: number;
    activeProcessingCount: number;
  };
  metrics: {
    totalGross: {
      amount: string;
      breakdown: { label: string; percentage: number; color: string }[];
    };
    totalDeductions: {
      amount: string;
      items: { label: string; value: string }[];
    };
    netPayroll: {
      amount: string;
      netToGrossRatioPct: number;
    };
    employerLiability: {
      amount: string;
      note: string;
    };
  } | null;
  payslipGeneration: {
    totalToGenerate: number;
    progressPct: number;
    verified: number;
    onHold: number;
    pending: number;
    config: {
      email: boolean;
      pdf: boolean;
      whatsapp: boolean;
      template: PayslipTemplate;
    };
  };
  payroll: {
    id: string;
    batchNumber: string;
    status: string;
    lifecycleStep: string;
    netPayrollCompact: string;
  } | null;
}

export interface PayrollEmployeeRow {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  initials: string;
  avatarBg: string;
  dept: string;
  grade: string;
  baseSalary: string;
  allowances: string;
  deductions: string;
  tax: string;
  netPay: string;
  status: string;
  statusCode: string;
}

export interface PayrollEmployeesData {
  items: PayrollEmployeeRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currencyCode: string;
}

export interface PayrollPeriod {
  key: string;
  label: string;
  payrollId: string | null;
  batchNumber: string | null;
  status: string;
}

export interface PayslipConfig {
  email: boolean;
  pdf: boolean;
  whatsapp: boolean;
  template: PayslipTemplate;
}

function unwrap<T>(data: { status: string; data: T }): T {
  if (data.status !== 'success') {
    throw new Error('API returned non-success status');
  }
  return data.data;
}

export async function fetchPayrollDashboard(params?: { period?: string; payrollId?: string }) {
  const { data } = await apiClient.get<{ status: string; data: PayrollDashboardData }>(
    '/payroll/dashboard',
    { params },
  );
  return unwrap(data);
}

export async function fetchPayrollPeriods() {
  const { data } = await apiClient.get<{ status: string; data: PayrollPeriod[] }>('/payroll/periods');
  return unwrap(data);
}

export async function fetchPayrollEmployees(
  payrollId: string,
  params?: {
    search?: string;
    department?: string;
    status?: string;
    grade?: string;
    page?: number;
    limit?: number;
  },
) {
  const { data } = await apiClient.get<{ status: string; data: PayrollEmployeesData }>(
    `/payroll/${payrollId}/employees`,
    { params },
  );
  return unwrap(data);
}

export async function runPayroll(body?: { period?: string }) {
  const { data } = await apiClient.post<{ status: string; data: PayrollDashboardData }>(
    '/payroll/run',
    body ?? {},
  );
  return unwrap(data);
}

export async function updatePayrollLineStatus(
  payrollId: string,
  lineItemId: string,
  body: { status: string; holdReason?: string },
) {
  const { data } = await apiClient.patch<{ status: string; data: unknown }>(
    `/payroll/${payrollId}/employees/${lineItemId}`,
    body,
  );
  return unwrap(data);
}

export async function approvePayrollLines(payrollId: string, lineItemIds: string[]) {
  const { data } = await apiClient.post<{ status: string; data: PayrollDashboardData }>(
    `/payroll/${payrollId}/approve-lines`,
    { lineItemIds },
  );
  return unwrap(data);
}

export async function submitPayrollForApproval(payrollId: string) {
  const { data } = await apiClient.post<{ status: string; data: PayrollDashboardData }>(
    `/payroll/${payrollId}/submit`,
  );
  return unwrap(data);
}

export async function disbursePayroll(payrollId: string) {
  const { data } = await apiClient.post<{ status: string; data: PayrollDashboardData }>(
    `/payroll/${payrollId}/disburse`,
  );
  return unwrap(data);
}

export async function updatePayrollPayslipConfig(payrollId: string, config: PayslipConfig) {
  const { data } = await apiClient.patch<{ status: string; data: PayslipConfig }>(
    `/payroll/${payrollId}/payslip-config`,
    config,
  );
  return unwrap(data);
}

export async function generatePayrollPayslips(
  payrollId: string,
  scope: 'all' | 'verified_only' = 'verified_only',
) {
  const { data } = await apiClient.post<{
    status: string;
    data: { generated: number; skipped: number; progressPct: number; dashboard: PayrollDashboardData };
  }>(`/payroll/${payrollId}/generate-payslips`, { scope });
  return unwrap(data);
}

export async function exportPayrollLedger(payrollId: string) {
  const response = await apiClient.get(`/payroll/${payrollId}/export`, {
    responseType: 'blob',
  });
  const blob = response.data as Blob;
  const disposition = response.headers?.['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?(.+?)"?$/);
  const filename = match?.[1] ?? `payroll-export.csv`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** UX micro-delay for bulk actions (2–3s). Individual CRUD stays instant. */
export function bulkActionDelay(ms = 2500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RUN_STEP_LABELS = [
  'Data collection',
  'Review & verify',
  'Payroll run',
  'CFO approval',
  'Disbursement',
];

export const RUN_PAYROLL_STEP_MS = 800;

/** Step-by-step lifecycle animation while run-payroll API executes. */
export async function animateRunPayrollSteps(
  onUpdate: (lifecycle: PayrollDashboardData['lifecycle']) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (let i = 0; i < RUN_STEP_LABELS.length; i++) {
    if (signal?.aborted) return;
    onUpdate({
      steps: RUN_STEP_LABELS.map((label, idx) => ({
        step: idx + 1,
        label,
        status: idx < i ? 'complete' : idx === i ? 'current' : 'upcoming',
      })),
      progressPct: Math.round(((i + 0.45) / RUN_STEP_LABELS.length) * 100),
      activeProcessingCount: i === 2 ? 1 : 0,
    });
    await new Promise((resolve) => setTimeout(resolve, RUN_PAYROLL_STEP_MS));
  }
}
