import { SUPPORTED_CURRENCIES, APP_DEFAULT_CURRENCY } from './currency-constants';

export { SUPPORTED_CURRENCIES, APP_DEFAULT_CURRENCY };
export type { SupportedCurrency, AppDefaultCurrency } from './currency-constants';
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCY_NAMES: Record<string, { name: string; symbol: string }> = {
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  PKR: { name: 'Pakistani Rupee', symbol: 'PKR' },
  AED: { name: 'UAE Dirham', symbol: 'AED' },
  SAR: { name: 'Saudi Riyal', symbol: 'SAR' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  MXN: { name: 'Mexican Peso', symbol: 'MX$' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  PLN: { name: 'Polish Złoty', symbol: 'zł' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  EGP: { name: 'Egyptian Pound', symbol: 'E£' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
  QAR: { name: 'Qatari Riyal', symbol: 'QR' },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'KD' },
  BHD: { name: 'Bahraini Dinar', symbol: 'BD' },
  OMR: { name: 'Omani Rial', symbol: 'OMR' },
};

export function getCurrencyCatalog(): CurrencyInfo[] {
  return SUPPORTED_CURRENCIES.map((code) => ({
    code,
    name: CURRENCY_NAMES[code]?.name ?? code,
    symbol: CURRENCY_NAMES[code]?.symbol ?? code,
  }));
}

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.includes(code.toUpperCase() as (typeof SUPPORTED_CURRENCIES)[number]);
}
