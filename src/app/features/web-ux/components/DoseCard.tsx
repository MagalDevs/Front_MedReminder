'use client';

import { useId, useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import Dialog from '../../../components/ui/Dialog';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import { doseState, selectAgenda, type DoseView } from '../domain/agenda';
import type { DoseMutationStatus } from '../hooks/useDoseMutation';

export type DoseCardProps = {
  dose: DoseView; now: Date; zone?: string; status?: DoseMutationStatus;
  onMutate: (id: number, registered: boolean) => Promise<boolean>; onRetry?: () => Promise<boolean>;
};
const labels = { scheduled: 'Programada', due: 'Pendente', overdue: 'Atrasada', registered: 'Registrada' };
export default function DoseCard({ dose, now, zone, status, onMutate, onRetry }: DoseCardProps) {
  const titleId = useId(); const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (dose.kind === 'incomplete') return <article className="border-b border-[var(--border-default)] py-4 text-[var(--text-primary)]"><h3 className="font-semibold">Dados incompletos</h3><p>{dose.reason}</p></article>;
  const item = selectAgenda([dose], now, zone).agenda[0];
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dose.expectedAt));
  const scheduled = `${date} às ${item.timeLabel}`;
  const busy = status?.pending ?? false;
  async function register() {
    if (dose.kind === 'complete' && !busy && doseState(dose, Date.now()) !== 'scheduled') await onMutate(dose.id, true);
  }
  async function correct() {
    if (!busy && dose.kind === 'complete' && await onMutate(dose.id, false)) setConfirming(false);
  }
  function close() { if (!busy) setConfirming(false); }
  return <article aria-labelledby={titleId} className="min-w-0 border-b border-[var(--border-default)] py-4 text-[var(--text-primary)]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 id={titleId} className="break-words text-xl font-semibold">{dose.medicationName}</h3>
        <p className="mt-1">{dose.amountLabel}</p>
        <p className="mt-1 tabular-nums"><span className="text-[var(--text-muted)]">Horário previsto: </span><time dateTime={dose.expectedAt}>{scheduled}</time></p>
        <p className="mt-2 font-semibold">{labels[item.state]}</p>
      </div>
      {item.state === 'registered' ? <Button variant="secondary" loading={busy} loadingLabel="Corrigindo registro…" aria-label={`Corrigir registro de ${dose.medicationName}, previsto para ${scheduled}`} onClick={() => setConfirming(true)}>Corrigir registro</Button>
        : item.state !== 'scheduled' ? <Button loading={busy} loadingLabel="Registrando dose…" aria-label={busy ? `Registrando dose de ${dose.medicationName}` : `Registrar dose de ${dose.medicationName}, prevista para ${scheduled}`} onClick={() => void register()}>Registrar dose</Button> : null}
    </div>
    {status?.error && !confirming && <div className="mt-3"><RequestFeedback message={status.error} context={`Dose de ${dose.medicationName}`} retry={onRetry ? { onRetry: async () => { await onRetry(); }, notBefore: status.retryNotBefore } : undefined} /></div>}
    <Dialog open={confirming} onClose={close} title={`Corrigir registro de ${dose.medicationName}?`} description={`A dose prevista para ${scheduled} voltará a não registrada.`} initialFocusRef={cancelRef}>
      {status?.error && <RequestFeedback message={status.error} context={`Dose de ${dose.medicationName}`} retry={onRetry ? { onRetry: async () => { if (await onRetry()) setConfirming(false); }, notBefore: status.retryNotBefore } : undefined} />}
      <div className="flex flex-wrap gap-3"><Button variant="secondary" ref={cancelRef} disabled={busy} onClick={close}>Cancelar</Button><Button loading={busy} loadingLabel="Corrigindo…" onClick={() => void correct()}>Confirmar correção</Button></div>
    </Dialog>
  </article>;
}
