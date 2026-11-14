import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import RegistrationScreen from '@/app/features/web-ux/screens/RegistrationScreen';
const { push } = vi.hoisted(() => ({ push: vi.fn() })); vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
beforeEach(() => { push.mockReset(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-14T12:00:00-03:00')); });
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function account() { change('E-mail', 'ana@example.test'); change('Senha', 'Secret123!'); change('Confirmar senha', 'Secret123!'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); }
function personal() { change('Nome completo', 'Ana Silva'); change('CPF', '123.456.789-01'); change('CEP', '12345-678'); change('Data de nascimento', '1990-01-02'); }
it('T30 progressive registration preserves account, reveals password and sends complete DTO only after personal summary', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 201 })); render(<RegistrationScreen />); account(); expect(screen.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible(); personal();
  fireEvent.click(screen.getByLabelText('Sou cuidador')); expect(screen.getByRole('region', { name: 'Confira os dados obrigatórios' })).toHaveTextContent('Ana Silva'); expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para Conta' })); expect(screen.getByLabelText('Senha')).toHaveValue('Secret123!'); fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' })); expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-01'); fireEvent.click(screen.getByRole('button', { name: 'Criar conta' })); await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  expect(fetch).toHaveBeenCalledTimes(1); expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ email: 'ana@example.test', senha: 'Secret123!', nome: 'Ana Silva', cpf: '12345678901', cep: '12345678', dataNasc: '1990-01-02', cuidador: true });
});
it('T30 blocks missing required personal data, future birth and invalid document lengths without fabricated defaults', async () => {
  render(<RegistrationScreen />); account(); fireEvent.click(screen.getByRole('button', { name: 'Criar conta' })); await screen.findByText('Informe seu nome, de 1 a 150 caracteres.'); expect(fetch).not.toHaveBeenCalled();
  personal(); change('CPF', '123'); change('CEP', '123'); change('Data de nascimento', '2026-11-15'); fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
  expect(screen.getByText('Informe um CPF com exatamente 11 dígitos.')).toBeVisible(); expect(screen.getByText('Informe um CEP com exatamente 8 dígitos.')).toBeVisible(); expect(screen.getByText(/Informe uma data de nascimento válida/)).toBeVisible(); await waitFor(() => expect(screen.getByLabelText('CPF')).toHaveFocus()); expect(fetch).not.toHaveBeenCalled();
});
it('T30 invalid account remains on Conta and failed registration retains inputs without claiming success', async () => {
  render(<RegistrationScreen />); change('E-mail', 'invalid'); change('Senha', 'short'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); expect(screen.getByRole('heading', { name: 'Conta' })).toBeVisible(); expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true'); expect(fetch).not.toHaveBeenCalled();
  account(); personal(); vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Indisponível' }), { status: 503 })); fireEvent.click(screen.getByRole('button', { name: 'Criar conta' })); await screen.findByRole('alert'); expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Silva'); expect(push).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled();
});
