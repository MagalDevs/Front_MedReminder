export type DoseState = 'scheduled' | 'due' | 'overdue' | 'registered';
export type DoseInstant = string & { readonly __doseInstant: unique symbol };
export type CompleteDose = {
  kind: 'complete'; id: number; medicationId: number; medicationName: string;
  expectedAt: string; amountLabel: string; registered: boolean; color?: string;
};
export type IncompleteDose = { kind: 'incomplete'; id?: number; reason: string; rawDate?: string; raw: unknown };
export type DoseView = CompleteDose | IncompleteDose;
export type HistoryPeriod = 'all' | 'today' | '7days' | '30days';
export type AgendaFilter = { medicationId?: number; period?: HistoryPeriod; state?: 'all' | 'registered' | 'unregistered'; complete?: boolean };
export type AgendaDose = CompleteDose & { state: DoseState; dateLabel: string; timeLabel: string };

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isDoseInstant(value: unknown): value is DoseInstant {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return isCalendarDate(value.slice(0, 10)) && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60 && Number.isFinite(Date.parse(value));
}

export function normalizeDose(raw: unknown): DoseView {
  const row = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const id = typeof row.id === 'number' && Number.isSafeInteger(row.id) && row.id > 0 ? row.id : undefined;
  const rawDate = typeof row.data_dose === 'string' ? row.data_dose : undefined;
  const incomplete = (reason: string): IncompleteDose => ({ kind: 'incomplete', id, reason, rawDate, raw });
  if (!isDoseInstant(rawDate)) return incomplete(rawDate && isCalendarDate(rawDate) ? 'Horário não informado' : 'Data inválida');
  const medication = row.remedio && typeof row.remedio === 'object' ? row.remedio as Record<string, unknown> : null;
  if (!medication || typeof medication.id !== 'number' || !Number.isSafeInteger(medication.id) || medication.id < 1 || typeof medication.nome !== 'string' || !medication.nome.trim()) return incomplete('Medicamento não informado');
  if (!id || typeof row.tomado !== 'boolean' || typeof medication.quantidadeDose !== 'string' || !medication.quantidadeDose.trim()) return incomplete('Dados da dose não informados');
  return { kind: 'complete', id, medicationId: medication.id, medicationName: medication.nome, expectedAt: rawDate, amountLabel: medication.quantidadeDose, registered: row.tomado, color: typeof medication.cor === 'string' ? medication.cor : undefined };
}

export function doseState(dose: CompleteDose, now: Date | number): DoseState {
  if (dose.registered) return 'registered';
  const delta = Date.parse(dose.expectedAt) - Number(now);
  return delta > 0 ? 'scheduled' : delta === 0 ? 'due' : 'overdue';
}

export function localDay(value: Date | string | number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const get = (name: string) => parts.find(part => part.type === name)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function selectAgenda(doses: DoseView[], now: Date, zone = Intl.DateTimeFormat().resolvedOptions().timeZone, filter: AgendaFilter = {}) {
  const day = localDay(now, zone);
  const start = new Date(`${day}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (filter.period === '7days' ? 6 : filter.period === '30days' ? 29 : 0));
  const firstDay = start.toISOString().slice(0, 10);
  const time = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const agenda: AgendaDose[] = doses.filter((dose): dose is CompleteDose => dose.kind === 'complete')
    .filter(dose => filter.medicationId === undefined || dose.medicationId === filter.medicationId)
    .map(dose => ({ ...dose, state: doseState(dose, now), dateLabel: localDay(dose.expectedAt, zone), timeLabel: time.format(new Date(dose.expectedAt)) }))
    .sort((a, b) => Date.parse(a.expectedAt) - Date.parse(b.expectedAt) || a.id - b.id);
  const today = agenda.filter(dose => dose.dateLabel === day);
  const history = agenda.filter(dose => Date.parse(dose.expectedAt) <= now.getTime() && (!filter.period || filter.period === 'all' || dose.dateLabel >= firstDay) && (!filter.state || filter.state === 'all' || (filter.state === 'registered' ? dose.registered : !dose.registered))).reverse();
  const counts = { total: today.length, registered: today.filter(dose => dose.registered).length, unregistered: today.filter(dose => !dose.registered).length };
  return { today, agenda, history, historyCount: history.length, incomplete: doses.filter((dose): dose is IncompleteDose => dose.kind === 'incomplete'), counts, next: today.find(dose => dose.state === 'scheduled') ?? null, partial: filter.complete === false };
}
