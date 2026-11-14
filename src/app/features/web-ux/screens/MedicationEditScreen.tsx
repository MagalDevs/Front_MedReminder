'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import ColorSelector from '../../../components/ui/ColorSelector';
import RequestFeedback, { useRetryDelay } from '../../../components/RequestFeedback/RequestFeedback';
import { updateMedication, type MedicationMetadata } from '../data/updateMedication';
import { isCalendarDate } from '../domain/agenda';
import { useDoseCollection } from '../hooks/useDoseCollection';

const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
type Item = MedicationMetadata & { id: number; quantidadeDose?: string; unidadeMedida?: string };
const fields = [ ['nome', 'Nome', 150], ['classificacao', 'Classificação', 255], ['quantidadeCaixa', 'Quantidade em estoque', 0], ['dataValidade', 'Validade', 0], ['motivo', 'Motivo', 255], ['observacao', 'Observação', 255] ] as const;
function Editor({ id }: { id: number }) {
  const auth = useAuth(); const { collection } = useDoseCollection();
  const [original, setOriginal] = useState<Item | null>(null); const [edited, setEdited] = useState<MedicationMetadata | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [notBefore, setNotBefore] = useState(0);
  const pending = useRef<AbortController | null>(null); const deadline = useRef(0); const form = useRef<HTMLFormElement>(null);
  const waiting = useRetryDelay(notBefore) > 0;
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const load = useCallback(() => {
    if (Date.now() < deadline.current) return;
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    const active = () => !controller.signal.aborted && pending.current === controller && localStorage.getItem('access_token') === token;
    return apiRequest<{ data: Item }>(`remedio/${id}`, { method: 'GET', signal: controller.signal }).then(response => {
      if (!active()) return;
      if (response?.data?.id !== id || typeof response.data.nome !== 'string') throw new RequestContractError();
      const item = response.data;
      setOriginal(item); setEdited({ nome: item.nome, classificacao: item.classificacao ?? '', quantidadeCaixa: item.quantidadeCaixa, dataValidade: item.dataValidade?.slice(0, 10) ?? '', cor: item.cor ?? '', motivo: item.motivo ?? '', observacao: item.observacao ?? '' });
      deadline.current = 0; setNotBefore(0);
    }).catch(cause => { if (active()) { deadline.current = cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0; setNotBefore(deadline.current); setError(requestErrorMessage(cause)); } })
      .finally(() => { if (active()) { pending.current = null; setLoading(false); } });
  }, [id, token]);
  useEffect(() => { void load(); return () => { pending.current?.abort(); pending.current = null; }; }, [load]);
  function retryLoad() { setLoading(true); setError(null); return load(); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!original || !edited || pending.current || waiting) return;
    const invalid: Record<string, string> = {};
    for (const [key, label, max] of fields) {
      const value = edited[key];
      if (key === 'quantidadeCaixa') { if (!Number.isSafeInteger(value) || Number(value) <= 0) invalid[key] = 'Informe um estoque inteiro maior que zero.'; }
      else if (key === 'dataValidade') { if (!isCalendarDate(String(value))) invalid[key] = 'Informe uma data válida.'; }
      else if ((key !== 'observacao' && !String(value).trim()) || String(value).length > max) invalid[key] = `${label}: informe ${key === 'observacao' ? 'até' : 'de 1 a'} ${max} caracteres.`;
    }
    if (!edited.cor.trim() || edited.cor.length > 50) invalid.cor = 'Escolha uma cor identificadora.';
    setErrors(invalid); setMessage('');
    if (Object.keys(invalid).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    const controller = new AbortController(); pending.current = controller;
    const active = () => !controller.signal.aborted && localStorage.getItem('access_token') === token;
    setSaving(true); setError(null);
    try {
      const result = await updateMedication(id, { ...original, dataValidade: original.dataValidade?.slice(0, 10), observacao: original.observacao ?? '' }, edited, { signal: controller.signal });
      if (!active()) return;
      setOriginal({ ...original, ...edited }); setMessage(result.changed ? 'Medicamento atualizado. Os horários das doses foram preservados.' : 'Nenhuma alteração para salvar.');
    } catch (cause) { if (active()) { deadline.current = cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0; setNotBefore(deadline.current); setError(requestErrorMessage(cause)); } }
    finally { if (active()) { pending.current = null; setSaving(false); } }
  }
  const firstDose = collection.items.filter(dose => dose.kind === 'complete' && dose.medicationId === id).map(dose => dose.kind === 'complete' ? dose.expectedAt : '').sort((a, b) => Date.parse(a) - Date.parse(b))[0];
  return <AppShell title="Editar medicamento" onSignOut={auth.logout}>
    <Link href="/meus-medicamentos" className="inline-flex min-h-11 items-center font-semibold text-[var(--action-primary)] underline">Voltar para Medicamentos</Link>
    {loading && <RequestFeedback kind="loading" message="Carregando medicamento…" />}
    {error && <RequestFeedback message={error} retry={!edited ? { onRetry: retryLoad, notBefore } : undefined} />}
    {message && <RequestFeedback kind="success" message={message} />}
    {edited && original && <form ref={form} noValidate onSubmit={save} className="mt-6 max-w-3xl space-y-6 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:p-6">
      <h2 className="break-words text-xl font-semibold">{original.nome}</h2>
      <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">
        {fields.map(([key, label, max]) => <FormField key={key} label={label} error={errors[key]}><input className={control} type={key === 'dataValidade' ? 'date' : key === 'quantidadeCaixa' ? 'number' : 'text'} min={key === 'quantidadeCaixa' ? 1 : undefined} maxLength={max || undefined} value={edited[key] ?? ''} onChange={event => setEdited({ ...edited, [key]: key === 'quantidadeCaixa' ? Number(event.target.value) : event.target.value })} /></FormField>)}
      </fieldset>
      <ColorSelector value={edited.cor} onChange={cor => setEdited({ ...edited, cor })} disabled={saving} error={errors.cor} />
      <section aria-labelledby="treatment-readonly" className="space-y-3 border-t border-[var(--border-default)] pt-6">
        <h2 id="treatment-readonly" className="text-xl font-semibold">Tratamento (somente leitura)</h2><p>Esta edição não altera os horários das doses</p>
        <dl className="grid gap-3 sm:grid-cols-2 [&_dt]:font-semibold"><div><dt>Primeira dose cadastrada</dt><dd>{collection.loading ? 'Carregando…' : !collection.complete ? 'Consulta incompleta' : firstDose ? new Date(firstDose).toLocaleString('pt-BR') : 'Não informada'}</dd></div><div><dt>Intervalo</dt><dd>Não informado. Consulte os horários cadastrados.</dd></div><div><dt>Duração</dt><dd>Não informada</dd></div><div><dt>Quantidade por dose</dt><dd>{original.quantidadeDose || 'Não informada'}</dd></div><div><dt>Unidade de estoque</dt><dd>{original.unidadeMedida || 'Não informada'}</dd></div></dl>
        <Link className="inline-flex min-h-11 items-center text-[var(--action-primary)] underline" href={`/meus-lembretes?medicamentoId=${id}`}>Ver horários</Link>
      </section><Button type="submit" loading={saving} loadingLabel="Salvando…" disabled={loading || waiting}>Salvar alterações</Button>
      {waiting && <RequestFeedback kind="warning" message="Aguarde antes de salvar novamente." retry={{ onRetry: () => form.current?.requestSubmit(), notBefore }} />}
    </form>}
  </AppShell>;
}
export default function MedicationEditScreen({ medicationId }: { medicationId: number }) {
  const auth = useAuth();
  if (auth.sessionStatus !== 'authenticated' || !auth.identityKey) return <RequestFeedback kind="loading" message="Verificando sessão…" />;
  if (!Number.isSafeInteger(medicationId) || medicationId < 1) return <RequestFeedback message="Medicamento inválido." />;
  return <Editor key={`${auth.identityKey}:${medicationId}`} id={medicationId} />;
}
