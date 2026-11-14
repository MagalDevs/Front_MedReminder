'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Dialog from '../../../components/ui/Dialog';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import { EMPTY_MEDICATION_FILTERS, expiryCategory, filterMedications, type FilterableMedication, type MedicationFilters } from '../domain/medication-filters';
import { localDay } from '../domain/agenda';
import { useMedicationDeletion } from '../hooks/useMedicationDeletion';
import { useLocalClock } from '../hooks/useLocalClock';

export type MedicationListItem = FilterableMedication & { quantidadeCaixa?: number; unidadeMedida?: string; quantidadeDose?: string; foto?: string; cor?: string };
const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
const link = 'inline-flex min-h-11 items-center py-2 font-semibold text-[var(--action-primary)] underline underline-offset-4';
function MedicationRow({ item, today, onDelete, disabled }: { item: MedicationListItem; today: string; onDelete: () => void; disabled: boolean }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const category = expiryCategory(item.dataValidade, today);
  return <article aria-labelledby={`medication-${item.id}`} className="flex min-w-0 flex-col gap-4 border-b border-[var(--border-default)] py-6 sm:flex-row">
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--surface-page)] text-sm text-[var(--text-muted)]">
      {item.foto && /^https?:\/\//.test(item.foto) && !photoFailed ? <Image unoptimized src={item.foto} alt={item.nome} width={64} height={64} onError={() => setPhotoFailed(true)} className="h-16 w-16 rounded-[var(--radius-control)] object-contain" /> : <span>Sem foto</span>}
    </div>
    <div className="min-w-0 flex-1 space-y-3">
      <h2 id={`medication-${item.id}`} className="break-words text-xl font-semibold">{item.nome}</h2>
      <p className="break-words text-[var(--text-muted)]">{item.classificacao || 'Não classificado'}</p>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 [&_dt]:text-sm [&_dt]:text-[var(--text-muted)] [&_dd]:break-words">
        <div><dt>Quantidade por dose</dt><dd>{item.quantidadeDose || 'Não informada'}</dd></div>
        <div><dt>Estoque</dt><dd>{item.quantidadeCaixa === undefined ? 'Não informado' : `${item.quantidadeCaixa} ${item.unidadeMedida ?? ''}`}</dd></div>
        <div><dt>Validade</dt><dd>{category === 'unknown' ? 'Sem data' : item.dataValidade!.slice(0, 10).split('-').reverse().join('/')}{category === 'expired' ? ' (vencido)' : ''}</dd></div>
      </dl>
      <div className="flex flex-wrap items-center gap-4"><Link className={link} href={`/meus-lembretes?medicamentoId=${item.id}`}>Ver horários</Link><Link className={link} href={`/meus-medicamentos/${item.id}/editar`}>Editar medicamento</Link><Button variant="secondary" onClick={onDelete} disabled={disabled}>Excluir medicamento</Button></div>
    </div>
  </article>;
}
function MedicationList({ identity, onSignOut }: { identity: string; onSignOut: () => void }) {
  const [state, setState] = useState<{ items: MedicationListItem[]; loading: boolean; error: string | null; received: boolean; retryNotBefore?: number }>({ items: [], loading: true, error: null, received: false });
  const [query, setQuery] = useState<MedicationFilters>({ ...EMPTY_MEDICATION_FILTERS });
  const request = useRef<AbortController | null>(null); const deadline = useRef(0);
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const deletion = useMedicationDeletion({ identity }); const { now, zone } = useLocalClock(); const today = localDay(now, zone);
  const load = useCallback(async () => {
    if (Date.now() < deadline.current) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const active = () => !controller.signal.aborted && request.current === controller && localStorage.getItem('access_token') === token;
    setState(previous => ({ ...previous, loading: true }));
    try {
      const response = await apiRequest<{ data?: MedicationListItem[] }>('remedio/me', { method: 'GET', signal: controller.signal });
      if (!active()) return;
      if (!Array.isArray(response?.data) || !response.data.every(item => item && Number.isSafeInteger(item.id) && item.id > 0 && typeof item.nome === 'string' && (item.dataValidade == null || typeof item.dataValidade === 'string') && (item.quantidadeCaixa === undefined || typeof item.quantidadeCaixa === 'number') && ['classificacao', 'unidadeMedida', 'quantidadeDose', 'foto'].every(key => item[key as keyof MedicationListItem] === undefined || typeof item[key as keyof MedicationListItem] === 'string')) || new Set(response.data.map(item => item.id)).size !== response.data.length) throw new RequestContractError();
      deadline.current = 0; setState({ items: response.data, loading: false, error: null, received: true });
    } catch (cause) {
      if (active()) { deadline.current = cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0; setState(previous => ({ ...previous, loading: false, error: requestErrorMessage(cause), retryNotBefore: deadline.current })); }
    } finally { if (request.current === controller) request.current = null; }
  }, [token]);
  useEffect(() => { void load(); return () => { request.current?.abort(); request.current = null; }; }, [load]);
  const available = state.items.filter(item => !deletion.deletedIds.includes(item.id));
  const result = filterMedications(available, query, today);
  const classifications = [...new Set(available.map(item => item.classificacao).filter((value): value is string => !!value))].sort();
  return <AppShell title="Medicamentos" onSignOut={onSignOut} actions={<Link className={link} href="/novo-medicamento">Adicionar medicamento</Link>}>
    <div className="space-y-6">
      {state.loading && <RequestFeedback kind="loading" message="Carregando medicamentos…" />}
      {state.error && <RequestFeedback context="Ao carregar medicamentos" message={state.error} loading={state.loading} retry={{ onRetry: load, notBefore: state.retryNotBefore }} />}
      {state.received && <>
        <section aria-label="Filtros de medicamentos" className="grid gap-4 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Nome"><input className={control} value={query.name ?? ''} onChange={event => setQuery(previous => ({ ...previous, name: event.target.value }))} /></FormField>
          <FormField label="Classificação"><select className={control} value={query.classification ?? ''} onChange={event => setQuery(previous => ({ ...previous, classification: event.target.value }))}><option value="">Todas</option>{classifications.map(value => <option key={value}>{value}</option>)}</select></FormField>
          <FormField label="Validade"><select className={control} value={query.expiry ?? 'all'} onChange={event => setQuery(previous => ({ ...previous, expiry: event.target.value as MedicationFilters['expiry'] }))}><option value="all">Todas</option><option value="expired">Vencidos</option><option value="next30days">Próximos 30 dias</option><option value="valid">Demais válidos</option><option value="unknown">Sem data</option></select></FormField>
          <Button variant="secondary" className="self-end" onClick={() => setQuery({ ...EMPTY_MEDICATION_FILTERS })}>Limpar filtros</Button>
        </section>
        <p role="status">{result.count} {result.count === 1 ? 'medicamento' : 'medicamentos'}{state.loading || state.error ? ' (última consulta confirmada)' : ''}</p>
        {!state.loading && !state.error && result.state === 'empty' && <RequestFeedback kind="empty" message="Nenhum medicamento cadastrado" />}
        {!state.loading && !state.error && result.state === 'filtered' && <RequestFeedback kind="filtered" message="Nenhum medicamento corresponde aos filtros" />}
        {result.items.length > 0 && <div className="min-w-0 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] px-4 sm:px-6">{result.items.map(item => <MedicationRow key={item.id} item={item} today={today} disabled={deletion.pending} onDelete={() => deletion.requestDeletion({ id: item.id, name: item.nome })} />)}</div>}
      </>}
    </div>
    <Dialog open={!!deletion.confirmation} onClose={deletion.cancel} title={deletion.confirmation?.title ?? 'Excluir medicamento'} description={deletion.confirmation?.description}>
      {deletion.error && <RequestFeedback message={deletion.error} retry={{ onRetry: async () => { await deletion.retry(); }, notBefore: deletion.retryNotBefore }} />}
      <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={deletion.pending} onClick={deletion.cancel}>Cancelar</Button>{!deletion.error && <Button loading={deletion.pending} loadingLabel="Excluindo…" onClick={() => void deletion.confirm()}>Confirmar exclusão</Button>}</div>
    </Dialog>
  </AppShell>;
}
export default function MedicationsScreen() {
  const auth = useAuth();
  if (auth.sessionStatus !== 'authenticated' || !auth.identityKey) return <RequestFeedback kind="loading" message={auth.sessionStatus === 'unavailable' ? 'Sessão indisponível. Tente restaurar a sessão.' : 'Verificando sessão…'} />;
  return <MedicationList key={auth.identityKey} identity={auth.identityKey} onSignOut={auth.logout} />;
}
