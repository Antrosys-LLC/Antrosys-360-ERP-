import { redis } from '../../config/redis';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'PKR',
  'AED',
  'SAR',
  'JPY',
  'CNY',
  'INR',
  'CAD',
  'AUD',
  'CHF',
  'SGD',
  'HKD',
  'KRW',
  'BRL',
  'MXN',
  'ZAR',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'TRY',
  'THB',
  'MYR',
  'IDR',
  'PHP',
  'VND',
  'EGP',
  'NGN',
  'KES',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

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

/** Convert a USD amount into a target currency using live rates (USD base). */
export async function convertFromUsd(amountUsd: number, targetCurrency: string): Promise<number> {
  const code = targetCurrency.toUpperCase();
  if (code === 'USD') return amountUsd;

  const rates = await getUsdExchangeRates();
  const unitsPerUsd = rates[code];
  if (!unitsPerUsd) return amountUsd;

  return amountUsd * unitsPerUsd;
}

const CURRENCY_DISPLAY: Record<string, { prefix: string; suffix?: string }> = {
  USD: { prefix: '$' },
  EUR: { prefix: '€' },
  GBP: { prefix: '£' },
  PKR: { prefix: 'PKR ' },
  AED: { prefix: 'AED ' },
  SAR: { prefix: 'SAR ' },
  JPY: { prefix: '¥' },
  INR: { prefix: '₹' },
};

export function formatCurrency(amount: number, currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  const display = CURRENCY_DISPLAY[code] ?? { prefix: `${code} ` };
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: code === 'JPY' ? 0 : 2,
  });
  return `${display.prefix}${formatted}${display.suffix ?? ''}`;
}
