'use client';

import { useCallback } from 'react';
import BuscaMedicamento, { type Medicamento } from '../../../components/CardBusca/cardBusca';
import FormField from '../../../components/ui/FormField';
import ColorSelector from '../../../components/ui/ColorSelector';
import { useTreatmentDraft } from '../contexts/TreatmentDraftContext';

export const medicationStepFields = ['medicationName', 'classification', 'stock', 'boxUnit', 'expiry', 'photo', 'color', 'reason', 'notes'] as const;
const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
export default function MedicationStep({ errors = {} }: { errors?: Record<string, string> }) {
  const { draft, updateDraft, intent } = useTreatmentDraft();
  const onSelect = useCallback((medication: Medicamento) => {
    updateDraft({ medicationName: medication.NOME_PRODUTO.trim(), classification: medication.DESCRIÇÃO.trim() });
  }, [updateDraft]);
  return <fieldset disabled={intent.phase !== 'editing'} className="min-w-0 space-y-6">
    <legend className="mb-4 text-xl font-semibold">Medicamento</legend>
    <BuscaMedicamento onSelect={onSelect} onManual={name => updateDraft({ medicationName: name })} />
    <p className="text-[var(--text-muted)]">Selecione no catálogo ou preencha os dados abaixo.</p>
    <div className="grid min-w-0 gap-6 sm:grid-cols-2">
      <FormField id="draft-medicationName" label="Nome do medicamento" error={errors.medicationName}><input className={control} required maxLength={150} value={draft.medicationName} onChange={event => updateDraft({ medicationName: event.target.value })} /></FormField>
      <FormField id="draft-classification" label="Classificação" error={errors.classification} description="Opcional"><input className={control} maxLength={255} value={draft.classification} onChange={event => updateDraft({ classification: event.target.value })} /></FormField>
      <FormField id="draft-stock" label="Quantidade em estoque" error={errors.stock}><input className={control} required inputMode="numeric" value={draft.stock} onChange={event => updateDraft({ stock: event.target.value })} /></FormField>
      <FormField id="draft-boxUnit" label="Unidade do estoque" error={errors.boxUnit} description="Não altera a quantidade por dose"><input className={control} required maxLength={50} value={draft.boxUnit} onChange={event => updateDraft({ boxUnit: event.target.value })} /></FormField>
      <FormField id="draft-expiry" label="Validade" error={errors.expiry}><input className={control} required type="date" value={draft.expiry} onChange={event => updateDraft({ expiry: event.target.value })} /></FormField>
      <FormField id="draft-photo" label="URL da foto" error={errors.photo} description="Endereço de uma imagem; não há envio de arquivo"><input className={control} required maxLength={255} type="url" value={draft.photo} onChange={event => updateDraft({ photo: event.target.value })} /></FormField>
    </div>
    <ColorSelector id="draft-color" value={draft.color} error={errors.color} onChange={color => updateDraft({ color })} />
    <FormField id="draft-reason" label="Motivo" error={errors.reason} description="Opcional"><input className={control} maxLength={255} value={draft.reason} onChange={event => updateDraft({ reason: event.target.value })} /></FormField>
    <FormField id="draft-notes" label="Observação" error={errors.notes} description="Opcional"><textarea className={control} rows={3} maxLength={255} value={draft.notes} onChange={event => updateDraft({ notes: event.target.value })} /></FormField>
  </fieldset>;
}
