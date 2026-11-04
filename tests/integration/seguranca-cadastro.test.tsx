import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  const { container } = render(<Cadastro />);
  fireEvent.change(screen.getByPlaceholderText('Nome e sobrenome'), { target: { value: payload.nome } });
  fireEvent.change(screen.getByPlaceholderText('exemplo@email.com'), { target: { value: payload.email } });
  fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: payload.cpf } });
  fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: payload.cep } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: payload.dataNasc } });
  const passwords = screen.getAllByPlaceholderText('********');
  fireEvent.change(passwords[0], { target: { value: payload.senha } });
  fireEvent.change(passwords[1], { target: { value: confirm } });
  fireEvent.click(screen.getByLabelText('Sou cuidador'));
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
}

function expectRequest() {
  expect(fetch).toHaveBeenCalledExactlyOnceWith('https://medreminder-backend.onrender.com/usuario', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
}

describe('IT-08 SEC-01 — privacidade do cadastro real', () => {
  beforeEach(() => {
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
    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem');
    expect(fetch).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expectPrivateConsole();
  });

  it.each([
    { body: { message: `Email já cadastrado: ${payload.email}` }, message: `Email já cadastrado: ${payload.email}` },
    { body: {}, message: 'Erro ao cadastrar. Tente novamente.' },
  ])('IT-08 SEC-01 falha HTTP mantém payload e mensagem $message sem log pessoal', async ({ body, message }) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 400 }));
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
