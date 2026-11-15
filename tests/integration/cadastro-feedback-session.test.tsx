import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import Login from '@/app/login/page';
import HistoricoContent from '@/app/historico/HistoricoContent';
import { apiRequest, SESSION_INVALIDATED_EVENT } from '@/app/utils/api';
import { clearNavigationFeedback, consumeNavigationFeedback } from '@/app/utils/navigation-feedback';
const router = vi.hoisted(() => ({ push: vi.fn(), unstable: false }));
vi.mock('next/navigation', () => ({ useRouter: () => router.unstable ? { push: router.push } : router, useSearchParams: () => new URLSearchParams() }));
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function Probe() { const auth = useAuth(); return <><output data-testid="auth">{String(auth.isAuthenticated)}:{String(auth.loading)}:{auth.user?.nome}</output><button onClick={() => auth.login('token-b', { id: 2, nome: 'B' })}>login B</button><button onClick={auth.logout}>logout</button></>; }
function mount(login=false) { return render(<AuthProvider>{login && <Login />}<Probe /></AuthProvider>); }
function token() { localStorage.setItem('access_token', 'token-a'); }
describe('NET-04 restauração e feedback por identidade', () => {
  beforeEach(() => { router.push.mockReset(); router.unstable = false; clearNavigationFeedback(); vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'); });
  it('ERR-20 mudanças de referência do roteador não repetem restauração nem revertem sessão', async () => {
    router.unstable = true; token();
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1, nome: 'A' } }));
    const view = mount();
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true:false:A'));
    view.rerender(<AuthProvider><Probe /></AuthProvider>);
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('login B'));
    expect(screen.getByTestId('auth')).toHaveTextContent('true:false:B');
    expect(localStorage.getItem('access_token')).toBe('token-b');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('ERR-01 sem token não faz request nem alerta', async () => {
    mount(); await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('false:false:')); expect(fetch).not.toHaveBeenCalled(); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-01 ERR-11 rede mostra erro contextual sem destruir credencial', async () => {
    token(); vi.mocked(fetch).mockRejectedValueOnce(new TypeError('http://interno/secret')); mount(); expect(await screen.findByRole('alert')).toHaveTextContent('Restaurar sessão: Não foi possível conectar'); expect(localStorage.getItem('access_token')).toBe('token-a'); expect(screen.getByTestId('auth')).toHaveTextContent('false:false:');
  });
  it('ERR-10 servidor mostra indisponibilidade segura', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'SQLITE_ERROR private' }, 503)); mount(); expect(await screen.findByRole('alert')).toHaveTextContent('O serviço está temporariamente indisponível.'); expect(screen.getByRole('alert')).not.toHaveTextContent('SQLITE');
  });
  it.each([{}, null])('ERR-12 perfil inválido %j mostra contrato sem confirmar autenticação', async (profile) => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json(profile)); mount(); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível interpretar'); expect(screen.getByTestId('auth')).toHaveTextContent('false:false:');
  });
  it('ERR-04 ERR-20 401 com login já montado mostra uma única expiração', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({}, 401)); mount(true); const alert = await screen.findByRole('alert'); expect(alert).toHaveTextContent('Sessão expirada. Entre novamente.'); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(localStorage.getItem('access_token')).toBeNull(); expect(consumeNavigationFeedback()).toBeNull();
  });
  it('ERR-04 invalidação do transporte entrega aviso no login sem duplicar host', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1 } })).mockResolvedValueOnce(json({}, 401)); mount(true); await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true:false:'));
    await act(async () => { await expect(apiRequest('private')).rejects.toMatchObject({ status: 401 }); }); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('alert')).toHaveTextContent('Sessão expirada.'); expect(screen.getByRole('alert').textContent).toBe('Sessão expirada. Entre novamente.'); expect(router.push).toHaveBeenCalledWith('/login');
  });
  it('ERR-01 ERR-04 restauração401 em página pública navega ao login com aviso', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({}, 401)); mount();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login')); expect(consumeNavigationFeedback()).toBe('session-expired'); expect(localStorage.getItem('access_token')).toBeNull(); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-19 cleanup cancela e ignora falha tardia sem aviso', async () => {
    token(); let fail!: (error: unknown) => void; vi.mocked(fetch).mockReturnValueOnce(new Promise((_resolve, reject) => { fail = reject; })); const view = mount(); view.unmount(); expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true); await act(async () => { fail(new Error('private')); }); expect(consumeNavigationFeedback()).toBeNull();
  });
  it('ERR-19 histórico desmontado recebe401 tardio sem invalidar sessão montada', async () => {
    token();
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1, nome: 'A' } }))
      .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const invalidated = vi.fn();
    window.addEventListener(SESSION_INVALIDATED_EVENT, invalidated);
    const view = render(<AuthProvider><Probe /><HistoricoContent /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true:false:A'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const storedUser = localStorage.getItem('user_data');
    const signal = vi.mocked(fetch).mock.calls[1][1]?.signal;
    view.rerender(<AuthProvider><Probe /></AuthProvider>);
    expect(signal?.aborted).toBe(true);
    await act(async () => { finish(json({}, 401)); });
    expect(localStorage.getItem('access_token')).toBe('token-a');
    expect(localStorage.getItem('user_data')).toBe(storedUser);
    expect(screen.getByTestId('auth')).toHaveTextContent('true:false:A');
    expect(invalidated).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consumeNavigationFeedback()).toBeNull();
    window.removeEventListener(SESSION_INVALIDATED_EVENT, invalidated);
  });
  it('ERR-19 401 tardio de A não altera login B nem publica aviso', async () => {
    token(); let finish!: (response: Response) => void; vi.mocked(fetch).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })); mount(); fireEvent.click(screen.getByText('login B')); await act(async () => { finish(json({}, 401)); }); expect(screen.getByTestId('auth')).toHaveTextContent('true:false:B'); expect(localStorage.getItem('access_token')).toBe('token-b'); expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(consumeNavigationFeedback()).toBeNull();
  });
  it('ERR-14 login novo remove erro de restauração anterior', async () => {
    token(); vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')); mount(); await screen.findByRole('alert'); fireEvent.click(screen.getByText('login B')); expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(screen.getByTestId('auth')).toHaveTextContent('true:false:B');
  });
  it('ERR-04 logout intencional não publica expiração', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1 } })); mount(); await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true:false:')); fireEvent.click(screen.getByText('logout')); expect(consumeNavigationFeedback()).toBeNull(); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-20 StrictMode mantém um só aviso de restauração', async () => {
    token(); vi.mocked(fetch).mockRejectedValue(new TypeError('offline')); render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>); await screen.findByRole('alert'); expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
