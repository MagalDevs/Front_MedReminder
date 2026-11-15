import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useContext, useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import Lembrete from '@/app/components/AlarmeDose/Lembrete';
import AlertaLembretes from '@/app/components/AlarmeDose/AlertaLembrete';
import { LembreteContext, LembreteProvider } from '@/app/contexts/lembreteContext';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { useDoseMutation } from '@/app/features/web-ux/hooks/useDoseMutation';
import { useDoseCollection } from '@/app/features/web-ux/hooks/useDoseCollection';
import { type DoseView } from '@/app/features/web-ux/domain/agenda';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const props = { id: 1, dataHora: '2026-11-14T08:00:00-03:00', medicamentoNome: 'Vitamina A', quantidadeDose: '1,5 mg', cor: 'Amarelo' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A'); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
function Presentation() { const [open, setOpen] = useState(false); return <><button onClick={() => setOpen(true)}>Abrir lembrete</button>{open && <Lembrete {...props} onClose={() => setOpen(false)} />}</>; }
it('WUX_DOSE_09', () => {
  render(<Presentation />); const opener = screen.getByRole('button', { name: 'Abrir lembrete' }); opener.focus(); fireEvent.click(opener);
  const dialog = screen.getByRole('dialog', { name: 'Lembrete de dose' }); expect(dialog).toHaveTextContent('Fechar este lembrete não registra nem adia a dose.'); expect(dialog).toHaveTextContent('Vitamina A'); expect(dialog).toHaveTextContent('1,5 mg'); expect(dialog).toHaveTextContent('08:00'); expect(dialog).toHaveTextContent('Amarelo');
  expect(screen.getByRole('button', { name: 'Fechar Lembrete de dose' })).toHaveFocus(); fireEvent.click(screen.getByRole('button', { name: 'Fechar Lembrete de dose' })); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(opener).toHaveFocus(); expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(opener); fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
});
it('T33 sends once and confirms before refreshing, failed refresh retries only reading', async () => {
  let resolve!: (value: Response) => void; vi.mocked(fetch).mockReturnValue(new Promise(done => { resolve = done; })); const refresh = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true); const close = vi.fn();
  render(<LembreteContext.Provider value={{ lembretes: [], lembretesHoje: [], getLembretes: refresh }}><Lembrete {...props} onClose={close} /></LembreteContext.Provider>);
  const register = screen.getByRole('button', { name: 'Registrar dose de Vitamina A às 08:00' }); fireEvent.click(register); fireEvent.click(register); expect(fetch).toHaveBeenCalledTimes(1); expect(register).toBeDisabled(); expect(close).not.toHaveBeenCalled(); expect(refresh).not.toHaveBeenCalled();
  await act(async () => resolve(json({ data: { id: 1, tomado: true, data_dose: props.dataHora } }))); await screen.findByText('Dose registrada. A atualização dos lembretes não foi concluída.'); expect(close).not.toHaveBeenCalled();
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ tomado: true }); expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/dose\/1$/);
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lembretes' })); await waitFor(() => expect(close).toHaveBeenCalledTimes(1)); expect(fetch).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(2);
});
it('T33 failed or malformed confirmation remains visible and a future dose cannot be registered', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 99, tomado: true, data_dose: props.dataHora } })); const close = vi.fn(); const view = render(<Lembrete {...props} onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: /Registrar dose de/ })); await screen.findByRole('alert'); expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: /Registrar dose de/ })).toBeEnabled(); expect(screen.queryByText(/Dose registrada\./)).not.toBeInTheDocument();
  view.rerender(<Lembrete {...props} id={2} dataHora="2026-11-14T13:00:00-03:00" onClose={close} />); const future = screen.getByRole('button', { name: /Registrar dose de/ }); expect(future).toBeDisabled(); fireEvent.click(future); expect(fetch).toHaveBeenCalledTimes(1);
});
const stored = { id: 1, tomado: false, data_dose: props.dataHora, remedioId: 17, remedio: { id: 17, nome: props.medicamentoNome, quantidadeDose: props.quantidadeDose, cor: props.cor } };
const views: DoseView[] = [1, 2].map(id => ({ kind: 'complete', id, medicationId: 17, medicationName: props.medicamentoNome, expectedAt: props.dataHora, amountLabel: props.quantidadeDose, registered: false }));
function Mirror() {
  const auth = useAuth(); const mutation = useDoseMutation({ doses: views, identity: auth.identityKey }); const legacy = useContext(LembreteContext);
  return <><button onClick={() => void mutation.mutate(1, true)}>Registrar pela tela</button><button onClick={() => void mutation.mutate(2, true)}>Registrar outra dose</button><output aria-label="Espelho">{mutation.doses.map(dose => dose.kind === 'complete' ? `${dose.id}:${dose.registered}` : '').join(',')}</output><output aria-label="Legado">{String(legacy?.lembretes.find(dose => dose.id === 1)?.tomado)}</output></>;
}
function CollectionObserver() { const { collection } = useDoseCollection(); return <output aria-label="Coleção">{collection.loading ? 'loading' : collection.items.map(dose => dose.kind === 'complete' ? String(dose.registered) : 'incomplete').join(',')}</output>; }
it('T33 confirmed alarm registration synchronizes screen and legacy snapshots while failed refresh never resends PUT', async () => {
  let reads = 0;
  vi.mocked(fetch).mockImplementation(async (input, init) => String(input).endsWith('/usuario/me') ? json({ data: { id: 7, nome: 'Ana' } }) : init?.method === 'PUT' ? json({ data: { id: 1, tomado: true, data_dose: props.dataHora } }) : ++reads === 1 ? json({ data: [stored] }) : json({}, 503));
  render(<AuthProvider><LembreteProvider><Mirror /><Lembrete {...props} onClose={vi.fn()} /></LembreteProvider></AuthProvider>);
  await waitFor(() => expect(screen.getByLabelText('Legado')).toHaveTextContent('false')); fireEvent.click(screen.getByRole('button', { name: /Registrar dose de/ }));
  await screen.findByText('Dose registrada. A atualização dos lembretes não foi concluída.'); expect(screen.getByLabelText('Espelho')).toHaveTextContent('1:true,2:false'); expect(screen.getByLabelText('Legado')).toHaveTextContent('true'); expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
});
it('T33 real alarm queue retains its own confirmed dialog for failed refresh and GET-only retry, then advances and honors an external confirmation', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  const rows = [
    { ...stored, data_dose: '2026-11-14T12:01:00-03:00' },
    { ...stored, id: 2, data_dose: '2026-11-14T12:02:00-03:00' },
  ];
  let failedRefresh = true;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === '/usuario/me') return json({ data: { id: 7, nome: 'Ana' } });
    if (init?.method === 'PUT') {
      const item = rows.find(row => path === `/dose/${row.id}`)!;
      expect(JSON.parse(String(init.body))).toEqual({ tomado: true });
      item.tomado = true;
      return json({ data: item });
    }
    expect(path).toBe('/dose/me');
    return rows[0].tomado && failedRefresh ? json({}, 503) : json({ data: rows });
  });
  const queuedViews: DoseView[] = rows.map(row => ({ kind: 'complete', id: row.id, medicationId: 17, medicationName: props.medicamentoNome, expectedAt: row.data_dose, amountLabel: props.quantidadeDose, registered: false }));
  function ExternalConfirmation() {
    const auth = useAuth();
    const mutation = useDoseMutation({ identity: auth.identityKey, doses: queuedViews });
    const legacy = useContext(LembreteContext)!;
    return <><button onClick={() => void mutation.mutate(2, true)}>Confirmar segunda pela tela</button><output aria-label="Fila confirmada">{legacy.lembretes.map(row => `${row.id}:${row.tomado}`).join(',')}</output></>;
  }
  render(<AuthProvider><LembreteProvider><ExternalConfirmation /><AlertaLembretes /></LembreteProvider></AuthProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.getByLabelText('Fila confirmada')).toHaveTextContent('1:false,2:false');
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar dose de Vitamina A às 12:01' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  const dialog = screen.getByRole('dialog', { name: 'Lembrete de dose' });
  expect(dialog).toHaveTextContent('Dose registrada. A atualização dos lembretes não foi concluída.');
  expect(dialog).toHaveTextContent('Ao carregar lembretes: O serviço está temporariamente indisponível. Tente novamente mais tarde.');
  expect(screen.getByLabelText('Fila confirmada')).toHaveTextContent('1:true,2:false');
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
  const reads = vi.mocked(fetch).mock.calls.filter(([input]) => new URL(String(input)).pathname === '/dose/me').length;
  failedRefresh = false;
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lembretes' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.filter(([input]) => new URL(String(input)).pathname === '/dose/me')).toHaveLength(reads + 1);
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(screen.getByRole('button', { name: 'Registrar dose de Vitamina A às 12:02' })).toBeEnabled();
  fireEvent.click(screen.getByText('Confirmar segunda pela tela'));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Fila confirmada')).toHaveTextContent('1:true,2:true');
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(2);
});
it('T33 screen confirmations preserve another pending ID, sync legacy and cannot be undone by an older GET', async () => {
  let readLegacy!: (response: Response) => void; let readCollection!: (response: Response) => void; let writeOther!: (response: Response) => void; let reads = 0;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (String(input).endsWith('/usuario/me')) return json({ data: { id: 7, nome: 'Ana' } });
    if (init?.method === 'PUT' && String(input).endsWith('/2')) return new Promise(done => { writeOther = done; });
    if (init?.method === 'PUT') return json({ data: { id: 1, tomado: true, data_dose: props.dataHora } });
    return new Promise(done => { if (++reads === 1) readCollection = done; else readLegacy = done; });
  });
  render(<AuthProvider><LembreteProvider><Mirror /><CollectionObserver /></LembreteProvider></AuthProvider>);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3)); fireEvent.click(screen.getByText('Registrar outra dose')); const pendingOther = vi.mocked(fetch).mock.calls[3][1]!.signal!; fireEvent.click(screen.getByText('Registrar pela tela'));
  await waitFor(() => expect(screen.getByLabelText('Espelho')).toHaveTextContent('1:true,2:false')); expect(pendingOther.aborted).toBe(false);
  await act(async () => { readLegacy(json({ data: [stored] })); readCollection(json({ data: [stored] })); }); await waitFor(() => expect(screen.getByLabelText('Coleção')).toHaveTextContent('true')); expect(screen.getByLabelText('Legado')).toHaveTextContent('true');
  await act(async () => writeOther(json({ data: { id: 2, tomado: true, data_dose: props.dataHora } }))); await waitFor(() => expect(screen.getByLabelText('Espelho')).toHaveTextContent('1:true,2:true'));
});
it('T33 failed PUT does not update either presentation', async () => {
  vi.mocked(fetch).mockImplementation(async (input, init) => String(input).endsWith('/usuario/me') ? json({ data: { id: 7, nome: 'Ana' } }) : init?.method === 'PUT' ? json({}, 503) : json({ data: [stored] }));
  render(<AuthProvider><LembreteProvider><Mirror /></LembreteProvider></AuthProvider>); await waitFor(() => expect(screen.getByLabelText('Legado')).toHaveTextContent('false')); fireEvent.click(screen.getByText('Registrar pela tela')); await act(async () => {});
  expect(screen.getByLabelText('Espelho')).toHaveTextContent('1:false,2:false'); expect(screen.getByLabelText('Legado')).toHaveTextContent('false'); expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
});
it.each([204, 200])('T33 incomplete success body at status %s never confirms or closes the reminder', async status => {
  vi.mocked(fetch).mockResolvedValueOnce(status === 204 ? new Response(null, { status }) : json({}, status)); const close = vi.fn(); render(<Lembrete {...props} onClose={close} />); fireEvent.click(screen.getByRole('button', { name: /Registrar dose de/ }));
  await screen.findByRole('alert'); expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: /Registrar dose de/ })).toBeEnabled(); expect(screen.queryByText(/Dose registrada\./)).not.toBeInTheDocument(); expect(fetch).toHaveBeenCalledTimes(1);
});
it('T33 incomplete siblings do not suppress a valid alarm or receive invented times and registration', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  const valid = { ...stored, data_dose: '2026-11-14T12:01:00-03:00' };
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('/usuario/me') ? json({ data: { id: 7, nome: 'Ana' } }) : json({ data: [valid, { ...stored, id: 2, data_dose: '2026-11-14' }, { ...stored, id: 3, data_dose: '2026-11-14T12:02:00-03:00', remedio: null }] }));
  render(<AuthProvider><LembreteProvider><AlertaLembretes /></LembreteProvider></AuthProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); }); expect(vi.getTimerCount()).toBe(1); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); }); expect(screen.getByRole('dialog', { name: 'Lembrete de dose' })).toHaveTextContent('Vitamina A'); expect(screen.getByRole('button', { name: 'Registrar dose de Vitamina A às 12:01' })).toBeEnabled(); fireEvent.click(screen.getByRole('button', { name: 'Fechar Lembrete de dose' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
});
