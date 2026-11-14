import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import HomeScreen from '@/app/features/web-ux/screens/HomeScreen';
import LoginScreen from '@/app/features/web-ux/screens/LoginScreen';
import RegistrationScreen from '@/app/features/web-ux/screens/RegistrationScreen';
import { AuthProvider } from '@/app/contexts/AuthContext';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const csv = 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento A\nVitamina B,Suplemento B\n';
it('T32 public entry introduces the routine and offers Create account before secondary access and search', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(csv)); render(<HomeScreen />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Medicamentos e doses em um só lugar');
  expect(screen.getByText(/Organize seus medicamentos/)).toBeVisible(); const create = screen.getByRole('link', { name: 'Criar conta' }); const signIn = screen.getByRole('link', { name: 'Entrar' });
  expect(create).toHaveAttribute('href', '/cadastro'); expect(signIn).toHaveAttribute('href', '/login'); expect(create.compareDocumentPosition(signIn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const input = screen.getByRole('combobox', { name: 'Buscar no catálogo' }); expect(signIn.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await waitFor(() => expect(screen.queryByText('Carregando catálogo...')).not.toBeInTheDocument()); input.focus(); fireEvent.change(input, { target: { value: 'Vitamina' } }); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
  await screen.findByRole('heading', { name: 'Vitamina A' }); expect(screen.getByRole('status')).toHaveTextContent('Suplemento A'); expect(input).toHaveValue('Vitamina A');
  expect(vi.mocked(fetch).mock.calls.map(([input]) => String(input))).toEqual(['/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv']);
});
it('T32 public screens retain a single content h1 with the brand rendered as a name', () => {
  const view = render(<AuthProvider><LoginScreen /></AuthProvider>); expect(screen.getAllByRole('heading', { level: 1 }).map(node => node.textContent)).toEqual(['Entrar']); expect(screen.getByText('MedReminder')).toBeVisible(); view.unmount();
  render(<RegistrationScreen />); expect(screen.getAllByRole('heading', { level: 1 }).map(node => node.textContent)).toEqual(['Criar conta']); expect(screen.getByText('MedReminder')).toBeVisible();
});
it('T32 unavailable catalog keeps public destinations and the manual path available without private writes', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('offline')); render(<HomeScreen />); await screen.findByRole('alert');
  const input = screen.getByRole('combobox'); fireEvent.change(input, { target: { value: 'Nome manual' } }); fireEvent.click(screen.getByRole('button', { name: 'Cadastrar manualmente' }));
  await screen.findByRole('heading', { name: 'Nome manual' }); expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro'); expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login'); expect(fetch).toHaveBeenCalledTimes(1); expect(vi.mocked(fetch).mock.calls.some(([, init]) => ['POST', 'PUT', 'PATCH'].includes(init?.method ?? 'GET'))).toBe(false);
});
