import { describe, expect, it } from 'vitest';
import { EMPTY_MEDICATION_FILTERS, expiryCategory, filterMedications } from '@/app/features/web-ux/domain/medication-filters';

const items = [
  { id: 1, nome: 'Ácido A', classificacao: 'A', dataValidade: '2026-11-12' },
  { id: 2, nome: 'Ácido B', classificacao: 'A', dataValidade: '2026-11-13' },
  { id: 3, nome: 'Ácido C', classificacao: 'B', dataValidade: '2026-12-13' },
  { id: 4, nome: 'Outro', classificacao: 'A', dataValidade: '2026-12-14' },
  { id: 5, nome: 'Ácido D', classificacao: 'A', dataValidade: null },
];
describe('medication filters', () => {
  it('WUX_MED_01 intersection uses trimmed accent-insensitive partial names and exact classifications', () => {
    expect(filterMedications(items, { name: '  ACIDO  ', classification: 'A', expiry: 'next30days' }, '2026-11-13').items.map(item => item.id)).toEqual([2]);
    expect(filterMedications(items, { classification: 'a' }, '2026-11-13').items).toEqual([]);
    expect(filterMedications(items, { name: 'cIdO' }, '2026-11-13').count).toBe(4);
  });
  it('WUX_MED_01 local calendar boundaries and unknown dates never overlap', () => {
    expect(items.map(item => expiryCategory(item.dataValidade, '2026-11-13'))).toEqual(['expired', 'next30days', 'next30days', 'valid', 'unknown']);
    expect(expiryCategory('2026-02-30', '2026-11-13')).toBe('unknown');
    expect(expiryCategory('invalid', '2026-11-13')).toBe('unknown');
    expect(expiryCategory('2026-11-13T00:00:00Z', '2026-11-13')).toBe('next30days');
    expect(expiryCategory('2026-03-30', '2026-02-28')).toBe('next30days');
    expect(expiryCategory('2026-03-31', '2026-02-28')).toBe('valid');
  });
  it('WUX_MED_02_03 clearing restores count and distinguishes empty registration from no matching results', () => {
    expect(filterMedications(items, { name: 'inexistente' }, '2026-11-13')).toMatchObject({ items: [], count: 0, total: 5, state: 'filtered' });
    expect(filterMedications([], {}, '2026-11-13')).toMatchObject({ count: 0, total: 0, state: 'empty' });
    expect(filterMedications(items, EMPTY_MEDICATION_FILTERS, '2026-11-13')).toEqual({ items, count: 5, total: 5, state: 'ready' });
  });
});
