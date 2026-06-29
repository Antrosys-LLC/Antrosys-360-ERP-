import { APP_DEFAULT_CURRENCY } from './currency-catalog';

export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = APP_DEFAULT_CURRENCY,
): string {
  const code = currencyCode.toUpperCase();
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${code} ${formatted}`;
}

export function formatCurrencyCompact(
  amount: number,
  currencyCode: string = APP_DEFAULT_CURRENCY,
): string {
  const code = currencyCode.toUpperCase();
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${code} ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${code} ${Math.round(amount / 1_000)}K`;
  }
  return formatCurrencyAmount(amount, code);
}
