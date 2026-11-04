import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Cadastro from '@/app/cadastro/page';
import {
  arrayErrorFixture,
  loginRequestFixture,
  userFixture,
  type BackendErrorResponse,
  type ProfileResponse,
} from '../fixtures/backend-contracts';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

// CreateUsuarioDto: allowlist da matriz de POST /usuario no design.
const payload = {
  nome: String(userFixture.nome),
  dataNasc: String(userFixture.dataNasc),
  cpf: String(userFixture.cpf),
  email: String(userFixture.email),
  cep: String(userFixture.cep),
  cuidador: false,
  senha: ` ${loginRequestFixture.senha} `,
};
const unavailableMessage = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';

function jsonResponse(body: unknown, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function submit() {
  const { container } = render(<Cadastro />);
  fireEvent.change(screen.getByPlaceholderText('Nome e sobrenome'), { target: { value: payload.nome } });
  fireEvent.change(screen.getByPlaceholderText('exemplo@email.com'), { target: { value: payload.email } });
  fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '000.000.000-00' } });
  fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '01001-000' } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: payload.dataNasc } });
  for (const input of screen.getAllByPlaceholderText('********')) {
    fireEvent.change(input, { target: { value: payload.senha } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
}

describe('BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend', () => {
  beforeEach(() => {
    router.push.mockReset();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://cadastro.test.invalid');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it.each([
    { origin: 'http://cadastro.test.invalid', storedToken: false },
    { origin: 'https://outro-cadastro.test.invalid/', storedToken: true },
  ])('BEAPI-01 BEAPI-12 sucesso envia DTO exato sem Bearer para $origin', async ({ origin, storedToken }) => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', origin);
    if (storedToken) localStorage.setItem('access_token', 'token-sintetico-nao-enviar');
    const response: ProfileResponse = { message: 'Cadastro sintético realizado', data: { ...userFixture } };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(response, 201));

    submit();

    await waitFor(() => expect(router.push).toHaveBeenCalledExactlyOnceWith('/login'));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${origin.replace(/\/+$/, '')}/usuario`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(payload);
    const headers = new Headers(init?.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.has('Authorization')).toBe(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBe(storedToken ? 'token-sintetico-nao-enviar' : null);
  });

  it('BEAPI-02 BEAPI-12 validação 400 apresenta cada mensagem do array como item de lista', async () => {
    const body: BackendErrorResponse = {
      ...arrayErrorFixture, message: ['CPF inválido', 'CEP deve conter oito dígitos'],
    };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body, 400));

    submit();

    const items = within(await screen.findByRole('alert')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(body.message);
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('BEAPI-02 status 429 com corpo ilegível exibe os segundos do Retry-After sem reenvio', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('corpo inválido', {
      status: 429, headers: { 'Retry-After': '42', 'Content-Type': 'application/json' },
    }));

    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas de cadastro. Tente novamente em 42 segundos.');
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('BEAPI-02 status 429 sem Retry-After oferece espera sem inventar duração', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ...arrayErrorFixture, statusCode: 429 }, 429));

    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas de cadastro. Tente novamente mais tarde.');
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('BEAPI-02 número 429 no texto de uma validação 400 não vira rate limit', async () => {
    const message = 'Campo inválido no registro 429';
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ...arrayErrorFixture, message }, 400, { 'Retry-After': '42' }));

    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('alert')).not.toHaveTextContent('Muitas tentativas');
    expect(router.push).not.toHaveBeenCalled();
  });

  it.each(['503', 'rede'])('BEAPI-02 indisponibilidade %s apresenta mensagem segura', async (failure) => {
    const sensitiveDetail = 'diagnostico-interno-sintetico';
    if (failure === '503') {
      const body: BackendErrorResponse = { ...arrayErrorFixture, statusCode: 503, message: sensitiveDetail };
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body, 503));
    } else {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError(sensitiveDetail));
    }

    submit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(unavailableMessage);
    expect(alert).not.toHaveTextContent(sensitiveDetail);
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
