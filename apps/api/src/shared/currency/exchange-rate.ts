import { redis } from '../../config/redis';
import { SUPPORTED_CURRENCIES } from './currency-constants';

export { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from './currency-constants';
export type { SupportedCurrency } from './currency-constants';

const CACHE_KEY = 'exchange-rates:USD';
const CACHE_TTL_SECONDS = 3600;

type FrankfurterResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

async function fetchLiveRates(): Promise<Record<string, number>> {
  const symbols = SUPPORTED_CURRENCIES.filter((c) => c !== 'USD').join(',');
  const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${symbols}`);

  if (!response.ok) {
    throw new Error(`Exchange rate API failed: ${response.status}`);
  }

  const data = (await response.json()) as FrankfurterResponse;
  return { USD: 1, ...data.rates };
}

export async function getUsdExchangeRates(): Promise<Record<string, number>> {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as Record<string, number>;
  }

  try {
    const rates = await fetchLiveRates();
    await redis.set(CACHE_KEY, JSON.stringify(rates), 'EX', CACHE_TTL_SECONDS);
    return rates;
  } catch {
    const fallback: Record<string, number> = { USD: 1 };
    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency !== 'USD') {
        fallback[currency] = 1;
      }
    }
    return fallback;
  }
}

/** Convert an amount from source currency into USD using live rates (USD base). */
export async function convertToUsd(amount: number, currencyCode: string): Promise<number> {
  const code = currencyCode.toUpperCase();
  if (code === 'USD') return amount;

  const rates = await getUsdExchangeRates();
  const usdPerUnit = rates[code];
  if (!usdPerUnit) return amount;

  return amount / usdPerUnit;
}

export function formatUsdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) {
    return current >= 0 ? '+100%' : '-100%';
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
