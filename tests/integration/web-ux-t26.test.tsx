import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import TodayScreen from '@/app/features/web-ux/screens/TodayScreen';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { clearNavigationFeedback, consumeNavigationFeedback } from '@/app/utils/navigation-feedback';
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/hoje', useRouter: () => router }));
const user = { id: 7, nome: 'Ana' };
const json = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
const row = (id: number, at: string, registered = false, medicationId = 7, name = 'Vitamina A') => ({ id, data_dose: at, tomado: registered, remedio: { id: medicationId, nome: name, quantidadeDose: '1,5 mg' } });
const rows = [row(4, '2026-11-13T16:00:00Z'), row(2, '2026-11-13T15:00:00Z'), row(3, '2026-11-13T14:50:00Z', true), row(1, '2026-11-13T14:00:00Z'), row(5, '2026-11-14T16:00:00Z')];
beforeEach(() => {
  router.push.mockReset(); clearNavigationFeedback();
  localStorage.setItem('access_token', 'token-A'); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : rows }));
});
function mount(props: Parameters<typeof TodayScreen>[0] = {}) { return render(<AuthProvider><TodayScreen {...props} /></AuthProvider>); }
function pending() { let resolve!: (value: Response) => void; const promise = new Promise<Response>(done => { resolve = done; }); return { resolve, promise }; }
it('WUX_DAY_02', async () => {
  mount(); const list = await screen.findByRole('list', { name: 'Doses de hoje' }); const items = within(list).getAllByRole('listitem'); expect(items.map(item => item.getAttribute('data-dose-id'))).toEqual(['1', '3', '2', '4']);
  for (const item of items) { expect(item).toHaveTextContent('Vitamina A'); expect(item).toHaveTextContent('1,5 mg'); expect(item).toHaveTextContent('Horário previsto: 13/11/2026'); }
  for (const [index, time, state] of [[0, '11:00', 'Atrasada'], [1, '11:50', 'Registrada'], [2, '12:00', 'Pendente'], [3, '13:00', 'Programada']] as const) { expect(items[index]).toHaveTextContent(time); expect(items[index]).toHaveTextContent(state); }
  const next = screen.getByRole('region', { name: 'Próxima dose' }); expect(next).toHaveTextContent('13:00'); expect(next).toHaveTextContent('Vitamina A'); expect(screen.getByText('4 doses hoje; 1 registrada(s); 3 não registrada(s).')).toBeVisible();
  expect(within(items[3]).queryByRole('button', { name: /Registrar dose/ })).not.toBeInTheDocument();
});
it('WUX_DAY_08', async () => {
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : [{ id: 1, data_dose: '2026-11-13' }, { id: 2, data_dose: 'inválida' }, { id: 3, data_dose: '2026-11-13T15:00:00Z', tomado: false }] }));
  mount(); const incomplete = await screen.findByRole('region', { name: 'Dados incompletos' });
  expect(incomplete).toHaveTextContent('Horário não informado'); expect(incomplete).toHaveTextContent('Data inválida'); expect(incomplete).toHaveTextContent('Medicamento não informado');
  expect(within(incomplete).queryByRole('button')).not.toBeInTheDocument(); expect(incomplete.querySelector('time')).toBeNull(); expect(screen.getByText('0 doses hoje; 0 registrada(s); 0 não registrada(s).')).toBeVisible();
});
it('T26 successful empty day offers History and Add without calling future doses today', async () => {
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : [row(5, '2026-11-14T16:00:00Z')] }));
  mount(); await screen.findByText('Nenhuma dose prevista para hoje'); expect(screen.getByRole('link', { name: 'Ver Histórico' })).toHaveAttribute('href', '/historico'); expect(screen.getByRole('link', { name: 'Adicionar medicamento' })).toHaveAttribute('href', '/novo-medicamento'); expect(screen.queryByRole('article')).not.toBeInTheDocument();
});
it('T26 medication agenda keeps future occurrences and filters identical names by ID', async () => {
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : [row(1, '2026-11-13T14:00:00Z'), row(2, '2026-11-14T16:00:00Z'), row(3, '2026-11-14T17:00:00Z', false, 8)] }));
  mount({ mode: 'agenda', medicationId: 7 }); const list = await screen.findByRole('list', { name: 'Agenda de doses' }); const items = within(list).getAllByRole('listitem'); expect(items.map(item => item.getAttribute('data-dose-id'))).toEqual(['1', '2']); expect(items[1]).toHaveTextContent('14/11/2026 às 13:00'); expect(items[1]).toHaveTextContent('Programada'); expect(screen.getByRole('link', { name: 'Ver Hoje' })).toHaveAttribute('href', '/hoje');
});
it('T26 clock updates do not cancel pending mutations and confirmed counts use the mutation snapshot', async () => {
  mount(); await screen.findByRole('list', { name: 'Doses de hoje' }); const write = pending(); vi.mocked(fetch).mockReturnValueOnce(write.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar dose de Vitamina A, prevista para 13/11/2026 às 11:00' })); const call = vi.mocked(fetch).mock.calls.at(-1)!; expect(JSON.parse(String(call[1]!.body))).toEqual({ tomado: true });
  await act(async () => { vi.setSystemTime(new Date('2026-11-13T15:00:01Z')); document.dispatchEvent(new Event('visibilitychange')); }); expect(call[1]!.signal!.aborted).toBe(false);
  await act(async () => write.resolve(json({ data: { id: 1, tomado: true, data_dose: '2026-11-13T14:00:00Z' } })));
  expect(screen.getByText('4 doses hoje; 2 registrada(s); 2 não registrada(s).')).toBeVisible(); const item = within(screen.getByRole('list', { name: 'Doses de hoje' })).getAllByRole('listitem')[0]; expect(item).toHaveTextContent('Registrada'); expect(within(item).getByRole('button', { name: /Corrigir registro/ })).toBeVisible();
});
it('T26 paginated loading labels partial next/counts and completes with every page', async () => {
  const second = pending(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ data: [row(2, '2026-11-13T17:00:00Z')], pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } })).mockReturnValueOnce(second.promise);
  mount(); await screen.findByText('1 doses hoje; 0 registrada(s); 1 não registrada(s). (parcial)'); expect(screen.getByRole('region', { name: 'Próxima dose (parcial)' })).toHaveTextContent('14:00');
  await act(async () => second.resolve(json({ data: [row(1, '2026-11-13T16:00:00Z')], pagination: { page: 2, limit: 1, total: 2, totalPages: 2 } })));
  expect(screen.getByText('2 doses hoje; 0 registrada(s); 2 não registrada(s).')).toBeVisible(); expect(screen.getByRole('region', { name: 'Próxima dose' })).toHaveTextContent('13:00'); expect(screen.queryByText(/\(parcial\)/)).not.toBeInTheDocument();
});
it('T26 read failure is recoverable and Retry-After prevents automatic or early retries', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ message: 'Aguarde' }, 429, { 'Retry-After': '60' })).mockResolvedValueOnce(json({ data: rows }));
  mount(); const retry = await screen.findByRole('button', { name: 'Tentar novamente' }); expect(retry).toBeDisabled(); expect(screen.queryByText('Nenhuma dose prevista para hoje')).not.toBeInTheDocument(); fireEvent.click(retry); expect(fetch).toHaveBeenCalledTimes(2);
  await act(async () => { vi.setSystemTime(new Date('2026-11-13T15:01:01Z')); }); await waitFor(() => expect(retry).toBeEnabled()); expect(fetch).toHaveBeenCalledTimes(2); fireEvent.click(retry); await screen.findByRole('list', { name: 'Doses de hoje' }); expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method)).toEqual(['GET', 'GET', 'GET']);
});
function SwitchIdentity() { const auth = useAuth(); return <><button onClick={() => auth.login('token-B', { id: 8, nome: 'B' })}>Trocar conta</button><TodayScreen /></>; }
it('T26 restoration prevents dose reads and the previous identity response is discarded', async () => {
  const profile = pending(), old = pending(); vi.mocked(fetch).mockReturnValueOnce(profile.promise).mockReturnValueOnce(old.promise).mockResolvedValue(json({ data: [] }));
  render(<AuthProvider><SwitchIdentity /></AuthProvider>); expect(fetch).toHaveBeenCalledTimes(1); expect(screen.queryByRole('heading', { name: 'Hoje' })).not.toBeInTheDocument();
  await act(async () => profile.resolve(json({ data: user }))); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); const signal = vi.mocked(fetch).mock.calls[1][1]!.signal!;
  fireEvent.click(screen.getByText('Trocar conta')); await screen.findByText('Nenhuma dose prevista para hoje'); await act(async () => old.resolve(json({ data: rows })));
  expect(signal.aborted).toBe(true); expect(screen.queryByText('Vitamina A')).not.toBeInTheDocument(); expect(screen.getByText('Nenhuma dose prevista para hoje')).toBeVisible();
});
function DraftProbe() { const draft = useTreatmentDraft(); return <><button onClick={() => draft.updateDraft({ medicationName: 'Rascunho privado A' })}>Preencher rascunho</button><output data-testid="private-draft">{draft.draft.medicationName}</output></>; }
function SessionBoundary() { const auth = useAuth(); return <TreatmentDraftProvider identity={auth.identityKey}><p data-testid="auth-state">{auth.sessionStatus}</p><DraftProbe /><TodayScreen /></TreatmentDraftProvider>; }
it('T26 dose read 401 ends the current session and clears the private draft without operational revalidation', async () => {
  const reading = pending(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockReturnValueOnce(reading.promise);
  render(<AuthProvider><SessionBoundary /></AuthProvider>); await screen.findByRole('heading', { name: 'Hoje' }); fireEvent.click(screen.getByText('Preencher rascunho')); expect(screen.getByTestId('private-draft')).toHaveTextContent('Rascunho privado A');
  await act(async () => reading.resolve(json({ message: 'Sessão expirada' }, 401)));
  expect(localStorage.getItem('access_token')).toBeNull(); expect(localStorage.getItem('user_data')).toBeNull(); expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'); expect(screen.getByTestId('private-draft')).toBeEmptyDOMElement(); expect(screen.queryByRole('heading', { name: 'Hoje' })).not.toBeInTheDocument(); expect(router.push).toHaveBeenCalledWith('/login'); expect(consumeNavigationFeedback()).toBe('session-expired'); expect(fetch).toHaveBeenCalledTimes(2);
});
it('T26 network failure retains the validated session and its draft for manual read retry', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockRejectedValueOnce(new TypeError('offline'));
  render(<AuthProvider><SessionBoundary /></AuthProvider>); await screen.findByRole('button', { name: 'Tentar novamente' }); fireEvent.click(screen.getByText('Preencher rascunho'));
  expect(localStorage.getItem('access_token')).toBe('token-A'); expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'); expect(screen.getByTestId('private-draft')).toHaveTextContent('Rascunho privado A'); expect(router.push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull(); expect(fetch).toHaveBeenCalledTimes(2);
});
