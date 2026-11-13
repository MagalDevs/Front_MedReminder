import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoricoContent from '@/app/historico/HistoricoContent';

const auth = vi.hoisted(() => ({ user: { id: 7 }, isAuthenticated: true, loading: false }));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => auth }));
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const row = { id: 1, data_dose: '2026-11-04T12:00:00Z', tomado: true, remedio: { id: 9, nome: 'Sintético' } };
describe('NET-17 histórico feedback', () => {
  beforeEach(() => {
    Object.assign(auth, { user: { id: 7 }, isAuthenticated: true, loading: false });
    localStorage.setItem('access_token', 'synthetic');
  });
  it.each([
    [503, 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'],
    [403, 'Você não tem permissão para realizar esta ação.'],
    ['network', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
  ] as const)('ERR-01 NET-17 ERR-15 falha %s é alerta seguro distinto de vazio', async (status, message) => {
    if (status === 'network') vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private URL'));
    else vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'SQLITE_ERROR private' }, status));
    render(<HistoricoContent />);
    expect(await screen.findByRole('alert')).toHaveTextContent(`Ao carregar histórico: ${message}`);
    expect(screen.queryByText('Nenhum histórico encontrado')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent('private');
  });
  it.each([400, 422, 409])('ERR-01 ERR-17 HTTP%i corpo técnico usa fallback integral no histórico real', async (status) => {
    const message = 'Campo inválido postgresql://synthetic:secret@internal-db/medreminder';
    vi.mocked(fetch).mockResolvedValueOnce(json({ message }, status));
    render(<HistoricoContent />);
    const expected = status === 409
      ? 'Não foi possível concluir a operação porque os dados foram alterados ou já existem. Verifique e tente novamente.'
      : 'Dados inválidos. Verifique os campos e tente novamente.';
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(`Ao carregar histórico: ${expected}`);
    expect(alert).not.toHaveTextContent('synthetic');
    expect(alert).not.toHaveTextContent('internal-db');
    expect(screen.queryByText('Nenhum histórico encontrado')).not.toBeInTheDocument();
  });
  it.each([{ data: null }, { data: [null] }, { data: [{ ...row, remedio: { id: 9 } }] }])('ERR-12 formato inválido %j encerra loading em erro de contrato', async (body) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(body));
    render(<HistoricoContent />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível interpretar a resposta do serviço. Tente novamente.');
    expect(screen.queryByText('Nenhum histórico encontrado')).not.toBeInTheDocument();
  });
  it('ERR-18 sucesso da nova consulta limpa erro e preserva filtros', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    const view = render(<HistoricoContent />);
    await screen.findByRole('alert');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'tomado' } });
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [row] }));
    localStorage.setItem('access_token', 'new-synthetic');
    view.rerender(<HistoricoContent />);
    await screen.findByRole('heading', { name: 'Sintético' });
    expect(screen.getByLabelText('Status')).toHaveValue('tomado');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-19 troca de identidade cancela e ignora falha antiga', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((_r, j) => { reject = j; }));
    const view = render(<HistoricoContent />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [] }));
    auth.user = { id: 8 };
    localStorage.setItem('access_token', 'other');
    view.rerender(<HistoricoContent />);
    await screen.findByText('Nenhum histórico encontrado');
    await act(async () => reject(new TypeError('private')));
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-19 desmontagem cancela sem aviso tardio', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((_r, j) => { reject = j; }));
    const view = render(<HistoricoContent />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    await act(async () => reject(new TypeError('private')));
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
