import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useContext, useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { LembreteContext, LembreteProvider } from '@/app/contexts/lembreteContext';
import AlertaLembretes from '@/app/components/AlarmeDose/AlertaLembrete';
import { loadDoseCollection } from '@/app/features/web-ux/data/loadDoseCollection';
import { useDoseMutation } from '@/app/features/web-ux/hooks/useDoseMutation';
import { type DoseView } from '@/app/features/web-ux/domain/agenda';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const row = (id: number, future = false, registered = false) => ({ id, tomado: registered, data_dose: future ? '2026-11-14T12:01:00-03:00' : '2026-11-14T08:00:00-03:00', remedio: { id: 17, nome: `Medicamento ${id}`, quantidadeDose: '1 mg', cor: 'Azul' } });
const page = (index: number, registered = false) => ({ data: index === 1 ? Array.from({ length: 100 }, (_, index) => row(index + 1, false, index === 0 && registered)) : [row(101, true)], pagination: { page: index, limit: 100, total: 101, totalPages: 2 } });
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A'); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
const views: DoseView[] = [{ kind: 'complete', id: 1, medicationId: 17, medicationName: 'Medicamento 1', amountLabel: '1 mg', expectedAt: '2026-11-14T08:00:00-03:00', registered: false }];
function Probe() {
  const context = useContext(LembreteContext)!; const auth = useAuth(); const mutation = useDoseMutation({ doses: views, identity: auth.identityKey }); const [result, setResult] = useState<boolean | void>();
  return <><button onClick={() => void context.getLembretes().then(setResult)}>Atualizar alarmes</button><button onClick={() => void mutation.mutate(1, true)}>Registrar dose da tela</button><output aria-label="Resultado">{String(result)}</output><output aria-label="Quantidade">{context.lembretes.length}</output><output aria-label="Primeira dose">{String(context.lembretes.find(dose => dose.id === 1)?.tomado)}</output></>;
}
it('alarm pagination loads every page and schedules the valid future dose beyond the first 100 rows', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('/usuario/me') ? json({ data: { id: 7, nome: 'Ana' } }) : json(page(Number(new URL(String(input)).searchParams.get('page')))));
  render(<AuthProvider><LembreteProvider><Probe /><AlertaLembretes /></LembreteProvider></AuthProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); }); expect(screen.getByLabelText('Quantidade')).toHaveTextContent('101'); expect(vi.mocked(fetch).mock.calls.filter(([input]) => new URL(String(input)).pathname === '/dose/me').map(([input]) => new URL(String(input)).searchParams.get('page'))).toEqual(['1', '2']);
  expect(vi.getTimerCount()).toBe(1); await act(async () => { await vi.advanceTimersByTimeAsync(60_000); }); expect(screen.getByRole('dialog', { name: 'Lembrete de dose' })).toHaveTextContent('Medicamento 101'); expect(screen.getByRole('button', { name: 'Registrar dose de Medicamento 101 às 12:01' })).toBeEnabled();
});
it('alarm pagination failed final page returns false and retains confirmed snapshot until a manual read succeeds', async () => {
  let initial = true; let registered = false; let fail = true;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (String(input).endsWith('/usuario/me')) return json({ data: { id: 7, nome: 'Ana' } });
    if (init?.method === 'PUT') { registered = true; return json({ data: row(1, false, true) }); }
    if (initial) { initial = false; return json({ data: [row(1)] }); }
    const index = Number(new URL(String(input)).searchParams.get('page')); return index === 2 && fail ? json({}, 503) : json(page(index, registered));
  });
  render(<AuthProvider><LembreteProvider><Probe /></LembreteProvider></AuthProvider>); await waitFor(() => expect(screen.getByLabelText('Quantidade')).toHaveTextContent('1')); fireEvent.click(screen.getByText('Registrar dose da tela')); await waitFor(() => expect(screen.getByLabelText('Primeira dose')).toHaveTextContent('true'));
  fireEvent.click(screen.getByText('Atualizar alarmes')); await waitFor(() => expect(screen.getByLabelText('Resultado')).toHaveTextContent('false')); expect(screen.getByRole('alert')).toHaveTextContent('temporariamente indisponível'); expect(screen.getByLabelText('Quantidade').textContent).toBe('1'); expect(screen.getByLabelText('Primeira dose')).toHaveTextContent('true');
  fail = false; fireEvent.click(screen.getByText('Atualizar alarmes')); await waitFor(() => expect(screen.getByLabelText('Resultado')).toHaveTextContent('true')); expect(screen.getByLabelText('Quantidade')).toHaveTextContent('101'); expect(screen.getByLabelText('Primeira dose')).toHaveTextContent('true'); expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
});
it('raw transport retention is opt-in and preserves page order without changing the default collection shape', async () => {
  vi.mocked(fetch).mockImplementation(async input => json(page(Number(new URL(String(input)).searchParams.get('page')))));
  const standard = await loadDoseCollection(); expect(Object.hasOwn(standard, 'rawItems')).toBe(false); expect(standard.items).toHaveLength(101);
  const raw = await loadDoseCollection({ includeRaw: true }); expect(raw.complete).toBe(true); expect(raw.rawItems).toEqual([...page(1).data, ...page(2).data]); expect(raw.items).toEqual(standard.items);
});
