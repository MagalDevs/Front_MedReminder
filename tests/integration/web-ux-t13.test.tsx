import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, safeInternalReturnTarget, useAuth } from '@/app/contexts/AuthContext';
import { apiRequest, ApiError } from '@/app/utils/api';
import { clearNavigationFeedback, consumeNavigationFeedback } from '@/app/utils/navigation-feedback';

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const user = { id: 7, nome: 'Ana', email: 'ana@example.test', cep: '01001000' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
function pending() { let resolve!: (response: Response) => void; const promise = new Promise<Response>(done => { resolve = done; }); return { resolve, promise }; }
function Probe() {
  const auth = useAuth(); const [checked, setChecked] = useState('');
  return <><div data-testid="session">{JSON.stringify({ loading: auth.loading, authenticated: auth.isAuthenticated, status: auth.sessionStatus, user: auth.user, generation: auth.identityGeneration, identity: auth.identityKey, returnTarget: auth.returnTarget })}</div>
    <div data-testid="checked">{checked}</div>
    <button onClick={auth.logout}>logout</button>
    <button onClick={() => auth.login('token-B', { id: 8, nome: 'B' })}>login B</button>
    <button onClick={() => auth.login('token-C')}>login without profile</button>
    <button onClick={() => auth.rememberReturnTarget('/meus-lembretes?medicamentoId=7')}>remember</button>
    <button onClick={() => setChecked(auth.consumeReturnTarget())}>consume</button>
    <button onClick={async () => setChecked(await auth.revalidateSession())}>revalidate</button>
    <button onClick={async () => {
      try { await apiRequest('usuario/senha', { method: 'PATCH', onUnauthorized: 'throw', body: JSON.stringify({ senhaAtual: 'AtualSintetica1!', novaSenha: 'NovaSintetica2!' }) }); }
      catch (error) { if (error instanceof ApiError && error.status === 401) setChecked(await auth.revalidateSession()); }
    }}>password operation</button>
  </>;
}
const state = () => JSON.parse(screen.getByTestId('session').textContent!);
function mount() { return render(<AuthProvider><Probe /></AuthProvider>); }
beforeEach(() => { router.push.mockReset(); clearNavigationFeedback(); vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); });

