import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fillRegistrationAccount, fillRegistrationPersonal, submitRegistration } from '../helpers/registration';
import Cadastro from '@/app/cadastro/page';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const payload = {
  nome: 'Pessoa Sintética', dataNasc: '1999-02-03', cpf: '98765432109',
  email: 'sentinela-cadastro@example.test', cep: '87654321', cuidador: true,
  senha: 'Senha-Sentinela-SEC01!',
};
const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
const sentinels = [payload.senha, payload.cpf, '987.654.321-09', payload.cep, '87654-321', payload.email];

function expectPrivateConsole() {
  for (const method of methods) {
    for (const call of vi.mocked(console[method]).mock.calls) {
      // Include Error.message/stack as well as nested objects in the inspection.
      const output = JSON.stringify(call, (_key, value) => value instanceof Error ? String(value.stack) : value);
      for (const sentinel of sentinels) expect(output).not.toContain(sentinel);
    }
  }
}

function fillAndSubmit(confirm = payload.senha) {
  render(<Cadastro />);
  fillRegistrationAccount(payload.email, payload.senha, confirm);
  if (confirm !== payload.senha) return;
  fillRegistrationPersonal(payload);
  submitRegistration();
}

function expectRequest() {
  expect(fetch).toHaveBeenCalledExactlyOnceWith('http://cadastro-security.test.invalid/usuario', {
    method: 'POST', headers: new Headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ nome: payload.nome, email: payload.email, senha: payload.senha, cpf: payload.cpf, cep: payload.cep, dataNasc: payload.dataNasc, cuidador: payload.cuidador }),
    signal: expect.any(AbortSignal),
  });
}

describe('IT-08 SEC-01 — privacidade do cadastro real', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://cadastro-security.test.invalid');
    router.push.mockReset();
    for (const method of methods) vi.spyOn(console, method).mockImplementation(() => {});
  });

  it('IT-08 SEC-01 cadastro válido mantém payload e navegação sem expor sentinelas', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 201 }));
    fillAndSubmit();
    await waitFor(() => expect(router.push).toHaveBeenCalledExactlyOnceWith('/login'));
    expectRequest();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expectPrivateConsole();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('IT-08 SEC-01 cadastro inválido mantém validação sem enviar nem expor sentinelas', () => {
    fillAndSubmit('confirmacao-divergente');
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expectPrivateConsole();
  });

  it.each([
    { body: { message: `Email já cadastrado: ${payload.email}` }, message: `Email já cadastrado: ${payload.email}` },
    { body: {}, message: 'Erro ao cadastrar. Tente novamente.' },
  ])('IT-08 SEC-01 falha HTTP mantém payload e mensagem $message sem log pessoal', async ({ body, message }) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    }));
    fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expectRequest();
    expect(router.push).not.toHaveBeenCalled();
    expectPrivateConsole();
  });

  it('IT-08 SEC-01 falha de rede mantém mensagem genérica sem imprimir Error sensível', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error(sentinels.join(' ')));
    fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    expectRequest();
    expect(router.push).not.toHaveBeenCalled();
    expectPrivateConsole();
  });
});
