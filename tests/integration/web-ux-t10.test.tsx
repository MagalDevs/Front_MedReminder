import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useLocalClock } from '@/app/features/web-ux/hooks/useLocalClock';
import { normalizeDose, selectAgenda } from '@/app/features/web-ux/domain/agenda';

afterEach(() => { vi.useRealTimers(); });
const at = (id: number, data_dose: string) => normalizeDose({ id, data_dose, tomado: false, remedio: { id: 7, nome: 'A', quantidadeDose: '1 mg' } });
it('WUX_DAY_04', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-13T23:59:59-03:00'));
  const { result } = renderHook(() => { const clock = useLocalClock(); return { ...clock, agenda: selectAgenda([at(1, '2026-11-14T00:00:00-03:00'), at(2, '2026-11-13T23:59:59-03:00')], clock.now, clock.zone) }; });
  expect(result.current.agenda.today.map(dose => [dose.id, dose.state])).toEqual([[2, 'due']]);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.agenda.today.map(dose => [dose.id, dose.state])).toEqual([[1, 'due']]);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.agenda.today[0].state).toBe('overdue');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  vi.setSystemTime(new Date('2026-11-15T12:00:00-03:00'));
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.now.toISOString()).toBe('2026-11-14T03:00:01.000Z');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.now.toISOString()).toBe('2026-11-15T15:00:00.000Z');
  expect(result.current.agenda.today).toEqual([]);
  vi.setSystemTime(new Date('2026-11-15T12:00:00.500-03:00'));
  let checked: Date | undefined;
  act(() => { checked = result.current.refreshNow(); });
  expect(checked?.toISOString()).toBe('2026-11-15T15:00:00.500Z');
});
it('clock removes its timer and visibility listener when unmounted', () => {
  vi.useFakeTimers();
  const remove = vi.spyOn(document, 'removeEventListener');
  const { unmount } = renderHook(useLocalClock);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
});
