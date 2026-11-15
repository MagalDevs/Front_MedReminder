import { isCalendarDate, isDoseInstant } from './agenda';

export const DOSE_AMOUNT_ERROR = 'Informe uma quantidade maior que zero, usando vírgula ou ponto para decimais';
export type DurationUnit = 'days' | 'weeks' | 'months';
export type ScheduleInput = { firstDoseAt: string; intervalHours: string | number; duration: string | number; durationUnit: DurationUnit };
export type TreatmentDraft = ScheduleInput & {
  medicationName: string; classification: string; stock: string | number; expiry: string;
  amount: string; unit: string; boxUnit: string; color: string; reason: string; notes: string; photo: string;
};
export type TreatmentSchedule = { doses: string[]; firstDoseAt: string; endExclusive: string; durationDays: number; intervalHours: number; dailyUpperBound: number; zone: string };
export class TreatmentValidationError extends Error {
  constructor(public readonly field: string, message: string) { super(message); this.name = 'TreatmentValidationError'; }
}

export function parseDoseAmount(input: string) {
  const text = input.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
  const canonical = text.replace(',', '.').replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  const value = Number(canonical);
  return Number.isFinite(value) && value > 0 ? { value, canonical, display: canonical.replace('.', ',') } : null;
}

function positiveInteger(value: string | number, field: string) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) <= 0) throw new TreatmentValidationError(field, 'Informe um inteiro positivo seguro');
  return Number(text);
}

function parseFirstDose(value: string): Date {
  if (isDoseInstant(value)) return new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !isCalendarDate(value.slice(0, 10))) throw new TreatmentValidationError('firstDoseAt', 'Data ou horário da primeira dose inválido');
  const date = new Date(`${value}:00`);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() !== Number(value.slice(0, 4)) || date.getMonth() + 1 !== Number(value.slice(5, 7)) || date.getDate() !== Number(value.slice(8, 10)) || date.getHours() !== Number(value.slice(11, 13)) || date.getMinutes() !== Number(value.slice(14, 16))) throw new TreatmentValidationError('firstDoseAt', 'Data ou horário da primeira dose inválido');
  return date;
}

export function validateDoseInstants(doses: string[]): void {
  if (doses.length < 1 || doses.length > 1000) throw new TreatmentValidationError('duration', 'O tratamento deve conter entre 1 e 1000 doses');
  if (!doses.every(isDoseInstant)) throw new TreatmentValidationError('firstDoseAt', 'Data ou horário da dose inválido');
  if (new Set(doses.map(dose => Date.parse(dose))).size !== doses.length) throw new TreatmentValidationError('intervalHours', 'Os horários das doses não podem se repetir');
}

export function buildSchedule(input: ScheduleInput): TreatmentSchedule {
  const start = parseFirstDose(input.firstDoseAt);
  const intervalHours = positiveInteger(input.intervalHours, 'intervalHours');
  const duration = positiveInteger(input.duration, 'duration');
  const factor = { days: 1, weeks: 7, months: 30 }[input.durationUnit];
  const durationDays = duration * factor;
  const step = intervalHours * 3600000;
  const window = durationDays * 86400000;
  const end = start.getTime() + window;
  if (!Number.isSafeInteger(durationDays) || !Number.isSafeInteger(window) || !Number.isFinite(new Date(end).getTime())) throw new TreatmentValidationError('duration', 'Duração fora do limite de datas');
  if (!Number.isSafeInteger(step)) throw new TreatmentValidationError('intervalHours', 'Intervalo fora do limite seguro');
  const doses: string[] = [];
  for (let instant = start.getTime(); instant < end && doses.length <= 1000; instant += step) doses.push(new Date(instant).toISOString());
  validateDoseInstants(doses);
  return { doses, firstDoseAt: start.toISOString(), endExclusive: new Date(end).toISOString(), durationDays, intervalHours, dailyUpperBound: Math.ceil(24 / intervalHours), zone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

export function validateDraft(draft: TreatmentDraft) {
  const errors: Record<string, string> = {};
  for (const [field, limit, required] of [['medicationName', 150, true], ['classification', 255, false], ['reason', 255, false], ['notes', 255, false]] as const) {
    if ((required && !draft[field].trim()) || draft[field].trim().length > limit) errors[field] = `Informe até ${limit} caracteres${required ? ' (obrigatório)' : ''}`;
  }
  const amount = parseDoseAmount(draft.amount);
  if (!amount) errors.amount = DOSE_AMOUNT_ERROR;
  if (!draft.unit.trim() || (amount && `${amount.canonical} ${draft.unit.trim()}`.length > 50)) errors.unit = 'Informe a unidade; quantidade e unidade devem ter até 50 caracteres';
  if (!draft.boxUnit.trim() || draft.boxUnit.trim().length > 50) errors.boxUnit = 'Informe a unidade do estoque com até 50 caracteres';
  if (!draft.color.trim() || draft.color.trim().length > 50) errors.color = 'Escolha uma cor identificadora com até 50 caracteres';
  if (!isCalendarDate(draft.expiry)) errors.expiry = 'Data de validade inválida';
  try { positiveInteger(draft.stock, 'stock'); } catch (error) { if (error instanceof TreatmentValidationError) errors[error.field] = error.message; }
  try { const url = new URL(draft.photo); if (!['https:', 'http:'].includes(url.protocol)) errors.photo = 'Informe uma URL de imagem válida'; } catch { errors.photo = 'Informe uma URL de imagem válida'; }
  if (draft.photo.trim().length > 255) errors.photo = 'Informe uma URL de imagem com até 255 caracteres';
  let schedule: TreatmentSchedule | undefined;
  try { schedule = buildSchedule(draft); } catch (error) { if (error instanceof TreatmentValidationError) errors[error.field] = error.message; else throw error; }
  return { valid: Object.keys(errors).length === 0, errors, schedule, amount };
}

export function buildTreatmentPayload(draft: TreatmentDraft) {
  const result = validateDraft(draft);
  const firstError = Object.entries(result.errors)[0];
  if (firstError) throw new TreatmentValidationError(firstError[0], firstError[1]);
  const schedule = result.schedule!;
  return { remedio: {
    nome: draft.medicationName.trim(), classificacao: draft.classification.trim() || 'Não classificado',
    quantidadeCaixa: Number(draft.stock), dataValidade: draft.expiry,
    quantidadeDiaria: schedule.dailyUpperBound, quantidadeDias: schedule.durationDays,
    horaInicio: schedule.firstDoseAt, quantidadeDose: `${result.amount!.canonical} ${draft.unit.trim()}`,
    unidadeMedida: draft.boxUnit.trim(), cor: draft.color.trim(), motivo: draft.reason.trim() || 'Não especificado',
    observacao: draft.notes.trim(), foto: draft.photo.trim(),
  }, doses: schedule.doses };
}
