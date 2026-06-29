import apiClient from '@/lib/api-client';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyCatalog {
  defaultCurrency: string;
  currencies: CurrencyInfo[];
}

let cachedCatalog: CurrencyCatalog | null = null;

/** Fetch supported currencies and the app default (PKR) from the API. */
export async function fetchCurrencyCatalog(): Promise<CurrencyCatalog> {
  if (cachedCatalog) return cachedCatalog;
  const response = await apiClient.get('/currency');
  cachedCatalog = response.data.data as CurrencyCatalog;
  return cachedCatalog;
}

export function clearCurrencyCache() {
  cachedCatalog = null;
}
