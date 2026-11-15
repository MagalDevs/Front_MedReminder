import { describe, expect, it } from 'vitest';
import { buildSchedule, buildTreatmentPayload, DOSE_AMOUNT_ERROR, parseDoseAmount, TreatmentDraft, validateDoseInstants, validateDraft } from '@/app/features/web-ux/domain/treatment';

const draft: TreatmentDraft = { medicationName: 'Medicamento A', classification: '', stock: '30', expiry: '2027-12-31', amount: '1,5', unit: 'mg', boxUnit: 'comp', color: 'Azul', reason: '', notes: '', photo: 'https://example.com/image.jpg', firstDoseAt: '2026-11-13T08:00:00-03:00', intervalHours: '6', duration: '1', durationUnit: 'days' };
describe('treatment model', () => {
  it('T9 canonical transport uses the same trimmed stock unit color and photo URL as validation', () => {
    const padded = { ...draft, boxUnit: '  comprimidos  ', color: '  Azul  ', photo: '  https://example.test/photo.png  ' };
    expect(validateDraft(padded).valid).toBe(true);
    expect(buildTreatmentPayload(padded).remedio).toMatchObject({ unidadeMedida: 'comprimidos', cor: 'Azul', foto: 'https://example.test/photo.png' });
    const boundary = { ...padded, boxUnit: ` ${'u'.repeat(50)} `, color: ` ${'c'.repeat(50)} `, photo: ` https://example.test/${'p'.repeat(234)} ` };
    expect(validateDraft(boundary).valid).toBe(true);
    const payload = buildTreatmentPayload(boundary).remedio;
    expect(payload.unidadeMedida).toBe('u'.repeat(50)); expect(payload.cor).toBe('c'.repeat(50)); expect(payload.foto).toBe(`https://example.test/${'p'.repeat(234)}`); expect(payload.foto).toHaveLength(255);
  });
  it('WUX_FORM_07', () => {
    for (const amount of ['0', '-1', '1e3', '1,5.0', '1.5,0', 'abc', '1 mg', '1,000,000', 'Infinity', '']) {
      expect(parseDoseAmount(amount), amount).toBeNull();
      expect(validateDraft({ ...draft, amount }).errors.amount, amount).toBe(DOSE_AMOUNT_ERROR);
    }
    expect(parseDoseAmount('1,5')).toEqual({ value: 1.5, canonical: '1.5', display: '1,5' });
    expect(parseDoseAmount('1.5')).toEqual({ value: 1.5, canonical: '1.5', display: '1,5' });
    expect(buildTreatmentPayload(draft).remedio.quantidadeDose).toBe('1.5 mg');
  });
  it('WUX_FORM_08', () => {
    expect(buildSchedule(draft)).toMatchObject({ doses: ['2026-11-13T11:00:00.000Z', '2026-11-13T17:00:00.000Z', '2026-11-13T23:00:00.000Z', '2026-11-14T05:00:00.000Z'], firstDoseAt: '2026-11-13T11:00:00.000Z', endExclusive: '2026-11-14T11:00:00.000Z', durationDays: 1, dailyUpperBound: 4 });
    expect(buildSchedule({ ...draft, intervalHours: 5 }).doses).toEqual(['2026-11-13T11:00:00.000Z', '2026-11-13T16:00:00.000Z', '2026-11-13T21:00:00.000Z', '2026-11-14T02:00:00.000Z', '2026-11-14T07:00:00.000Z']);
    // São Paulo's 2018 spring transition: a day is 24 elapsed hours, never 23.
    expect(buildSchedule({ ...draft, firstDoseAt: '2018-11-03T23:00:00-03:00' })).toMatchObject({ doses: ['2018-11-04T02:00:00.000Z', '2018-11-04T08:00:00.000Z', '2018-11-04T14:00:00.000Z', '2018-11-04T20:00:00.000Z'], endExclusive: '2018-11-05T02:00:00.000Z' });
  });
  it('WUX_FORM_09', () => {
    expect(buildTreatmentPayload(draft)).toEqual({ remedio: { nome: 'Medicamento A', classificacao: 'Não classificado', quantidadeCaixa: 30, dataValidade: '2027-12-31', quantidadeDiaria: 4, quantidadeDias: 1, horaInicio: '2026-11-13T11:00:00.000Z', quantidadeDose: '1.5 mg', unidadeMedida: 'comp', cor: 'Azul', motivo: 'Não especificado', observacao: '', foto: 'https://example.com/image.jpg' }, doses: ['2026-11-13T11:00:00.000Z', '2026-11-13T17:00:00.000Z', '2026-11-13T23:00:00.000Z', '2026-11-14T05:00:00.000Z'] });
    expect(buildTreatmentPayload({ ...draft, intervalHours: 5, durationUnit: 'weeks' }).remedio).toMatchObject({ quantidadeDiaria: 5, quantidadeDias: 7 });
    expect(buildTreatmentPayload({ ...draft, intervalHours: 25, durationUnit: 'months' }).remedio).toMatchObject({ quantidadeDiaria: 1, quantidadeDias: 30 });
  });
  it('WUX_FORM_13', () => {
    expect(buildSchedule({ ...draft, intervalHours: 24, duration: 1 }).doses).toEqual(['2026-11-13T11:00:00.000Z']);
    const thousand = buildSchedule({ ...draft, intervalHours: 24, duration: 1000 });
    expect(thousand.doses).toHaveLength(1000);
    expect(thousand.doses[999]).toBe('2029-08-08T11:00:00.000Z');
    expect(() => buildSchedule({ ...draft, intervalHours: 24, duration: 1001 })).toThrow('entre 1 e 1000');
    expect(() => validateDoseInstants([])).toThrow('entre 1 e 1000');
    expect(() => validateDoseInstants(['2026-11-13T11:00:00Z', '2026-11-13T08:00:00-03:00'])).toThrow('não podem se repetir');
    for (const firstDoseAt of ['2026-02-30T08:00', '2026-02-30T08:00:00Z', '2018-11-04T00:30', '2026-11-13T24:00']) expect(validateDraft({ ...draft, firstDoseAt }).errors).toHaveProperty('firstDoseAt');
    for (const value of ['0', '-1', '1e2', '1.5', Number.MAX_SAFE_INTEGER + 1]) {
      expect(validateDraft({ ...draft, intervalHours: value }).errors).toHaveProperty('intervalHours');
      expect(validateDraft({ ...draft, duration: value }).errors).toHaveProperty('duration');
      expect(validateDraft({ ...draft, stock: value }).errors).toHaveProperty('stock');
    }
    expect(validateDraft({ ...draft, duration: Number.MAX_SAFE_INTEGER }).errors).toHaveProperty('duration');
    expect(() => buildTreatmentPayload({ ...draft, duration: 0 })).toThrow();
  });
  it('WUX_FORM_04 bounds preserve calendar validity and transport length', () => {
    expect(validateDraft(draft).valid).toBe(true);
    for (const field of ['medicationName', 'classification', 'reason', 'notes'] as const) expect(validateDraft({ ...draft, [field]: 'x'.repeat(field === 'medicationName' ? 151 : 256) }).errors).toHaveProperty(field);
    expect(validateDraft({ ...draft, unit: 'x'.repeat(49) }).errors).toHaveProperty('unit');
    expect(validateDraft({ ...draft, expiry: '2026-02-30' }).errors).toHaveProperty('expiry');
    expect(buildSchedule({ ...draft, firstDoseAt: '2026-11-13T08:00' }).firstDoseAt).toBe('2026-11-13T11:00:00.000Z');
  });
});
