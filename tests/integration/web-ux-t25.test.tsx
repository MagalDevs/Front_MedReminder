import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import MedicationsScreen from '@/app/features/web-ux/screens/MedicationsScreen';
vi.mock('next/navigation', () => ({ usePathname: () => '/meus-medicamentos', useRouter: () => ({ push: vi.fn() }) }));
const user = { id: 7, nome: 'Ana' };
const medications = [
  { id: 11, nome: 'Ácido A', classificacao: 'Suplemento', dataValidade: '2026-11-14', quantidadeCaixa: 10, unidadeMedida: 'comp', quantidadeDose: '1,5 mg', quantidadeDiaria: 6 },
  { id: 12, nome: 'Ácido A', classificacao: 'Outro', dataValidade: '2025-01-01' },
  { id: 13, nome: 'Vitamina B', classificacao: 'Suplemento', dataValidade: null },
];
const json = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00'));
  localStorage.setItem('access_token', 'token-A');
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('usuario/me') ? json({ data: user }) : json({ data: medications }));
});
function mount() { return render(<AuthProvider><MedicationsScreen /></AuthProvider>); }
function change(name: string, value: string) { fireEvent.change(screen.getByLabelText(name), { target: { value } }); }
it('WUX_MED_02', async () => {
  mount(); await screen.findByText('3 medicamentos'); change('Nome', ' acido '); change('Classificação', 'Suplemento'); change('Validade', 'next30days');
  expect(screen.getByText('1 medicamento')).toBeVisible(); expect(screen.getAllByRole('article')).toHaveLength(1); expect(screen.getByRole('article')).toHaveTextContent('Ácido A');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' })); expect(screen.getByLabelText('Nome')).toHaveValue(''); expect(screen.getByLabelText('Classificação')).toHaveValue(''); expect(screen.getByLabelText('Validade')).toHaveValue('all'); expect(screen.getByText('3 medicamentos')).toBeVisible(); expect(screen.getAllByRole('article')).toHaveLength(3);
});
it('WUX_MED_03', async () => {
  const view = mount(); await screen.findByText('3 medicamentos'); change('Nome', 'inexistente');
  expect(screen.getByText('Nenhum medicamento corresponde aos filtros')).toBeVisible(); expect(screen.queryByText('Nenhum medicamento cadastrado')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' })); expect(screen.getAllByRole('article')).toHaveLength(3); view.unmount();
  vi.mocked(fetch).mockImplementation(async input => json({ data: String(input).endsWith('usuario/me') ? user : [] })); mount();
  await screen.findByText('Nenhum medicamento cadastrado'); expect(screen.queryByText('Nenhum medicamento corresponde aos filtros')).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Adicionar medicamento' })).toHaveAttribute('href', '/novo-medicamento');
});
it('T25 real destinations use medication ID and deletion cancel/failure/success preserve confirmed state', async () => {
  mount(); const articles = await screen.findAllByRole('article');
  for (const [index, id] of [11, 12, 13].entries()) {
    expect(within(articles[index]).getByRole('link', { name: 'Ver horários' })).toHaveAttribute('href', `/meus-lembretes?medicamentoId=${id}`);
    expect(within(articles[index]).getByRole('link', { name: 'Editar medicamento' })).toHaveAttribute('href', `/meus-medicamentos/${id}/editar`);
  }
  expect(screen.queryByText(/6x ao dia|6 vezes ao dia/)).not.toBeInTheDocument();
  fireEvent.click(within(articles[0]).getByRole('button', { name: 'Excluir medicamento' }));
  const dialog = screen.getByRole('dialog', { name: 'Excluir Ácido A?' }); expect(dialog).toHaveTextContent('também remove todas as suas doses'); fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(screen.getAllByRole('article')).toHaveLength(3); expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Indisponível' }, 503)).mockResolvedValueOnce(json({ message: 'Excluído' }));
  fireEvent.click(within(articles[0]).getByRole('button', { name: 'Excluir medicamento' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
  await screen.findByRole('button', { name: 'Tentar novamente' }); expect(screen.getAllByRole('article')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2)); expect(screen.getByText('2 medicamentos')).toBeVisible();
});
it('T25 recovering a read never shows a successful empty state or repeats a mutation', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ message: 'Indisponível' }, 503)).mockResolvedValueOnce(json({ data: medications }));
  mount(); await screen.findByRole('button', { name: 'Tentar novamente' }); expect(screen.queryByText('Nenhum medicamento cadastrado')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('3 medicamentos'); expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method)).toEqual(['GET', 'GET', 'GET']);
});
it('T25 rate limited reading waits for the deadline without automatic requests', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: user })).mockResolvedValueOnce(json({ message: 'Aguarde' }, 429, { 'Retry-After': '60' }));
  mount(); const retry = await screen.findByRole('button', { name: 'Tentar novamente' }); expect(retry).toBeDisabled(); expect(screen.getByText('Aguarde 60 segundos para tentar novamente.')).toBeVisible();
  fireEvent.click(retry); expect(fetch).toHaveBeenCalledTimes(2); expect(screen.queryByText('Nenhum medicamento cadastrado')).not.toBeInTheDocument();
});
function SwitchIdentity() { const auth = useAuth(); return <><button onClick={() => auth.login('token-B', { id: 8, nome: 'B' })}>Trocar conta</button><MedicationsScreen /></>; }
it('T25 restoration gates private loading and identity replacement discards old responses', async () => {
  let resolveProfile!: (value: Response) => void; let resolveList!: (value: Response) => void;
  vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { resolveProfile = resolve; })).mockReturnValueOnce(new Promise(resolve => { resolveList = resolve; })).mockResolvedValue(json({ data: [] }));
  render(<AuthProvider><SwitchIdentity /></AuthProvider>); expect(fetch).toHaveBeenCalledTimes(1); expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  await act(async () => resolveProfile(json({ data: user }))); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); const signal = vi.mocked(fetch).mock.calls[1][1]!.signal!;
  fireEvent.click(screen.getByText('Trocar conta')); await screen.findByText('Nenhum medicamento cadastrado'); await act(async () => resolveList(json({ data: medications })));
  expect(signal.aborted).toBe(true); expect(screen.queryByText('Ácido A')).not.toBeInTheDocument(); expect(screen.getByText('Nenhum medicamento cadastrado')).toBeVisible();
});
