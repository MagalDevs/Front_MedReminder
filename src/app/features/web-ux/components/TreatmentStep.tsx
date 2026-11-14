'use client';

import FormField from '../../../components/ui/FormField';
import { useTreatmentDraft } from '../contexts/TreatmentDraftContext';
import { validateDraft, type DurationUnit } from '../domain/treatment';

export const treatmentStepFields = ['amount', 'unit', 'firstDoseAt', 'intervalHours', 'duration', 'durationUnit'] as const;
const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
export default function TreatmentStep({ errors = {} }: { errors?: Record<string, string> }) {
  const { draft, updateDraft, intent } = useTreatmentDraft();
  const { amount, schedule } = validateDraft(draft);
  return <fieldset disabled={intent.phase !== 'editing'} className="min-w-0 space-y-6">
    <legend className="mb-4 text-xl font-semibold">Tratamento</legend>
    <div className="grid min-w-0 gap-6 sm:grid-cols-2">
      <FormField id="draft-amount" label="Quantidade por dose" error={errors.amount} description="Use vírgula ou ponto para decimais"><input className={control} required inputMode="decimal" value={draft.amount} onChange={event => updateDraft({ amount: event.target.value })} /></FormField>
      <FormField id="draft-unit" label="Unidade por dose" error={errors.unit} description="Por exemplo: mg, mL ou comprimido"><input className={control} required value={draft.unit} onChange={event => updateDraft({ unit: event.target.value })} /></FormField>
      <FormField id="draft-firstDoseAt" label="Primeira dose" error={errors.firstDoseAt} description="Data e hora no fuso deste navegador"><input className={control} required type="datetime-local" value={draft.firstDoseAt} onChange={event => updateDraft({ firstDoseAt: event.target.value })} /></FormField>
      <FormField id="draft-intervalHours" label="Intervalo em horas" error={errors.intervalHours} description="Horas decorridas entre doses"><input className={control} required inputMode="numeric" value={draft.intervalHours} onChange={event => updateDraft({ intervalHours: event.target.value })} /></FormField>
      <FormField id="draft-duration" label="Duração" error={errors.duration}><input className={control} required inputMode="numeric" value={draft.duration} onChange={event => updateDraft({ duration: event.target.value })} /></FormField>
      <FormField id="draft-durationUnit" label="Unidade da duração" error={errors.durationUnit}><select className={control} value={draft.durationUnit} onChange={event => updateDraft({ durationUnit: event.target.value as DurationUnit })}><option value="days">Dias</option><option value="weeks">Semanas</option><option value="months">Meses</option></select></FormField>
    </div>
    {amount && draft.unit.trim() && <p>Quantidade informada: {amount.display} {draft.unit.trim()}</p>}
    <div className="space-y-2 text-[var(--text-muted)]">
      {draft.durationUnit === 'weeks' && <p>Uma semana equivale a 7 dias.</p>}
      {draft.durationUnit === 'months' && <p>Um mês equivale a 30 dias.</p>}
      {schedule && <p>Duração total: {schedule.durationDays} dias.</p>}
      <p>Cada dia tem 24 horas. O fim do tratamento é exclusivo: não gera dose no instante final.</p>
    </div>
  </fieldset>;
}
