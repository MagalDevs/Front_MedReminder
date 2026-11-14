'use client';

import { useId, useState } from 'react';
import Button from '../../../components/ui/Button';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import { useTreatmentDraft } from '../contexts/TreatmentDraftContext';
import { validateDraft } from '../domain/treatment';

export default function TreatmentReview() {
  const { draft } = useTreatmentDraft();
  const [expanded, setExpanded] = useState(false); const listId = useId();
  const result = validateDraft(draft);
  if (!result.valid || !result.schedule || !result.amount) return <RequestFeedback message={`Revise os dados antes de salvar: ${Object.values(result.errors).join('. ')}`} />;
  const { schedule, amount } = result;
  const format = (instant: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: schedule.zone, dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(instant));
  return <section aria-labelledby="review-title" className="min-w-0 space-y-6">
    <h2 id="review-title" className="text-xl font-semibold">Revisão</h2>
    <p>Confira os dados e os horários antes de salvar o tratamento.</p>
    <dl className="grid min-w-0 gap-x-8 gap-y-4 sm:grid-cols-2 [&_dt]:text-[var(--text-muted)] [&_dd]:break-words [&_dd]:font-semibold">
      <div><dt>Medicamento</dt><dd>{draft.medicationName.trim()}</dd></div>
      <div><dt>Classificação</dt><dd>{draft.classification.trim() || 'Não classificado'}</dd></div>
      <div><dt>Quantidade por dose</dt><dd>{amount.display} {draft.unit.trim()}</dd></div>
      <div><dt>Intervalo</dt><dd>A cada {schedule.intervalHours} horas</dd></div>
      <div><dt>Início</dt><dd><time data-testid="review-start" dateTime={schedule.firstDoseAt}>{format(schedule.firstDoseAt)}</time></dd></div>
      <div><dt>Fim exclusivo</dt><dd><time data-testid="review-end" dateTime={schedule.endExclusive}>{format(schedule.endExclusive)}</time></dd></div>
      <div><dt>Duração decorrida</dt><dd>{schedule.durationDays} dias de 24 horas</dd></div>
      <div><dt>Total de doses</dt><dd>{schedule.doses.length} doses</dd></div>
      <div><dt>Fuso utilizado</dt><dd>{schedule.zone}</dd></div>
      <div><dt>Estoque</dt><dd>{draft.stock} {draft.boxUnit}</dd></div>
      <div><dt>Validade</dt><dd>{draft.expiry.split('-').reverse().join('/')}</dd></div>
      <div><dt>Cor identificadora</dt><dd>{draft.color || 'Sem cor'}</dd></div>
      <div><dt>Motivo</dt><dd>{draft.reason.trim() || 'Não especificado'}</dd></div>
      {draft.notes.trim() && <div><dt>Observação</dt><dd>{draft.notes.trim()}</dd></div>}
    </dl>
    <p className="text-[var(--text-muted)]">O instante final não gera uma dose. Os horários abaixo são os mesmos enviados ao salvar.</p>
    <Button variant="secondary" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)}>{expanded ? 'Ocultar horários' : 'Ver todos os horários'}</Button>
    {expanded && <ol id={listId} aria-label="Horários previstos" className="max-h-96 overflow-y-auto divide-y divide-[var(--border-default)] rounded-[var(--radius-control)] border border-[var(--border-default)] px-4">
      {schedule.doses.map(instant => <li key={instant} className="py-3 tabular-nums"><time dateTime={instant}>{format(instant)}</time></li>)}
    </ol>}
  </section>;
}
