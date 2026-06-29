/** ISO 4217 codes supported by the app (no side-effect imports — safe for seeds/scripts). */
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

/** Primary display currency used across the Antrosys web app (invoices, payroll, clients). */
export const APP_DEFAULT_CURRENCY: SupportedCurrency = 'PKR';

export type AppDefaultCurrency = typeof APP_DEFAULT_CURRENCY;

/** Base currency for internal USD-normalized finance calculations. */
export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';
