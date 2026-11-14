import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDoseMutation } from '@/app/features/web-ux/hooks/useDoseMutation';
import { DoseView, normalizeDose, selectAgenda } from '@/app/features/web-ux/domain/agenda';

const at = '2026-11-13T11:00:00-03:00';
const row = (id: number, registered = false, expectedAt = at) => normalizeDose({ id, tomado: registered, data_dose: expectedAt, remedio: { id: 7, nome: 'A', quantidadeDose: '1 mg' } });
const saved = (id: number, registered: boolean, data_dose = at) => new Response(JSON.stringify({ message: 'ok', data: { id, tomado: registered, data_dose } }), { status: 200, headers: { 'content-type': 'application/json' } });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { resolve, promise }; }
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-13T12:00:00-03:00')); localStorage.setItem('access_token', 'A'); });
afterEach(() => vi.useRealTimers());
const mount = (doses: DoseView[] = [row(1)]) => renderHook(() => useDoseMutation({ doses, identity: 'A' }));

it('WUX_DOSE_03', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(saved(1, true)); vi.stubGlobal('fetch', fetcher);
  const { result } = mount();
  await act(async () => { expect(await result.current.mutate(1, true)).toBe(true); });
  expect(fetcher.mock.calls[0][0]).toBe('http://api.test.invalid/dose/1');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'PUT', body: '{"tomado":true}' });
  expect(result.current.doses[0]).toMatchObject({ registered: true, expectedAt: at, amountLabel: '1 mg' });
});
it('WUX_DOSE_04', async () => {
  const request = deferred<Response>(); vi.stubGlobal('fetch', vi.fn().mockReturnValue(request.promise));
  const { result } = mount(); let operation!: Promise<boolean>;
  act(() => { operation = result.current.mutate(1, true); });
  expect(result.current.doses[0]).toMatchObject({ registered: false });
  expect(result.current.status[1].pending).toBe(true);
  await act(async () => { request.resolve(saved(1, true)); await operation; });
  const agenda = selectAgenda(result.current.doses, new Date(), 'America/Sao_Paulo');
  expect(agenda.today[0].state).toBe('registered');
  expect(agenda.counts).toEqual({ total: 1, registered: 1, unregistered: 0 });
  expect(result.current.status[1]).toEqual({ pending: false, error: null });
});
it('WUX_DOSE_06', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(saved(1, false)); vi.stubGlobal('fetch', fetcher);
  const { result } = mount([row(1, true)]);
  await act(async () => { expect(await result.current.mutate(1, false)).toBe(true); });
  expect(fetcher.mock.calls[0][1]?.body).toBe('{"tomado":false}');
  expect(result.current.doses[0]).toMatchObject({ registered: false, expectedAt: at });
  expect(selectAgenda(result.current.doses, new Date(), 'America/Sao_Paulo').today[0].state).toBe('overdue');
});
it('WUX_DOSE_07', async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(saved(1, false)); vi.stubGlobal('fetch', fetcher);
  const { result } = mount([row(1, true)]);
  await act(async () => { expect(await result.current.mutate(1, false)).toBe(false); });
  expect(result.current.doses[0]).toMatchObject({ registered: true, expectedAt: at });
  expect(result.current.status[1]).toMatchObject({ pending: false, error: expect.any(String), desired: false });
  await act(async () => { expect(await result.current.retry(1)).toBe(true); });
  expect(result.current.doses[0]).toMatchObject({ registered: false, expectedAt: at });
});
it('WUX_DOSE_08', async () => {
  const a = deferred<Response>(); const b = deferred<Response>(); const fetcher = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise); vi.stubGlobal('fetch', fetcher);
  const { result } = mount([row(1), row(2)]); let first!: Promise<boolean>; let second!: Promise<boolean>;
  await act(async () => { first = result.current.mutate(1, true); expect(await result.current.mutate(1, true)).toBe(false); second = result.current.mutate(2, true); });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(result.current.status[1].pending).toBe(true);
  expect(result.current.status[2].pending).toBe(true);
  await act(async () => { b.resolve(saved(2, true)); await second; });
  expect(result.current.doses.map(item => item.kind === 'complete' && item.registered)).toEqual([false, true]);
  await act(async () => { a.resolve(saved(1, true)); await first; });
  expect(result.current.doses.map(item => item.kind === 'complete' && item.registered)).toEqual([true, true]);
});
it('discards responses and errors after identity change or unmount', async () => {
  const request = deferred<Response>(); const fetcher = vi.fn().mockReturnValueOnce(request.promise); vi.stubGlobal('fetch', fetcher);
  const doses = [row(1)]; const { result, rerender, unmount } = renderHook(({ identity }) => useDoseMutation({ doses, identity }), { initialProps: { identity: 'A' } });
  let operation!: Promise<boolean>; act(() => { operation = result.current.mutate(1, true); });
  localStorage.setItem('access_token', 'B'); rerender({ identity: 'B' });
  await act(async () => { request.resolve(saved(1, true)); expect(await operation).toBe(false); });
  expect(result.current.doses[0]).toMatchObject({ registered: false });
  expect(result.current.status).toEqual({});
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  unmount();
});
it('rejects early registration, incomplete items and mismatched server confirmation', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(saved(9, true)); vi.stubGlobal('fetch', fetcher);
  const { result } = mount([row(1), row(2, false, '2026-11-13T13:00:00-03:00'), normalizeDose({ id: 3, data_dose: '2026-11-13' })]);
  await act(async () => { expect(await result.current.mutate(2, true)).toBe(false); expect(await result.current.mutate(3, true)).toBe(false); expect(await result.current.mutate(1, true)).toBe(false); });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(result.current.doses[0]).toMatchObject({ registered: false });
  expect(result.current.status[1].error).toBeTruthy();
});
it('honors per-item Retry-After without an automatic request', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ message: 'wait' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '2' } })).mockResolvedValueOnce(saved(1, true)); vi.stubGlobal('fetch', fetcher); vi.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = mount();
  await act(async () => { await result.current.mutate(1, true); });
  expect(result.current.status[1].retryNotBefore).toBe(Date.now() + 2000);
  await act(async () => { expect(await result.current.retry(1)).toBe(false); });
  act(() => vi.advanceTimersByTime(2000));
  expect(fetcher).toHaveBeenCalledTimes(1);
  await act(async () => { expect(await result.current.retry(1)).toBe(true); });
  expect(result.current.doses[0]).toMatchObject({ registered: true });
});
it('discards an old collection mutation without replacing newer confirmed items', async () => {
  const old = deferred<Response>(); const latest = deferred<Response>();
  vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise));
  const { result, rerender } = renderHook(({ doses }) => useDoseMutation({ doses, identity: 'A' }), { initialProps: { doses: [row(1), row(2)] } });
  let oldOperation!: Promise<boolean>; let newOperation!: Promise<boolean>;
  act(() => { oldOperation = result.current.mutate(1, true); });
  rerender({ doses: [row(1), row(2)] });
  act(() => { newOperation = result.current.mutate(2, true); });
  await act(async () => { latest.resolve(saved(2, true)); expect(await newOperation).toBe(true); });
  expect(result.current.doses.map(item => item.kind === 'complete' && item.registered)).toEqual([false, true]);
  await act(async () => { old.resolve(saved(1, true)); expect(await oldOperation).toBe(false); });
  expect(result.current.doses.map(item => item.kind === 'complete' && item.registered)).toEqual([false, true]);
  expect(result.current.status[2]).toEqual({ pending: false, error: null });
});
