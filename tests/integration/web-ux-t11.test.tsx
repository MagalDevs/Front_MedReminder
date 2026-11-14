import { expect, it, vi } from 'vitest';
import { DoseCollection, loadDoseCollection } from '@/app/features/web-ux/data/loadDoseCollection';
import { selectAgenda } from '@/app/features/web-ux/domain/agenda';

const row = (id: number) => ({ id, tomado: false, data_dose: '2026-11-13T16:00:00Z', remedio: { id: 7, nome: 'A', quantidadeDose: '1 mg' } });
const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
it('WUX_DAY_09', async () => {
  localStorage.setItem('access_token', 'synthetic');
  const fetcher = vi.fn().mockResolvedValueOnce(response({ data: Array.from({ length: 100 }, (_, i) => row(i + 1)), pagination: { page: 1, limit: 100, total: 102, totalPages: 2 } })).mockResolvedValueOnce(response({ data: [row(101), { id: 102, data_dose: '2026-11-13' }], pagination: { page: 2, limit: 100, total: 102, totalPages: 2 } }));
  vi.stubGlobal('fetch', fetcher);
  const progress: DoseCollection[] = [];
  const loaded = await loadDoseCollection({ from: '2026-11-13', to: '2026-11-14', onProgress: result => progress.push(result) });
  expect(progress).toHaveLength(1);
  expect(progress[0]).toMatchObject({ complete: false, loading: true, expectedTotal: 102 });
  expect(progress[0].items).toHaveLength(100);
  expect(loaded).toMatchObject({ complete: true, loading: false, error: null, expectedTotal: 102 });
  expect(loaded.items).toHaveLength(102);
  expect(loaded.items[101]).toMatchObject({ kind: 'incomplete', id: 102, reason: 'Horário não informado' });
  const agenda = selectAgenda(loaded.items, new Date('2026-11-13T15:00:00Z'), 'America/Sao_Paulo', { complete: loaded.complete });
  expect(agenda.counts.total).toBe(101);
  expect(agenda.incomplete).toHaveLength(1);
  expect(agenda.partial).toBe(false);
  expect(agenda.next?.id).toBe(1);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual(['http://api.test.invalid/dose/me?limit=100&order=ASC&from=2026-11-13&to=2026-11-14&page=1', 'http://api.test.invalid/dose/me?limit=100&order=ASC&from=2026-11-13&to=2026-11-14&page=2']);
});
it('loads legacy envelopes and successful empty collections while preserving invalid records', async () => {
  localStorage.setItem('access_token', 'synthetic');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ data: [row(1), null] })).mockResolvedValueOnce(response({ data: [] })));
  const legacy = await loadDoseCollection();
  expect(legacy.complete).toBe(true);
  expect(legacy.items.map(item => item.kind)).toEqual(['complete', 'incomplete']);
  expect(await loadDoseCollection()).toMatchObject({ complete: true, items: [], error: null });
});
it('preserves partial pages after failure and never claims complete totals', async () => {
  localStorage.setItem('access_token', 'synthetic');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ data: [row(1)], pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } })).mockRejectedValueOnce(new TypeError('offline')));
  const partial = await loadDoseCollection();
  expect(partial.complete).toBe(false);
  expect(partial.loading).toBe(false);
  expect(partial.error).toBeTruthy();
  expect(partial.items).toHaveLength(1);
  expect(selectAgenda(partial.items, new Date('2026-11-13T15:00:00Z'), 'America/Sao_Paulo', { complete: partial.complete }).partial).toBe(true);
});
it('rejects malformed envelopes, changing totals, duplicates and truncated pages as incomplete', async () => {
  localStorage.setItem('access_token', 'synthetic');
  for (const value of [[], { data: 'bad' }, { data: [], pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } }]) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(value)));
    expect(await loadDoseCollection()).toMatchObject({ complete: false, error: expect.any(String) });
  }
  for (const second of [
    { data: [row(2)], pagination: { page: 2, limit: 1, total: 3, totalPages: 3 } },
    { data: [row(1)], pagination: { page: 2, limit: 1, total: 2, totalPages: 2 } },
  ]) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ data: [row(1)], pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } })).mockResolvedValueOnce(response(second)));
    expect(await loadDoseCollection()).toMatchObject({ complete: false, error: expect.any(String) });
  }
});
