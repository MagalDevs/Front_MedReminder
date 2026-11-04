import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { LembreteProvider, LembreteContext } from '@/app/contexts/lembreteContext';
import { apiRequest } from '@/app/utils/api';

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }); }
function pending() { let resolve!: (r: Response) => void; const promise = new Promise<Response>(r => { resolve = r; }); return { promise, resolve }; }
function Probe() {
  const auth = useAuth(); const doses = useContext(LembreteContext);
  return <><output data-testid="state">{JSON.stringify({ authenticated: auth.isAuthenticated, loading: auth.loading, user: auth.user })}</output>
    <output data-testid="doses">{JSON.stringify(doses?.lembretes ?? [])}</output>
    <button onClick={auth.logout}>logout</button><button onClick={() => auth.login('token-b', { id: 2, nome: 'B' })}>login B</button></>;
}
function mount() { return render(<AuthProvider><LembreteProvider><Probe /></LembreteProvider></AuthProvider>); }
const state = () => JSON.parse(screen.getByTestId('state').textContent!);
const dose = { id: 1, tomado: false, data_dose: '2026-11-04T12:00:00Z', remedio: { nome: 'Projeção parcial' } };
function token() { localStorage.setItem('access_token', 'token-a'); localStorage.setItem('user_data', JSON.stringify({ id: 999, nome: 'Stale' })); }

describe('BEAPI-03/BEAPI-04 restauração e consultas por identidade', () => {
  it('BEAPI-03 o provider navega ao login e limpa o estado após 401 do cliente real', async () => {
    token();
    // Providers may start the dose load before or after the assertion below.
    // Route by endpoint so its response cannot be consumed by the explicit 401.
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/usuario/me')) return json({ data: { id: 1 } });
      if (url.endsWith('/dose/me')) return json({ data: [] });
      if (url.endsWith('/fixture-private')) return json({}, 401);
      throw new Error(`Unexpected test request: ${url}`);
    });
    mount();
    await waitFor(() => expect(state().authenticated).toBe(true));
    await act(async () => {
      await expect(apiRequest('fixture-private')).rejects.toMatchObject({ status: 401 });
    });
    expect(state().authenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('doses')).toHaveTextContent('[]');
    expect(router.push).toHaveBeenCalledWith('/login');
  });
  it('BEAPI-03 BEAPI-04 sem token não consulta perfil nem doses', async () => {
    mount(); await waitFor(() => expect(state().loading).toBe(false));
    expect(fetch).not.toHaveBeenCalled(); expect(state().authenticated).toBe(false);
  });
  it('BEAPI-03 BEAPI-04 mantém loading e zero doses privadas até perfil confirmado', async () => {
    token(); const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise).mockResolvedValueOnce(json({ data: [dose] }));
    mount(); expect(state()).toEqual({ authenticated: false, loading: true, user: null }); expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => gate.resolve(json({ data: { id: 1, nome: 'Servidor' } })));
    await waitFor(() => expect(screen.getByTestId('doses')).toHaveTextContent('Projeção parcial'));
    expect(state().user.nome).toBe('Servidor'); expect(state().authenticated).toBe(true);
    expect(new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer token-a');
  });
  it('BEAPI-03 401 ilegível invalida credencial e não busca doses', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(new Response('{broken', { status: 401, headers: { 'content-type': 'application/json' } }));
    mount(); await waitFor(() => expect(state().loading).toBe(false));
    expect(localStorage.getItem('access_token')).toBeNull(); expect(state().authenticated).toBe(false); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(['network', 503])('BEAPI-03 erro %s não confirma nem destrói credencial', async error => {
    token(); if (error === 'network') vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')); else vi.mocked(fetch).mockResolvedValueOnce(json({}, 503));
    mount(); await waitFor(() => expect(state().loading).toBe(false));
    expect(state().authenticated).toBe(false); expect(state().user).toBeNull(); expect(localStorage.getItem('access_token')).toBe('token-a'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('BEAPI-03 logout durante perfil pendente impede restauração atrasada', async () => {
    token(); const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise); mount();
    fireEvent.click(screen.getByText('logout')); await act(async () => gate.resolve(json({ data: { id: 1 } })));
    expect(state().authenticated).toBe(false); expect(state().user).toBeNull(); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('BEAPI-03 perfil A atrasado não substitui login B', async () => {
    token(); const gate = pending(); vi.mocked(fetch).mockReturnValueOnce(gate.promise).mockResolvedValueOnce(json({ data: [] })); mount();
    fireEvent.click(screen.getByText('login B')); await act(async () => gate.resolve(json({ data: { id: 1 } })));
    expect(state().user.id).toBe(2); expect(localStorage.getItem('access_token')).toBe('token-b');
  });
  it('BEAPI-04 logout limpa listas e descarta resposta A pendente', async () => {
    token(); const doses = pending(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1 } })).mockReturnValueOnce(doses.promise);
    mount(); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); fireEvent.click(screen.getByText('logout'));
    await act(async () => doses.resolve(json({ data: [dose] })));
    expect(screen.getByTestId('doses')).toHaveTextContent('[]'); expect(state().authenticated).toBe(false);
  });
  it('BEAPI-04 resposta de doses A após login B não publica dados A', async () => {
    token(); const dosesA = pending(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1 } })).mockReturnValueOnce(dosesA.promise).mockResolvedValueOnce(json({ data: [{ ...dose, id: 2, remedio: { nome: 'Conta B' } }] }));
    mount(); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); fireEvent.click(screen.getByText('login B'));
    await waitFor(() => expect(screen.getByTestId('doses')).toHaveTextContent('Conta B'));
    await act(async () => dosesA.resolve(json({ data: [dose] })));
    expect(screen.getByTestId('doses')).not.toHaveTextContent('Projeção parcial');
  });
  it('BEAPI-04 logout após lista carregada limpa dados imediatamente', async () => {
    token(); vi.mocked(fetch).mockResolvedValueOnce(json({ data: { id: 1 } })).mockResolvedValueOnce(json({ data: [dose] }));
    mount(); await waitFor(() => expect(screen.getByTestId('doses')).toHaveTextContent('Projeção parcial'));
    fireEvent.click(screen.getByText('logout')); expect(screen.getByTestId('doses')).toHaveTextContent('[]');
  });
});
