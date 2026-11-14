'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import AppShell from '../../../components/layout/AppShell';
import FormField from '../../../components/ui/FormField';
import Button from '../../../components/ui/Button';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import DoseCard from '../components/DoseCard';
import { selectAgenda, type AgendaFilter, type CompleteDose, type HistoryPeriod } from '../domain/agenda';
import { useDoseCollection } from '../hooks/useDoseCollection';
import { useDoseMutation } from '../hooks/useDoseMutation';
import { useLocalClock } from '../hooks/useLocalClock';

const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
const link = 'inline-flex min-h-11 items-center py-2 font-semibold text-[var(--action-primary)] underline underline-offset-4';
function History({ identity, onSignOut }: { identity: string; onSignOut: () => void }) {
  const { collection, refresh, retryNotBefore } = useDoseCollection();
  const mutation = useDoseMutation({ doses: collection.items, identity });
  const { now, zone, refreshNow } = useLocalClock();
  const [filter, setFilter] = useState<AgendaFilter>({ period: 'all', state: 'all' });
  const selected = selectAgenda(mutation.doses, now, zone, { ...filter, complete: collection.complete });
  const all = selectAgenda(mutation.doses, now, zone, { complete: collection.complete });
  const medications = [...new Map(mutation.doses.filter((dose): dose is CompleteDose => dose.kind === 'complete').map(dose => [dose.medicationId, dose.medicationName])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR') || a[0] - b[0]);
  const registered = selected.history.filter(dose => dose.registered).length;
  return <AppShell title="Histórico" onSignOut={onSignOut} actions={<Link className={link} href="/hoje">Ver Hoje</Link>}>
    <div className="space-y-6">
      <p className="max-w-prose text-[var(--text-muted)]">Datas e horas indicam o horário previsto da dose. Registros até agora, no fuso {zone}.</p>
      {collection.loading && <RequestFeedback kind="loading" message="Carregando histórico…" />}
      {collection.error && <RequestFeedback context="Ao carregar histórico" message={collection.error} loading={collection.loading} retry={{ onRetry: async () => { await refresh(); }, notBefore: retryNotBefore }} />}
      <section aria-label="Filtros do histórico" className="grid min-w-0 gap-4 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Período"><select className={control} value={filter.period ?? 'all'} onChange={event => setFilter(previous => ({ ...previous, period: event.target.value as HistoryPeriod }))}><option value="all">Todo o histórico até agora</option><option value="today">Hoje</option><option value="7days">Últimos 7 dias</option><option value="30days">Últimos 30 dias</option></select></FormField>
        <FormField label="Medicamento"><select className={control} value={filter.medicationId ?? ''} onChange={event => setFilter(previous => ({ ...previous, medicationId: event.target.value ? Number(event.target.value) : undefined }))}><option value="">Todos</option>{filter.medicationId !== undefined && !medications.some(([id]) => id === filter.medicationId) && <option value={filter.medicationId}>Medicamento {filter.medicationId} (ainda não carregado)</option>}{medications.map(([id, name]) => <option key={id} value={id}>{name} (ID {id})</option>)}</select></FormField>
        <FormField label="Estado"><select className={control} value={filter.state ?? 'all'} onChange={event => setFilter(previous => ({ ...previous, state: event.target.value as AgendaFilter['state'] }))}><option value="all">Todos</option><option value="registered">Registradas</option><option value="unregistered">Não registradas</option></select></FormField>
        <Button variant="secondary" className="self-end" onClick={() => setFilter({ period: 'all', state: 'all' })}>Limpar filtros</Button>
      </section>
      <p role="status">{selected.historyCount} doses; {registered} registrada(s); {selected.historyCount - registered} não registrada(s).{!collection.complete ? ' (parcial)' : ''}</p>
      {collection.complete && selected.historyCount === 0 && <RequestFeedback kind={all.historyCount === 0 ? 'empty' : 'filtered'} message={all.historyCount === 0 ? 'Nenhuma dose no histórico até agora' : 'Nenhuma dose corresponde aos filtros'} />}
      {selected.historyCount > 0 && <section aria-labelledby="history-doses-title"><h2 id="history-doses-title" className="mb-3 text-xl font-semibold">Doses do histórico</h2><ul aria-label="Doses do histórico" className="min-w-0 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] px-4 sm:px-6">{selected.history.map(dose => <li key={dose.id} data-dose-id={dose.id}><DoseCard dose={dose} now={now} zone={zone} status={mutation.status[dose.id]} onMutate={(id, value) => { refreshNow(); return mutation.mutate(id, value); }} onRetry={() => { refreshNow(); return mutation.retry(dose.id); }} /></li>)}</ul></section>}
      {selected.incomplete.length > 0 && <section aria-labelledby="history-incomplete-title" className="space-y-3"><h2 id="history-incomplete-title" className="text-xl font-semibold">Dados incompletos</h2><p className="text-[var(--text-muted)]">Registros incompletos da coleção não entram nos totais ou filtros.</p><ul className="divide-y divide-[var(--border-default)]">{selected.incomplete.map((dose, index) => <li key={dose.id ?? `incomplete-${index}`} className="py-3">{dose.id ? `Registro ${dose.id}: ` : ''}{dose.reason}</li>)}</ul></section>}
    </div>
  </AppShell>;
}
export default function HistoryScreen() {
  const auth = useAuth();
  if (auth.sessionStatus !== 'authenticated' || !auth.identityKey) return <RequestFeedback kind="loading" message={auth.sessionStatus === 'unavailable' ? 'Sessão indisponível. Tente restaurar a sessão.' : 'Verificando sessão…'} />;
  return <History key={auth.identityKey} identity={auth.identityKey} onSignOut={auth.logout} />;
}
