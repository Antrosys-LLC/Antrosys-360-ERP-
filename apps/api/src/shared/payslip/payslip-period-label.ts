/** Display label for a payslip period — always derived from `periodStart`, not DB `periodLabel`. */
export function payslipPeriodLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
