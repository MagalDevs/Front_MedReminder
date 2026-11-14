import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import LoginScreen from '@/app/features/web-ux/screens/LoginScreen';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => { push.mockReset(); });
function Session() { const { user } = useAuth(); return <p>{user?.nome ?? 'Sem sessão'}</p>; }
function mount(returnTo?: string) { render(<AuthProvider><LoginScreen returnTo={returnTo} /><Session /></AuthProvider>); }
function fill() { fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.test' } }); fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Secret123!' } }); }
it('T29 reveals password accessibly and signs in before returning to the safe internal destination', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'new-token' })).mockResolvedValueOnce(json({ data: { id: 7, nome: 'Ana' } })); mount('/novo-medicamento'); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' })); expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text'); expect(screen.getByLabelText('Senha')).toHaveValue('Secret123!');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' })); expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); await screen.findByText('Ana'); expect(push).toHaveBeenCalledWith('/novo-medicamento');
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ email: 'ana@example.test', senha: 'Secret123!' }); expect(new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer new-token'); expect(localStorage.getItem('access_token')).toBe('new-token');
});
it('T29 invalid external target falls back to Hoje', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'new-token' })).mockResolvedValueOnce(json({ data: { id: 7, nome: 'Ana' } })); mount('//evil.test'); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); await waitFor(() => expect(push).toHaveBeenCalledWith('/hoje'));
});
it('T29 failed profile does not establish session or navigate and permits manual recovery', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'new-token' })).mockResolvedValueOnce(json({ message: 'Indisponível' }, 503)); mount(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByRole('alert'); expect(push).not.toHaveBeenCalled(); expect(localStorage.getItem('access_token')).toBeNull(); expect(screen.getByText('Sem sessão')).toBeVisible(); expect(screen.getByLabelText('Senha')).toHaveValue('Secret123!');
  vi.mocked(fetch).mockResolvedValueOnce(json({ access_token: 'new-token' })).mockResolvedValueOnce(json({ data: { id: 7, nome: 'Ana' } })); fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); await screen.findByText('Ana'); expect(push).toHaveBeenCalledWith('/hoje');
});
