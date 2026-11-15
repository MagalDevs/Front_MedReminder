import { useLayoutEffect, useRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import Login from '@/app/login/page';
import ProtectedRoute from '@/app/components/ProtectedRoute/ProtectedRoute';
import { API_URL } from '@/app/utils/api';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const profile = { id: 7, nome: 'Ana Teste', email: 'ana@example.test' };
const token = 'token-sintetico';

function SessionConsumer() {
  const auth = useAuth();
  return (
    <aside aria-label="Sessão de teste">
      <output aria-label="Nome exibido">{auth.getUserDisplayName()}</output>
      <output aria-label="Autenticado">{String(auth.isAuthenticated)}</output>
      <output aria-label="Loading">{String(auth.loading)}</output>
      <output aria-label="Perfil">{JSON.stringify(auth.user)}</output>
      <button onClick={auth.logout}>Sair da sessão</button>
    </aside>
  );
}

function restoreSession(user: object | null = profile, storedToken = token) {
  localStorage.setItem('access_token', storedToken);
  if (user) localStorage.setItem('user_data', JSON.stringify(user));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mountLogin() {
  return render(<AuthProvider><Login /><SessionConsumer /></AuthProvider>);
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: profile.email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-sintetica' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

type LoadingSnapshot = { loading: boolean; spinner: boolean; protectedVisible: boolean };

// Observe the committed initial DOM before AuthProvider's passive effect runs.
// The provider and route remain real, including their state and effects.
function ProtectedConsumer({ snapshots }: { snapshots: LoadingSnapshot[] }) {
  const { loading } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    snapshots.push({
      loading,
      spinner: !!container.current?.querySelector('.animate-spin'),
      protectedVisible: !!container.current?.querySelector('[data-testid="protected"]'),
    });
  }, [loading, snapshots]);
  return (
    <div ref={container}>
      <ProtectedRoute><p data-testid="protected">Conteúdo protegido sintético</p></ProtectedRoute>
    </div>
  );
}

describe('sessão real — TEST-01 TEST-02', () => {
  beforeEach(() => { router.push.mockReset(); vi.mocked(fetch).mockResolvedValue(json({ data: profile })); });

  it.each([
    { user: null, expected: 'Usuário' },
    { user: { nome: 'Ana Teste' }, expected: 'Ana' },
    { user: { email: 'ana@example.test' }, expected: 'ana' },
  ])('UT-08 TEST-01 nome exibido $expected', async ({ user, expected }) => {
    if (user) { restoreSession(user); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 7, ...user } })); }
    render(<AuthProvider><SessionConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByLabelText('Loading')).toHaveTextContent('false'));
    expect(screen.getByLabelText('Nome exibido')).toHaveTextContent(new RegExp(`^${expected}$`));
    expect(fetch).toHaveBeenCalledTimes(user ? 1 : 0);
  });

  it('IT-01 TEST-02 login envia credenciais, busca perfil com Bearer e disponibiliza sessão', async () => {
    let resolveLogin!: (response: Response) => void;
    const pendingLogin = new Promise<Response>((resolve) => { resolveLogin = resolve; });
    vi.mocked(fetch).mockReturnValueOnce(pendingLogin).mockResolvedValueOnce(json({ message: 'ok', data: profile }));
    mountLogin();
    submitLogin();
    expect(screen.getByRole('button', { name: 'Processando...' })).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('access_token')).toBeNull();
    resolveLogin(json({ access_token: token }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/'));
    expect(fetch).toHaveBeenCalledTimes(2);
    const [loginUrl, loginOptions] = vi.mocked(fetch).mock.calls[0];
    expect(loginUrl).toBe(`${API_URL}/auth/login`);
    expect(loginOptions?.method).toBe('POST');
    expect(JSON.parse(String(loginOptions?.body))).toEqual({ email: profile.email, senha: 'senha-sintetica' });
    expect(new Headers(loginOptions?.headers).get('Authorization')).toBeNull();
    expect(new Headers(loginOptions?.headers).get('Content-Type')).toBe('application/json');
    const [profileUrl, profileOptions] = vi.mocked(fetch).mock.calls[1];
    expect(profileUrl).toBe(`${API_URL}/usuario/me`);
    expect(profileOptions?.method).toBe('GET');
    expect(new Headers(profileOptions?.headers).get('Authorization')).toBe(`Bearer ${token}`);
    expect(localStorage.getItem('access_token')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(profile);
    expect(screen.getByLabelText('Perfil')).toHaveTextContent(JSON.stringify(profile));
    expect(screen.getByLabelText('Nome exibido')).toHaveTextContent(/^Ana$/);
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('true');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalledWith('/login');
  });

  it('IT-02 TEST-02 falha no perfil apresenta erro e executa logout limpando sessão prévia', async () => {
    restoreSession({ id: 8, nome: 'Bruna Sintética' }, 'token-anterior-sintetico');
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ data: profile }))
      .mockResolvedValueOnce(json({ access_token: token }))
      .mockResolvedValueOnce(json({ message: 'Perfil indisponível' }, 500));
    mountLogin();
    submitLogin();
    expect(await screen.findByText(/Não foi possível carregar seu perfil\. Faça o login novamente\./)).toBeVisible();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('false');
    expect(screen.getByLabelText('Perfil')).toHaveTextContent('null');
    expect(screen.getByLabelText('Nome exibido')).toHaveTextContent('Usuário');
    expect(router.push).toHaveBeenCalledExactlyOnceWith('/login');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('IT-03 TEST-02 sem token mostra loading, bloqueia conteúdo e navega ao login', async () => {
    const snapshots: LoadingSnapshot[] = [];
    render(<AuthProvider><ProtectedConsumer snapshots={snapshots} /><SessionConsumer /></AuthProvider>);
    expect(snapshots[0]).toEqual({ loading: true, spinner: true, protectedVisible: false });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login'));
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(snapshots.at(-1)).toEqual({ loading: false, spinner: false, protectedVisible: false });
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('false');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('IT-03 TEST-02 restaura sessão preparada após loading e renderiza conteúdo protegido', async () => {
    restoreSession();
    const snapshots: LoadingSnapshot[] = [];
    render(<AuthProvider><ProtectedConsumer snapshots={snapshots} /><SessionConsumer /></AuthProvider>);
    expect(snapshots[0]).toEqual({ loading: true, spinner: true, protectedVisible: false });
    expect(await screen.findByTestId('protected')).toBeVisible();
    expect(snapshots.at(-1)).toEqual({ loading: false, spinner: false, protectedVisible: true });
    expect(screen.getByLabelText('Nome exibido')).toHaveTextContent(/^Ana$/);
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('true');
    expect(screen.getByLabelText('Perfil')).toHaveTextContent(JSON.stringify(profile));
    expect(router.push).not.toHaveBeenCalled();
    // Prepared storage characterizes restoration; it does not prove token validity.
  });

  it('IT-03 TEST-02 logout remove token/perfil e revoga conteúdo já renderizado', async () => {
    restoreSession();
    localStorage.setItem('preferencia', 'preservada');
    render(<AuthProvider><ProtectedRoute><p>Área restrita</p></ProtectedRoute><SessionConsumer /></AuthProvider>);
    expect(await screen.findByText('Área restrita')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Sair da sessão' }));
    await waitFor(() => expect(screen.queryByText('Área restrita')).not.toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(localStorage.getItem('preferencia')).toBe('preservada');
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('false');
    expect(screen.getByLabelText('Perfil')).toHaveTextContent('null');
    expect(router.push).toHaveBeenCalledWith('/login');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('IT-10 TEST-02 BEAPI-03 token inválido não deve habilitar dados protegidos', async () => {
    restoreSession(profile, 'token-invalido-sintetico');
    // Any attempted remote validation receives 401; unanticipated calls remain
    // blocked by setup.ts. Today AuthProvider never consults this boundary.
    vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Token inválido' }, 401));
    render(<AuthProvider><ProtectedRoute><p>Dados privados</p></ProtectedRoute><SessionConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByLabelText('Loading')).toHaveTextContent('false'));
    expect(screen.queryByText('Dados privados')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Autenticado')).toHaveTextContent('false');
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