it('WUX_STATE_10', async () => {
  localStorage.setItem('access_token', 'token-A');
  localStorage.setItem('user_data', JSON.stringify({ id: 99, nome: 'Stale' }));
  const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise).mockResolvedValueOnce(json({ data: user }));
  mount();
  expect(state()).toMatchObject({ loading: true, authenticated: false, user: null, status: 'restoring' });
  expect(screen.getByRole('status')).toHaveTextContent('Verificando sessão');
  await act(async () => { gate.resolve(new Response('offline', { status: 503 })); });
  expect(state()).toMatchObject({ loading: false, authenticated: false, user: null, status: 'unavailable' });
  expect(screen.getByRole('alert')).toHaveTextContent('Restaurar sessão');
  expect(localStorage.getItem('access_token')).toBe('token-A');
  expect(consumeNavigationFeedback()).toBeNull();
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await waitFor(() => expect(state()).toMatchObject({ authenticated: true, status: 'authenticated', user }));
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.mocked(fetch).mock.calls.map(call => call[1]?.method)).toEqual(['GET', 'GET']);
});
it.each([200, 401, 503])('WUX_STATE_09 profile revalidation %s after operational password 401', async status => {
  localStorage.setItem('access_token', 'token-A');
  let reads = 0; const calls: string[] = [];
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const path = new URL(String(input)).pathname; const method = init?.method ?? 'GET'; calls.push(`${method} ${path}`);
    if (path === '/usuario/me' && method === 'GET') { reads++; return reads === 1 ? json({ data: user }) : json(status === 200 ? { data: user } : {}, status); }
    if (path === '/usuario/senha' && method === 'PATCH') return json({ message: 'Senha atual incorreta' }, 401);
    throw new Error(`Unexpected ${method} ${path}`);
  });
  mount();
  await waitFor(() => expect(state().authenticated).toBe(true));
  fireEvent.click(screen.getByRole('button', { name: 'password operation' }));
  await waitFor(() => expect(screen.getByTestId('checked')).toHaveTextContent(status === 200 ? 'valid' : status === 401 ? 'expired' : 'unavailable'));
  expect(calls).toEqual(['GET /usuario/me', 'PATCH /usuario/senha', 'GET /usuario/me']);
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual({ senhaAtual: 'AtualSintetica1!', novaSenha: 'NovaSintetica2!' });
  expect(localStorage.getItem('access_token')).toBe(status === 401 ? null : 'token-A');
  expect(state().authenticated).toBe(status !== 401);
  if (status === 401) {
    expect(state()).toMatchObject({ user: null, identity: '', generation: 1 });
    expect(router.push).toHaveBeenCalledWith('/login');
    expect(consumeNavigationFeedback()).toBe('session-expired');
  } else {
    expect(state().user).toEqual(user);
    expect(router.push).not.toHaveBeenCalled();
    expect(consumeNavigationFeedback()).toBeNull();
  }
});
it('restoration network failure retains the credential and recovers only after manual retry', async () => {
  localStorage.setItem('access_token', 'token-A');
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(json({ data: user }));
  mount();
  await waitFor(() => expect(state().status).toBe('unavailable'));
  expect(localStorage.getItem('access_token')).toBe('token-A');
  expect(state()).toMatchObject({ authenticated: false, user: null });
  expect(router.push).not.toHaveBeenCalled();
  expect(consumeNavigationFeedback()).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await waitFor(() => expect(state()).toMatchObject({ authenticated: true, user }));
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('accepts only known internal return destinations and consumes them once', async () => {
  for (const target of ['https://evil.test', '//evil.test', '/\\evil.test', '/hoje/../historico', '/%2f%2fevil.test', '/unknown', '/login', 'javascript:alert(1)', '/historico%0a', '/meus-medicamentos/7/editar/extra']) expect(safeInternalReturnTarget(target), target).toBe('/hoje');
  for (const target of ['/hoje', '/historico', '/Configuracoes', '/novo-medicamento', '/meus-medicamentos', '/meus-medicamentos/7/editar', '/meus-lembretes?medicamentoId=7']) expect(safeInternalReturnTarget(target)).toBe(target);
  mount(); await waitFor(() => expect(state().loading).toBe(false));
  fireEvent.click(screen.getByText('remember')); expect(state().returnTarget).toBe('/meus-lembretes?medicamentoId=7');
  fireEvent.click(screen.getByText('login B')); expect(state().returnTarget).toBe('/meus-lembretes?medicamentoId=7');
  fireEvent.click(screen.getByText('consume')); expect(screen.getByTestId('checked')).toHaveTextContent('/meus-lembretes?medicamentoId=7');
  expect(state().returnTarget).toBe('/hoje');
  fireEvent.click(screen.getByText('consume')); expect(screen.getByTestId('checked')).toHaveTextContent('/hoje');
});
it('revokes old restoration on login and clears the previous identity on logout', async () => {
  localStorage.setItem('access_token', 'token-A'); const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise);
  mount(); fireEvent.click(screen.getByText('login B'));
  expect(state()).toMatchObject({ user: { id: 8 }, authenticated: true, generation: 1, identity: '8:1' });
  await act(async () => { gate.resolve(json({ data: user })); });
  expect(state().user.id).toBe(8);
  expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
  fireEvent.click(screen.getByText('logout'));
  expect(state()).toMatchObject({ user: null, authenticated: false, generation: 2, identity: '' });
  expect(localStorage.getItem('access_token')).toBeNull();
  expect(localStorage.getItem('user_data')).toBeNull();
  expect(router.push).toHaveBeenCalledWith('/login');
});
it('requires profile validation after token-only login and discards stale revalidation', async () => {
  const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise);
  mount(); await waitFor(() => expect(state().loading).toBe(false));
  fireEvent.click(screen.getByText('login without profile'));
  expect(state()).toMatchObject({ status: 'restoring', authenticated: false, user: null, identity: '' });
  await act(async () => { gate.resolve(json({ data: user })); });
  expect(state()).toMatchObject({ status: 'authenticated', user });
  const stale = pending(); vi.mocked(fetch).mockReturnValueOnce(stale.promise);
  fireEvent.click(screen.getByText('revalidate')); fireEvent.click(screen.getByText('login B'));
  await act(async () => { stale.resolve(json({}, 401)); });
  expect(screen.getByTestId('checked')).toHaveTextContent('stale');
  expect(state().user.id).toBe(8);
  expect(localStorage.getItem('access_token')).toBe('token-B');
});
it.each([200, 401, 503])('session revalidation exposes a single outcome for %s', async status => {
  mount(); await waitFor(() => expect(state().loading).toBe(false));
  fireEvent.click(screen.getByText('login B'));
  vi.mocked(fetch).mockResolvedValueOnce(json(status === 200 ? { data: { id: 8 } } : {}, status));
  fireEvent.click(screen.getByText('revalidate'));
  await waitFor(() => expect(screen.getByTestId('checked')).toHaveTextContent(status === 200 ? 'valid' : status === 401 ? 'expired' : 'unavailable'));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(state().authenticated).toBe(status !== 401);
});
