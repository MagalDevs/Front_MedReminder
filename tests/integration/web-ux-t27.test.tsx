import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/app/contexts/AuthContext';
import HistoryScreen from '@/app/features/web-ux/screens/HistoryScreen';
vi.mock('next/navigation', () => ({ usePathname: () => '/historico', useRouter: () => ({ push: vi.fn() }) }));
const user = { id: 7, nome: 'Ana' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const row = (id: number, at: string, registered = false, medicationId = 7) => ({ id, data_dose: at, tomado: registered, remedio: { id: medicationId, nome: 'Vitamina', quantidadeDose: '1,5 mg' } });
const rows = [row(1, '2026-11-12T10:00:00Z'), row(2, '2026-11-13T14:50:00Z', true), row(3, '2026-11-13T14:50:00Z'), row(4, '2026-11-13T16:00:00Z'), row(5, '2026-11-13T15:00:00Z')];
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A'); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : rows }));
});
function mount() { return render(<AuthProvider><HistoryScreen /></AuthProvider>); }
function change(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
it('T27 history stops at the actual clock, descending, with explicitly scheduled dates', async () => {
  mount(); const list = await screen.findByRole('list', { name: 'Doses do histórico' }); const items = within(list).getAllByRole('listitem'); expect(items.map(item => item.getAttribute('data-dose-id'))).toEqual(['5', '3', '2', '1']); expect(screen.getByText('4 doses; 1 registrada(s); 3 não registrada(s).')).toBeVisible();
  expect(items[0]).toHaveTextContent('Horário previsto: 13/11/2026 às 12:00'); expect(items[0]).toHaveTextContent('Pendente'); expect(items[2]).toHaveTextContent('Registrada'); expect(items[3]).toHaveTextContent('12/11/2026 às 07:00'); expect(list).not.toHaveTextContent('13:00'); expect(screen.getByText('America/Sao_Paulo', { exact: false })).toBeVisible();
});
it('T27 composed filters and totals include every page even beyond 100 records, and reset restores all', async () => {
  let resolve!: (value: Response) => void; const second = new Promise<Response>(done => { resolve = done; });
  const old = Array.from({ length: 100 }, (_, index) => row(index + 1, index === 1 ? '2026-11-13T14:00:00Z' : '2026-10-01T12:00:00Z', false, index === 0 ? 7 : 8));
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ data: old, pagination: { page: 1, limit: 100, total: 102, totalPages: 2 } })).mockReturnValueOnce(second);
  mount(); await screen.findByText('100 doses; 0 registrada(s); 100 não registrada(s). (parcial)'); change('Medicamento', '7'); change('Período', 'today'); change('Estado', 'unregistered');
  expect(screen.getByText('0 doses; 0 registrada(s); 0 não registrada(s). (parcial)')).toBeVisible(); expect(screen.queryByText('Nenhuma dose corresponde aos filtros')).not.toBeInTheDocument();
  await act(async () => resolve(json({ data: [row(101, '2026-11-13T14:00:00Z', true), row(102, '2026-11-13T15:00:00Z')], pagination: { page: 2, limit: 100, total: 102, totalPages: 2 } })));
  const list = screen.getByRole('list', { name: 'Doses do histórico' }); expect(within(list).getAllByRole('listitem').map(item => item.getAttribute('data-dose-id'))).toEqual(['102']); expect(screen.getByText('1 doses; 0 registrada(s); 1 não registrada(s).')).toBeVisible();
  change('Estado', 'registered'); expect(screen.getByText('1 doses; 1 registrada(s); 0 não registrada(s).')).toBeVisible(); expect(within(screen.getByRole('list', { name: 'Doses do histórico' })).getAllByRole('listitem')[0]).toHaveAttribute('data-dose-id', '101');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' })); expect(screen.getByLabelText('Medicamento')).toHaveValue(''); expect(screen.getByLabelText('Período')).toHaveValue('all'); expect(screen.getByLabelText('Estado')).toHaveValue('all'); expect(screen.getByText('102 doses; 1 registrada(s); 101 não registrada(s).')).toBeVisible();
});
it('T27 period boundaries use local midnight and keep intersection with ID and state', async () => {
  const dates = [row(1, '2026-11-07T02:59:59Z'), row(2, '2026-11-07T03:00:00Z'), row(3, '2026-10-15T03:00:00Z'), row(4, '2026-10-15T02:59:59Z'), row(5, '2026-11-13T15:00:00Z', false, 8)];
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : dates })); mount(); await screen.findByRole('list', { name: 'Doses do histórico' }); change('Medicamento', '7'); change('Período', '7days');
  expect(within(screen.getByRole('list', { name: 'Doses do histórico' })).getAllByRole('listitem').map(item => item.getAttribute('data-dose-id'))).toEqual(['2']); change('Período', '30days'); expect(within(screen.getByRole('list', { name: 'Doses do histórico' })).getAllByRole('listitem').map(item => item.getAttribute('data-dose-id'))).toEqual(['2', '1', '3']); change('Estado', 'registered'); expect(screen.getByText('Nenhuma dose corresponde aos filtros')).toBeVisible(); expect(screen.getByText('0 doses; 0 registrada(s); 0 não registrada(s).')).toBeVisible();
});
it('T27 correction uses the real mutation and immediately updates the registered filter and count', async () => {
  mount(); await screen.findByRole('list', { name: 'Doses do histórico' }); change('Estado', 'registered'); fireEvent.click(screen.getByRole('button', { name: /Corrigir registro de Vitamina/ })); const dialog = screen.getByRole('dialog'); expect(dialog).toHaveTextContent('voltará a não registrada');
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 2, tomado: false, data_dose: '2026-11-13T14:50:00Z' } })); fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar correção' }));
  await screen.findByText('Nenhuma dose corresponde aos filtros'); expect(screen.getByText('0 doses; 0 registrada(s); 0 não registrada(s).')).toBeVisible();
  change('Estado', 'unregistered'); expect(screen.getByText('4 doses; 0 registrada(s); 4 não registrada(s).')).toBeVisible(); const call = vi.mocked(fetch).mock.calls.at(-1)!; expect(String(call[0])).toMatch(/\/dose\/2$/); expect(JSON.parse(String(call[1]!.body))).toEqual({ tomado: false });
});
it('T27 partial page failure stays partial, retries only reading and distinguishes successful empty', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ data: [rows[0]], pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } })).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(json({ data: [] }));
  mount(); await screen.findByRole('button', { name: 'Tentar novamente' }); expect(screen.getByText('1 doses; 0 registrada(s); 1 não registrada(s). (parcial)')).toBeVisible(); expect(screen.queryByText('Nenhuma dose no histórico até agora')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Nenhuma dose no histórico até agora'); expect(screen.queryByRole('list', { name: 'Doses do histórico' })).not.toBeInTheDocument(); expect(vi.mocked(fetch).mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
});
