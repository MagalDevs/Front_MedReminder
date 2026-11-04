import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoricoContent from '@/app/historico/HistoricoContent';

const auth = vi.hoisted(() => ({ user: { id: 7 }, isAuthenticated: true, loading: false }));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => auth }));
const rows = [
  { id: 1, data_dose: '2026-11-04T12:00:00Z', tomado: true, remedio: { id: 9, nome: 'Medicamento A' } },
  { id: 2, data_dose: '2026-11-04T13:00:00Z', tomado: false, remedio: { id: '10', nome: 'Medicamento B' } },
];
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

describe('BEAPI-09 histórico persistido', () => {
  beforeEach(() => {
    Object.assign(auth, { user: { id: 7 }, isAuthenticated: true, loading: false });
    localStorage.setItem('access_token', 'token-sintetico');
  });
  it('consulta dose/me com Bearer e representa tomado booleano sem inventar adiamento', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: rows }));
    render(<HistoricoContent />);
    await screen.findByRole('heading', { name: 'Medicamento A' });
    expect(screen.getByText('Tomado', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Não tomado', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('Adiado')).not.toBeInTheDocument();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/dose\/me$/);
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get('authorization')).toBe('Bearer token-sintetico');
  });
  it('filtros normalizam IDs numéricos e preservam estados reais', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: rows }));
    render(<HistoricoContent />);
    await screen.findByRole('heading', { name: 'Medicamento A' });
    fireEvent.change(screen.getByLabelText('Medicamento'), { target: { value: '9' } });
    expect(screen.queryByRole('heading', { name: 'Medicamento B' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'nao_tomado' } });
    expect(screen.getByText('Nenhum histórico encontrado')).toBeInTheDocument();
  });
  it('lista vazia não produz dados sintéticos', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [] }));
    render(<HistoricoContent />);
    await screen.findByText('Nenhum histórico encontrado');
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(1);
  });
  it.each([401, 500])('falha%s permanece erro explícito', async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'falha' }, status));
    render(<HistoricoContent />);
    await screen.findByText(status === 401 ? /Sessão expirada/ : /Não foi possível carregar o histórico/);
    expect(screen.queryByText('Nenhum histórico encontrado')).not.toBeInTheDocument();
  });
  it.each([true, false])('não consulta enquanto sessão loading=%s ausente ou carregando', async (loading) => {
    Object.assign(auth, { loading, isAuthenticated: false });
    render(<HistoricoContent />);
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
  it('remount recarrega estado confirmado pelo servidor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [rows[1]] }));
    const view = render(<HistoricoContent />);
    await screen.findByText('Não tomado', { selector: 'span' });
    view.unmount();
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [{ ...rows[1], tomado: true }] }));
    render(<HistoricoContent />);
    await screen.findByText('Tomado', { selector: 'span' });
    expect(screen.queryByText('Não tomado', { selector: 'span' })).not.toBeInTheDocument();
  });
  it('logout oculta registros privados e descarta resposta atrasada', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const view = render(<HistoricoContent />);
    Object.assign(auth, { isAuthenticated: false });
    localStorage.removeItem('access_token');
    view.rerender(<HistoricoContent />);
    resolve(json({ data: rows }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Medicamento A' })).not.toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
