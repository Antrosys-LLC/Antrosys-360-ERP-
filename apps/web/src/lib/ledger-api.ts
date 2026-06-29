import apiClient from '@/lib/api-client';

export interface LedgerSummary {
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  netMovement: number;
  closingBalance: number;
  currencyCode: string;
  pendingReconciliation: number;
}

export interface BudgetVsActualItem {
  id: string;
  name: string;
  percentage: number;
  color: string;
  labelColor: string;
}

export interface MonthlyTrendItem {
  month: string;
  creditHeight: string;
  debitHeight: string;
}

export interface LedgerAccountItem {
  id: string;
  code: string;
  name: string;
}

export interface LedgerEntryItem {
  id: string;
  date: string;
  ref: string;
  description: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
  isVoided: boolean;
  hasFlag: boolean;
  currencyCode: string;
  account: {
    id: string;
    code: string;
    name: string;
  };
}

export interface LedgerEntriesResponse {
  items: LedgerEntryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BudgetTrackerItem {
  id: string;
  label: string;
  percentage: number;
  strokeColor: string;
}

export interface AccountingEquation {
  assets: number;
  liabilities: number;
  equity: number;
  isBalanced: boolean;
}

export async function fetchLedgerSummary(period: string) {
  const { data } = await apiClient.get<{ status: string; data: LedgerSummary }>(
    '/ledger/summary',
    { params: { period } },
  );
  return data.data;
}

export async function fetchLedgerEntries(params: {
  period: string;
  page?: number;
  limit?: number;
  accountId?: string;
  isVoided?: boolean;
  hasFlag?: boolean;
  search?: string;
}) {
  const { data } = await apiClient.get<{ status: string; data: LedgerEntriesResponse }>(
    '/ledger',
    { params },
  );
  return data.data;
}

export async function fetchBudgetVsActual() {
  const { data } = await apiClient.get<{ status: string; data: BudgetVsActualItem[] }>(
    '/ledger/budget-vs-actual',
  );
  return data.data;
}

export async function fetchMonthlyTrend(period: string) {
  const { data } = await apiClient.get<{ status: string; data: MonthlyTrendItem[] }>(
    '/ledger/monthly-trend',
    { params: { period } },
  );
  return data.data;
}

export async function fetchBudgetTrackers() {
  const { data } = await apiClient.get<{ status: string; data: BudgetTrackerItem[] }>(
    '/ledger/budget-trackers',
  );
  return data.data;
}

export async function fetchChartOfAccounts() {
  const { data } = await apiClient.get<{ status: string; data: LedgerAccountItem[] }>(
    '/ledger/chart-of-accounts',
  );
  return data.data;
}

export async function fetchAccountingEquation(period: string) {
  const { data } = await apiClient.get<{ status: string; data: AccountingEquation }>(
    '/ledger/accounting-equation',
    { params: { period } },
  );
  return data.data;
}

export async function createLedgerEntry(payload: {
  date: string;
  ref: string;
  description: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  accountId: string;
  hasFlag?: boolean;
}) {
  const { data } = await apiClient.post('/ledger', payload);
  return data;
}

export async function voidLedgerEntry(entryId: string, reason: string) {
  const { data } = await apiClient.post(`/ledger/${entryId}/void`, { reason });
  return data;
}

export async function updateLedgerEntry(entryId: string, payload: Partial<{
  date: string;
  ref: string;
  description: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  accountId: string;
  hasFlag: boolean;
  isVoided: boolean;
}>) {
  const { data } = await apiClient.patch(`/ledger/${entryId}`, payload);
  return data;
}
