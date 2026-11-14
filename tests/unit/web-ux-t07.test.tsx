import { describe, expect, it } from 'vitest';
import { normalizeDose, selectAgenda } from '@/app/features/web-ux/domain/agenda';

const dose = (id: number, at: string, registered = false, medicationId = 7) => normalizeDose({ id, data_dose: at, tomado: registered, remedio: { id: medicationId, nome: 'Medicamento A', quantidadeDose: '1,5 mg', quantidadeDiaria: 99 } });
const now = new Date('2026-11-13T12:00:00-03:00');
const zone = 'America/Sao_Paulo';
describe('agenda', () => {
  it('WUX_FORM_10', () => {
    const result = selectAgenda([dose(1, '2026-11-13T08:17:00-03:00'), dose(2, '2026-11-13T19:42:00-03:00')], now, zone);
    expect(result.agenda.map(item => [item.expectedAt, item.timeLabel, item.amountLabel])).toEqual([
      ['2026-11-13T08:17:00-03:00', '08:17', '1,5 mg'], ['2026-11-13T19:42:00-03:00', '19:42', '1,5 mg'],
    ]);
    expect(result.agenda).toHaveLength(2);
    expect(result.agenda[0]).not.toHaveProperty('intervalHours');
  });
  it('WUX_DAY_01_02_03 states, local day, stable order and next future dose', () => {
    const result = selectAgenda([dose(5, '2026-11-14T02:59:59Z'), dose(4, '2026-11-13T13:00:00-03:00'), dose(2, '2026-11-13T12:00:00-03:00'), dose(1, '2026-11-13T11:00:00-03:00'), dose(3, '2026-11-13T12:00:00-03:00', true), dose(6, '2026-11-14T03:00:00Z')], now, zone);
    expect(result.today.map(item => [item.id, item.state])).toEqual([[1, 'overdue'], [2, 'due'], [3, 'registered'], [4, 'scheduled'], [5, 'scheduled']]);
    expect(result.next?.id).toBe(4);
    expect(result.counts).toEqual({ total: 5, registered: 1, unregistered: 4 });
    expect(result.today[0]).toMatchObject({ medicationName: 'Medicamento A', amountLabel: '1,5 mg', dateLabel: '2026-11-13', timeLabel: '11:00' });
  });
  it('WUX_DAY_06_07 history ends now and composes period, ID and registered filters', () => {
    const rows = [dose(1, '2026-11-06T23:59:59-03:00', true), dose(2, '2026-11-07T00:00:00-03:00', true), dose(3, '2026-11-13T12:00:00-03:00', true), dose(4, '2026-11-13T12:00:01-03:00', true), dose(5, '2026-11-13T11:00:00-03:00', true, 8), dose(6, '2026-11-13T10:00:00-03:00')];
    const result = selectAgenda(rows, now, zone, { medicationId: 7, period: '7days', state: 'registered' });
    expect(result.history.map(item => item.id)).toEqual([3, 2]);
    expect(result.historyCount).toBe(2);
    expect(selectAgenda(rows, now, zone, { period: 'today', state: 'unregistered' }).history.map(item => item.id)).toEqual([6]);
  });
  it('WUX_DAY_08 preserves incomplete data without inventing times or relations', () => {
    const rows = [normalizeDose({ id: 1, data_dose: '2026-11-13' }), normalizeDose({ id: 2, data_dose: '2026-02-30T12:00:00Z' }), normalizeDose({ id: 3, data_dose: '2026-11-13T12:00:00Z', tomado: false }), normalizeDose(null)];
    const result = selectAgenda(rows, now, zone);
    expect(result.incomplete).toHaveLength(4);
    expect(result.incomplete[0].reason).toBe('Horário não informado');
    expect(result.incomplete.every(item => !('expectedAt' in item) && !('medicationName' in item))).toBe(true);
    expect(result.today).toEqual([]);
    expect(result.next).toBeNull();
  });
});
