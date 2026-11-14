import { isCalendarDate, isDoseInstant, localDay } from './agenda';

export type ExpiryCategory = 'expired' | 'next30days' | 'valid' | 'unknown';
export type MedicationFilters = { name?: string; classification?: string; expiry?: ExpiryCategory | 'all' };
export type FilterableMedication = { id: number; nome: string; classificacao?: string; dataValidade?: string | null };
export const EMPTY_MEDICATION_FILTERS: MedicationFilters = { name: '', classification: '', expiry: 'all' };

export function expiryCategory(value: string | null | undefined, today: string): ExpiryCategory {
  // Date-only values remain calendar dates; never parse them in the browser's zone.
  const date = value?.slice(0, 10);
  if (!date || !isCalendarDate(date) || (value!.length !== 10 && !isDoseInstant(value))) return 'unknown';
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 30);
  return date < today ? 'expired' : date <= end.toISOString().slice(0, 10) ? 'next30days' : 'valid';
}

const fold = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function filterMedications<T extends FilterableMedication>(items: T[], query: MedicationFilters = EMPTY_MEDICATION_FILTERS, today = localDay(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone)) {
  const name = fold(query.name ?? '');
  const filtered = items.filter(item => (!name || fold(item.nome).includes(name)) && (!query.classification || item.classificacao === query.classification) && (!query.expiry || query.expiry === 'all' || expiryCategory(item.dataValidade, today) === query.expiry));
  return { items: filtered, count: filtered.length, total: items.length, state: items.length === 0 ? 'empty' as const : filtered.length === 0 ? 'filtered' as const : 'ready' as const };
}
