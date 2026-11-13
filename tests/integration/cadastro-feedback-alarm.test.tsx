import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Lembrete from '@/app/components/AlarmeDose/Lembrete';
import { LembreteProvider } from '@/app/contexts/lembreteContext';
const logout = vi.hoisted(() => vi.fn());
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1 },
    isAuthenticated: true,
    loading: false,
    logout,
  }),
}));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const props = {
  id: 7,
  dataHora: '2026-11-12T12:00:00Z',
  medicamentoNome: 'Sintético',
  quantidadeDose: '1 comprimido',
  cor: 'Branco',
};
function mount(onClose = vi.fn()) {
  return { ...render(<Lembrete {...props} onClose={onClose} />), onClose };
}
beforeEach(() => localStorage.setItem('access_token', 'a'));
describe('NET-18 confirmação no alarme', () => {
  it.each([503, 'network'] as const)(
    'ERR-01 NET-18 falha %s mantém alarme e recupera controle',
    async (mode) => {
      if (mode === 'network')
        vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
      else vi.mocked(fetch).mockResolvedValueOnce(json({}, mode));
      const { onClose } = mount();
      fireEvent.click(
        screen.getByRole('button', { name: 'Medicamento Tomado' }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ao confirmar dose:',
      );
      expect(
        screen.getByRole('button', { name: 'Medicamento Tomado' }),
      ).toBeEnabled();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText('Hora do Medicamento!')).toBeInTheDocument();
      expect(
        JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)),
      ).toEqual({ tomado: true });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  it('ERR-14 ação pendente bloqueia duplicidade e sucesso fecha só depois da resposta', async () => {
    let resolve!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const { onClose } = mount();
    const button = screen.getByRole('button', { name: 'Medicamento Tomado' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => resolve(new Response(null, { status: 204 })));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('ERR-01 NET-18 refresh falho após PUT confirmado não reenvia a dose', async () => {
    const onClose = vi.fn();
    let reads = 0;
    vi.mocked(fetch).mockImplementation(async (_url, init) =>
      init?.method === 'PUT'
        ? json({})
        : ++reads === 2
          ? json({}, 503)
          : json({ data: [] }),
    );
    render(
      <LembreteProvider>
        <Lembrete {...props} onClose={onClose} />
      </LembreteProvider>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Medicamento Tomado' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Dose confirmada. A atualização dos lembretes não foi concluída.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    const surface = screen.getByText('Hora do Medicamento!').closest('.fixed') as HTMLElement;
    expect(within(surface).getByRole('alert').textContent).toBe('Ao carregar lembretes: O serviço está temporariamente indisponível. Tente novamente mais tarde.');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Atualizar lembretes' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(
      vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT'),
    ).toHaveLength(1);
  });
  it('ERR-19 desmontagem cancela e ignora rejeição tardia', async () => {
    let reject!: (e: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((_r, j) => (reject = j)));
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Medicamento Tomado' }));
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(view.onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
