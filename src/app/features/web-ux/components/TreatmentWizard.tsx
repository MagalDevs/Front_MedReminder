'use client';

import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import { useTreatmentDraft } from '../contexts/TreatmentDraftContext';
import { useTreatmentSubmission } from '../hooks/useTreatmentSubmission';
import { validateDraft } from '../domain/treatment';
import MedicationStep, { medicationStepFields } from './MedicationStep';
import TreatmentStep, { treatmentStepFields } from './TreatmentStep';
import TreatmentReview from './TreatmentReview';

const steps = ['Medicamento', 'Tratamento', 'Revisão'];
export default function TreatmentWizard({ refresh, onSignOut }: { refresh: () => Promise<unknown>; onSignOut?: () => void }) {
  const { draft, identity, setIntent, setSummary } = useTreatmentDraft();
  const operation = useTreatmentSubmission({ refresh });
  const [stage, setStage] = useState(0); const [errors, setErrors] = useState<Record<string, string>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const step = operation.locked ? 2 : stage;
  useLayoutEffect(() => { stageRef.current?.focus(); }, [step]);
  function changeStage(next: number) { setErrors({}); setStage(next); }
  function advance(event: FormEvent) {
    event.preventDefault();
    if (operation.locked) return;
    const result = validateDraft(draft);
    const fields = step === 0 ? medicationStepFields : step === 1 ? treatmentStepFields : [...medicationStepFields, ...treatmentStepFields];
    const invalid = fields.filter(field => result.errors[field]);
    if (invalid.length) {
      setErrors(Object.fromEntries(invalid.map(field => [field, result.errors[field]])));
      if (step === 2) setStage(medicationStepFields.some(field => field === invalid[0]) ? 0 : 1);
      document.getElementById(`draft-${invalid[0]}`)?.focus();
      return;
    }
    setErrors({});
    if (step < 2) setStage(step + 1);
    else void operation.submit();
  }
  if (!identity) return <RequestFeedback kind="loading" message="Verificando sessão…" />;
  const intent = operation.intent;
  return <AppShell title="Adicionar medicamento" onSignOut={onSignOut}>
    <div className="max-w-3xl space-y-6">
      <p className="max-w-prose text-[var(--text-muted)]">O rascunho é mantido nesta aba enquanto você navega. Recarregar ou fechar a aba descarta o preenchimento.</p>
      {intent.phase === 'confirmed' ? <section aria-label="Tratamento confirmado" className="space-y-4">
        <RequestFeedback kind={intent.refreshFailed ? 'warning' : 'success'} message={operation.message!} retry={intent.refreshFailed ? { onRetry: async () => { await operation.refresh(); } } : undefined} />
        <h2 className="break-words text-xl font-semibold">{intent.summary.medicationName}</h2>
        <p>Primeira dose criada</p><time dateTime={intent.summary.firstDoseAt}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(intent.summary.firstDoseAt))}</time>
        <div className="flex flex-wrap gap-4"><Link className="inline-flex min-h-11 items-center underline" href={`/meus-lembretes?medicamentoId=${intent.summary.medicationId}`}>Ver horários</Link><Link className="inline-flex min-h-11 items-center underline" href="/hoje">Ir para Hoje</Link>
          {!intent.refreshFailed && <Button variant="secondary" onClick={() => { setSummary(null); setIntent({ phase: 'editing' }); changeStage(0); }}>Adicionar outro medicamento</Button>}</div>
      </section> : <>
        <ol aria-label="Etapas do cadastro" className="flex flex-wrap gap-3 border-b border-[var(--border-default)] pb-4">
          {steps.map((name, index) => <li key={name} aria-current={index === step ? 'step' : undefined} className={index === step ? 'font-semibold text-[var(--action-primary)]' : 'text-[var(--text-muted)]'}>{name}</li>)}
        </ol>
        <div ref={stageRef} tabIndex={-1} aria-label={`Etapa atual: ${steps[step]}`} className="min-w-0 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:p-6">
          <form noValidate onSubmit={advance} className="min-w-0 space-y-6">
            {Object.keys(errors).length > 0 && <RequestFeedback message={`Revise ${Object.keys(errors).length} campo(s) indicado(s) para continuar.`} />}
            {step === 0 ? <MedicationStep errors={errors} /> : step === 1 ? <TreatmentStep errors={errors} /> : <TreatmentReview />}
            {intent.phase === 'uncertain' && <><RequestFeedback kind="warning" message={operation.error || 'Não foi possível confirmar o resultado. Tente a mesma intenção novamente ou consulte os registros.'} retry={{ onRetry: async () => { await operation.retry(); }, notBefore: operation.retryNotBefore }} />
              <p>A nova tentativa usa exatamente o mesmo conteúdo.</p><Link className="inline-flex min-h-11 items-center underline" href={operation.consultHref}>Consultar registros</Link></>}
            {intent.phase === 'submitting' && <RequestFeedback kind="loading" message="Salvando tratamento…" />}
            {!operation.locked && <div className="flex flex-wrap gap-3">
              {step > 0 && <Button variant="secondary" onClick={() => changeStage(step - 1)}>Voltar</Button>}
              {step === 2 && <><Button variant="secondary" onClick={() => changeStage(0)}>Editar medicamento</Button><Button variant="secondary" onClick={() => changeStage(1)}>Editar tratamento</Button></>}
              <Button type="submit">{step === 2 ? 'Salvar tratamento' : 'Continuar'}</Button>
            </div>}
            {intent.phase === 'submitting' && <Button loading loadingLabel="Salvando tratamento…">Salvar tratamento</Button>}
          </form>
        </div>
      </>}
    </div>
  </AppShell>;
}
