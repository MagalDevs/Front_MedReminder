import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useContext, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LembreteContext,
  LembreteProvider,
} from '@/app/contexts/lembreteContext';
import {
  consumeNavigationFeedback,
  clearNavigationFeedback,
} from '@/app/utils/navigation-feedback';

const { auth, logout } = vi.hoisted(() => ({
  auth: { user: { id: 1 }, isAuthenticated: true, loading: false },
  logout: vi.fn(),
}));
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({ ...auth, logout }),
}));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
function pending() {
  let resolve!: (r: Response) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<Response>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { resolve, reject, promise };
}
function Probe() {
  const ctx = useContext(LembreteContext)!;
  const [result, setResult] = useState<boolean | void>();
  return (
    <>
      <output>{JSON.stringify(ctx.lembretes)}</output>
      <span data-testid="loading">{String(ctx.lembretesLoading)}</span>
      <span data-testid="error">{ctx.lembretesError}</span>
      <span data-testid="result">{String(result)}</span>
      <button
        onClick={() => {
          void ctx.getLembretes().then(setResult);
        }}
      >
        Atualizar doses
      </button>
    </>
  );
}
function mount() {
  return render(
    <LembreteProvider>
      <Probe />
    </LembreteProvider>,
  );
}
beforeEach(() => {
  auth.user = { id: 1 };
  auth.isAuthenticated = true;
  localStorage.setItem('access_token', 'a');
  logout.mockReset();
  clearNavigationFeedback();
});
describe('NET-05 NET-06 feedback de doses', () => {
  it.each([503, 'network'] as const)(
    'ERR-01 NET-06 ERR-15 falha automática %s é alerta e não vazio concluído',
    async (mode) => {
      if (mode === 'network')
        vi.mocked(fetch).mockRejectedValue(
          new TypeError('https://internal/token'),
        );
      else vi.mocked(fetch).mockResolvedValue(json({}, mode));
      mount();
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Ao carregar lembretes:');
      expect(alert).toHaveTextContent(
        mode === 'network'
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
          : 'O serviço está temporariamente indisponível. Tente novamente mais tarde.',
      );
      expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(alert).not.toHaveTextContent('internal');
    },
  );
  it.each([{}, [null], [{ id: 1 }]])(
    'ERR-01 NET-06 ERR-12 envelope inválido %j produz erro de contrato',
    async (data) => {
      vi.mocked(fetch).mockResolvedValue(json({ data }));
      mount();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Não foi possível interpretar a resposta do serviço. Tente novamente.',
      );
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    },
  );
  it('ERR-01 NET-05 refresh falho mantém dados e retorna resultado distinto de sucesso', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        json({
          data: [
            { id: 1, tomado: false, data_dose: '2026-11-12T08:00:00-03:00', remedio: { nome: 'Preservado', quantidadeDose: '1', cor: 'Branco' } },
          ],
        }),
      )
      .mockResolvedValueOnce(json({}, 503));
    mount();
    await screen.findByText(/Preservado/);
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar doses' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ao carregar lembretes:',
    );
    expect(screen.getByText(/Preservado/)).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('result')).toHaveTextContent('false');
  });
  it('ERR-18 ERR-20 nova atualização bem sucedida limpa só erro de doses sem duplicatas', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(json({ data: [] }));
    mount();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar doses' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar doses' }));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();
  });
  it('ERR-19 desmontagem aborta e ignora falha tardia sem aviso', async () => {
    const gate = pending();
    vi.mocked(fetch).mockReturnValue(gate.promise);
    const view = mount();
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => gate.reject(new TypeError('offline')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });
  it('ERR-19 resposta da conta A não substitui conta B nem publica erro antigo', async () => {
    const gate = pending();
    vi.mocked(fetch)
      .mockReturnValueOnce(gate.promise)
      .mockResolvedValueOnce(
        json({
          data: [
            { id: 2, tomado: false, data_dose: '2026-11-12T08:00:00-03:00', remedio: { nome: 'Conta B', quantidadeDose: '1', cor: 'Branco' } },
          ],
        }),
      );
    const view = mount();
    auth.user = { id: 2 };
    localStorage.setItem('access_token', 'b');
    view.rerender(
      <LembreteProvider>
        <Probe />
      </LembreteProvider>,
    );
    await screen.findByText(/Conta B/);
    await act(async () => gate.resolve(json({}, 503)));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Conta B/)).toBeInTheDocument();
  });
  it('ERR-04 NET-06 401 encerra sessão e entrega aviso depois do logout', async () => {
    logout.mockImplementation(clearNavigationFeedback);
    vi.mocked(fetch).mockResolvedValue(json({}, 401));
    mount();
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(consumeNavigationFeedback()).toBe('session-expired');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
