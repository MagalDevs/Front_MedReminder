import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/login/page';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { clearNavigationFeedback, publishNavigationFeedback } from '@/app/utils/navigation-feedback';
const auth = vi.hoisted(() => ({ login: vi.fn(), logout: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('@/app/contexts/AuthContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/app/contexts/AuthContext')>();
  return { ...actual, useAuth: () => {
    const session = actual.useAuth();
    return { ...session, login: (...args: Parameters<typeof session.login>) => { auth.login(...args); session.login(...args); },
      logout: () => { auth.logout(); session.logout(); } };
  } };
});
function SessionProbe() { const session = useAuth(); return <><span aria-label="Sessão autenticada">{String(session.isAuthenticated)}</span><span aria-label="Perfil da sessão">{JSON.stringify(session.user)}</span></>; }
function Login() { return <AuthProvider><LoginPage /><SessionProbe /></AuthProvider>; }
function expectAnonymousProfileFailure() {
  expect(auth.logout).not.toHaveBeenCalled();
  expect(auth.login).not.toHaveBeenCalled();
  expect(localStorage.getItem('access_token')).toBeNull();
  expect(localStorage.getItem('user_data')).toBeNull();
  expect(screen.getByLabelText('Sessão autenticada')).toHaveTextContent(/^false$/);
  expect(screen.getByLabelText('Perfil da sessão')).toHaveTextContent(/^null$/);
  expect(router.push).not.toHaveBeenCalled();
}
vi.mock('next/navigation', () => ({ useRouter: () => router, useSearchParams: () => new URLSearchParams() }));
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function submit() {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.test' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}
describe('NET-02 NET-03 login feedback', () => {
  beforeEach(() => { clearNavigationFeedback(); auth.login.mockReset(); auth.logout.mockReset(); router.push.mockReset(); vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'); });
  it.each(['login', 'profile'] as const)('ERR-19 NET-02 NET-03 ignora resposta de %s após abandonar a página', async phase => {
    let finish!: (response: Response) => void;
    if (phase === 'profile') vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'synthetic' }));
    vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const view = render(<Login />);
    submit();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(phase === 'profile' ? 2 : 1));
    const lastRequest = vi.mocked(fetch).mock.calls.at(-1)!;
    view.unmount();
    await act(async () => { finish(json(phase === 'profile' ? { data: { id: 7, nome: 'Pessoa' } } : { access_token: 'synthetic' })); });
    expect(auth.login).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(phase === 'profile' ? 2 : 1);
    expect(lastRequest[1]?.signal?.aborted).toBe(true);
  });
  it('REG-09 login direto não anuncia cadastro', () => { render(<Login />); expect(screen.queryByRole('status')).not.toBeInTheDocument(); });
  it('REG-08 aviso registered aparece uma vez inclusive StrictMode', () => {
    publishNavigationFeedback('registered'); const view = render(<StrictMode><Login /></StrictMode>);
    expect(screen.getByRole('status')).toHaveTextContent('Cadastro concluído! Entre com seu e-mail e senha.'); view.unmount(); render(<Login />); expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('ERR-04 aviso de sessão expirada é erro e desaparece ao tentar novamente', async () => {
    publishNavigationFeedback('session-expired'); vi.mocked(fetch).mockReturnValue(new Promise(() => {})); render(<Login />); expect(screen.getByRole('alert')).toHaveTextContent('Sessão expirada. Entre novamente.'); submit(); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-04 login já montado recebe novo aviso uma única vez', () => {
    render(<Login />); act(() => publishNavigationFeedback('session-expired'));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('alert')).toHaveTextContent('Sessão expirada. Entre novamente.');
  });
  it('ERR-03 HTTP401 mostra credenciais inválidas por status', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ message: 'segredo privado' }, 401)); render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos'); expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
  it('ERR-03 texto401 em HTTP400 não vira credenciais inválidas', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ message: 'Campo inválido no registro 401' }, 400)); render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Campo inválido no registro 401');
  });
  it('ERR-12 resposta sem token é erro de contrato sem refletir message', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ message: 'SQLITE_ERROR senha' })); render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível interpretar a resposta'); expect(screen.getByRole('alert').textContent).toBe('Não foi possível interpretar a resposta do serviço. Tente novamente.'); expect(auth.login).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([{}, { data: null }])('ERR-12 perfil inválido %j preserva logout e feedback', async (profile) => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'synthetic' })).mockResolvedValueOnce(json(profile)); render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seu perfil. Faça o login novamente.'); expectAnonymousProfileFailure(); expect(auth.login).not.toHaveBeenCalled();
  });
  it('ERR-01 ERR-17 falha de perfil não expõe diagnóstico técnico', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'synthetic' })).mockRejectedValueOnce(new Error('http://internal SQLITE_ERROR Bearer secret')); render(<Login />); submit(); const alert = await screen.findByRole('alert'); expect(alert).toHaveTextContent('Não foi possível carregar seu perfil. Faça o login novamente.'); expect(alert).not.toHaveTextContent('internal'); expectAnonymousProfileFailure();
  });
  it.each([
    { kind: 'server', text: 'O serviço está temporariamente indisponível.' },
    { kind: 'network', text: 'Não foi possível conectar ao servidor.' },
    { kind: 'contract', text: 'Não foi possível interpretar a resposta do serviço.' },
  ])('ERR-01 NET-03 aplica matriz à falha de perfil $kind', async ({ kind, text }) => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'synthetic' }));
    if (kind === 'network') vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
    else vi.mocked(fetch).mockResolvedValueOnce(kind === 'server' ? json({}, 503) : json({ data: null }));
    render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent(text); expectAnonymousProfileFailure(); expect(auth.login).not.toHaveBeenCalled();
  });
  it('ERR-01 ERR-11 rede usa mensagem pública e recupera controle', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('segredo')); render(<Login />); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.'); expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
  it('ERR-14 nova tentativa remove sucesso e autentica com perfil válido', async () => {
    publishNavigationFeedback('registered'); vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'synthetic' })).mockResolvedValueOnce(json({ data: { id: 7, nome: 'Pessoa' } })); render(<Login />); submit(); await waitFor(() => expect(router.push).toHaveBeenCalledWith('/hoje')); expect(auth.login).toHaveBeenCalledWith('synthetic', { id: 7, nome: 'Pessoa' }); expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
