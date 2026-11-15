'use client';

import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import AppShell from '../../../components/layout/AppShell';
import RequestFeedback from '../../../components/RequestFeedback/RequestFeedback';
import DoseCard from '../components/DoseCard';
import { selectAgenda } from '../domain/agenda';
import { useDoseCollection } from '../hooks/useDoseCollection';
import { useDoseMutation } from '../hooks/useDoseMutation';
import { useLocalClock } from '../hooks/useLocalClock';

export type TodayScreenProps = { mode?: 'today' | 'agenda'; medicationId?: number };
const link = 'inline-flex min-h-11 items-center py-2 font-semibold text-[var(--action-primary)] underline underline-offset-4';
function TodayAgenda({ identity, onSignOut, mode, medicationId }: TodayScreenProps & { identity: string; onSignOut: () => void }) {
  const { collection, refresh, retryNotBefore } = useDoseCollection();
  const mutation = useDoseMutation({ doses: collection.items, identity });
  const { now, zone, refreshNow } = useLocalClock();
  const selected = selectAgenda(mutation.doses, now, zone, { medicationId, complete: collection.complete });
  const agendaMode = mode === 'agenda' || medicationId !== undefined;
  const items = agendaMode ? selected.agenda : selected.today;
  const partial = !collection.complete;
  const suffix = partial ? ' (parcial)' : '';
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, dateStyle: 'full' }).format(now);
  return <AppShell title={agendaMode ? medicationId === undefined ? 'Agenda de doses' : 'Agenda do medicamento' : 'Hoje'} onSignOut={onSignOut} actions={<Link className={link} href="/novo-medicamento">Adicionar medicamento</Link>}>
    <div className="space-y-6">
      <p className="text-[var(--text-muted)]">{date}. Fuso: {zone}</p>
      {agendaMode && <Link className={link} href="/hoje">Ver Hoje</Link>}
      {collection.loading && <RequestFeedback kind="loading" message="Carregando doses…" />}
      {collection.error && <RequestFeedback context="Ao carregar doses" message={collection.error} loading={collection.loading} retry={{ onRetry: async () => { await refresh(); }, notBefore: retryNotBefore }} />}
      <p role="status">Hoje: {selected.counts.total} {selected.counts.total === 1 ? 'dose' : 'doses'}, {selected.counts.registered} {selected.counts.registered === 1 ? 'registrada' : 'registradas'} e {selected.counts.unregistered} não {selected.counts.unregistered === 1 ? 'registrada' : 'registradas'}.{suffix}</p>
      {selected.next && <section aria-label={`Próxima dose${suffix}`} className="space-y-2 rounded-[var(--radius-surface)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Próxima dose{suffix}</h2><p className="break-words text-xl font-semibold"><time dateTime={selected.next.expectedAt}>{selected.next.timeLabel}</time> {selected.next.medicationName}</p><p>{selected.next.amountLabel}</p>
      </section>}
      {collection.complete && items.length === 0 && <RequestFeedback kind="empty" message={agendaMode ? 'Nenhuma dose encontrada nesta agenda' : 'Nenhuma dose prevista para hoje'} />}
      {items.length > 0 && <section aria-labelledby="dose-list-title"><h2 id="dose-list-title" className="mb-3 text-xl font-semibold">{agendaMode ? 'Agenda de doses' : 'Doses de hoje'}</h2>
        <ul aria-label={agendaMode ? 'Agenda de doses' : 'Doses de hoje'} className="min-w-0 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] px-4 sm:px-6">{items.map(dose => <li key={dose.id} data-dose-id={dose.id}><DoseCard dose={dose} now={now} zone={zone} status={mutation.status[dose.id]} onMutate={(id, value) => { refreshNow(); return mutation.mutate(id, value); }} onRetry={() => { refreshNow(); return mutation.retry(dose.id); }} /></li>)}</ul>
      </section>}
      {selected.incomplete.length > 0 && <section aria-labelledby="incomplete-title" className="space-y-3"><h2 id="incomplete-title" className="text-xl font-semibold">Dados incompletos</h2><p className="text-[var(--text-muted)]">Registros incompletos da coleção não entram nos totais ou filtros.</p><ul className="divide-y divide-[var(--border-default)]">{selected.incomplete.map((dose, index) => <li key={dose.id ?? `incomplete-${index}`} className="py-3"><p>{dose.id ? `Registro ${dose.id}: ` : ''}{dose.reason}</p></li>)}</ul></section>}
      {!agendaMode && <Link className={link} href="/historico">Ver Histórico</Link>}
    </div>
  </AppShell>;
}
export default function TodayScreen(props: TodayScreenProps = {}) {
  const auth = useAuth();
  if (auth.sessionStatus !== 'authenticated' || !auth.identityKey) return <RequestFeedback kind="loading" message={auth.sessionStatus === 'unavailable' ? 'Sessão indisponível. Tente restaurar a sessão.' : 'Verificando sessão…'} />;
  return <TodayAgenda key={auth.identityKey} {...props} identity={auth.identityKey} onSignOut={auth.logout} />;
}
