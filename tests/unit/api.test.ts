import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, API_URL } from '@/app/utils/api';

function respond(body: unknown, status = 200, contentType = 'application/json') {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValueOnce(new Response(
    contentType.includes('application/json') ? JSON.stringify(body) : String(body),
    { status, headers: { 'Content-Type': contentType } },
  ));
  return fetchMock;
}

function requestHeaders(index = 0) {
  return new Headers(vi.mocked(fetch).mock.calls[index][1]?.headers);
}

// jsdom cannot navigate. Replace only the location boundary, forwarding all
// other window properties to the real window; setup.ts restores the global.
function controlledLocation() {
  const location = { href: 'http://localhost/area-protegida' };
  vi.stubGlobal('window', new Proxy(window, {
    get(target, property) {
      return property === 'location' ? location : Reflect.get(target, property, target);
    },
  }));
  return location;
}

describe('apiRequest real — TEST-01', () => {
  it.each(['dose/me', '/dose/me'])('UT-01 TEST-01 normaliza a barra em %s e preserva opções', async (endpoint) => {
    const controller = new AbortController();
    const fetchMock = respond({ id: 7 });
    await apiRequest(endpoint, {
      requireAuth: false, method: 'POST', body: '{"id":7}',
      cache: 'no-store', signal: controller.signal, headers: { 'X-Fixture': 'sintetica' },
    });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${API_URL}/dose/me`, expect.objectContaining({
      method: 'POST', body: '{"id":7}', cache: 'no-store', signal: controller.signal,
    }));
    expect(requestHeaders().get('X-Fixture')).toBe('sintetica');
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('requireAuth');
  });

  it('UT-02 TEST-01 envia Bearer quando autenticação padrão encontra token', async () => {
    localStorage.setItem('access_token', 'token-sintetico');
    respond({});
    await apiRequest('/dose/me');
    expect(requestHeaders().get('Authorization')).toBe('Bearer token-sintetico');
  });

  it('UT-02 TEST-01 sem token obrigatório rejeita antes de chamar fetch', async () => {
    await expect(apiRequest('/dose/me')).rejects.toThrow('Authentication required but no token found');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([false, true])('UT-02 TEST-01 chamada pública não adiciona Bearer (token presente: %s)', async (hasToken) => {
    if (hasToken) localStorage.setItem('access_token', 'token-sintetico');
    respond({});
    await apiRequest('/publico', { requireAuth: false });
    expect(requestHeaders().has('Authorization')).toBe(false);
  });

  it.each(['GET', 'POST', 'PUT', 'PATCH'])('UT-03 TEST-01 Content-Type padrão de %s', async (method) => {
    respond({});
    await apiRequest('/fixture', { requireAuth: false, method });
    expect(requestHeaders().get('Content-Type')).toBe(method === 'GET' ? null : 'application/json');
  });

  it.each(['GET', 'POST', 'PUT', 'PATCH'])('UT-03 TEST-01 preserva Content-Type explícito em %s', async (method) => {
    respond({});
    await apiRequest('/fixture', { requireAuth: false, method, headers: { 'content-type': 'text/plain' } });
    expect(requestHeaders().get('Content-Type')).toBe('text/plain');
  });

  it('UT-04 TEST-01 devolve objeto JSON com charset', async () => {
    respond({ data: [{ id: 7 }] }, 200, 'application/json; charset=utf-8');
    await expect(apiRequest('/fixture', { requireAuth: false })).resolves.toEqual({ data: [{ id: 7 }] });
  });

  it('UT-04 TEST-01 devolve texto sem transformar o conteúdo', async () => {
    respond('resposta sintética', 200, 'text/plain');
    await expect(apiRequest('/fixture', { requireAuth: false })).resolves.toBe('resposta sintética');
  });

  const statuses = [
    [400, 'Requisição inválida'], [403, 'Acesso negado'],
    [404, 'Recurso não encontrado'], [429, 'Muitas requisições. Tente novamente mais tarde'],
    [500, 'Erro interno do servidor'],
  ] as const;

  describe.each(statuses)('UT-05 TEST-01 HTTP %i (%s)', (status, fallback) => {
    it('usa fallback sem mensagem no JSON', async () => {
      respond({}, status);
      await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow(fallback);
    });

    it.each([
      { format: 'message > error > errors', body: { message: 'Mensagem prioritária', error: 'Erro secundário', errors: ['Terceiro'] }, expected: 'Mensagem prioritária' },
      { format: 'error > errors (message inválido)', body: { message: 42, error: 'Erro prioritário', errors: ['Terceiro'] }, expected: 'Erro prioritário' },
      { format: 'errors (message/error inválidos)', body: { message: null, error: {}, errors: [{ message: 'Campo inválido' }, 'Outro campo'] }, expected: 'Campo inválido, Outro campo' },
    ])('prioriza $format', async ({ body, expected }) => {
      respond(body, status);
      await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow(expected);
    });
  });

  it('UT-05 TEST-01 erro em texto usa fallback do status', async () => {
    respond('corpo textual', 500, 'text/plain');
    await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow('Erro interno do servidor');
  });

  it('UT-06 TEST-01 401 autenticado limpa sessão e redireciona para /login', async () => {
    const location = controlledLocation();
    localStorage.setItem('access_token', 'token-sintetico');
    localStorage.setItem('user_data', JSON.stringify({ nome: 'Ana Teste' }));
    localStorage.setItem('preferencia', 'preservada');
    respond({}, 401);
    await expect(apiRequest('/dose/me')).rejects.toThrow('Não autorizado');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(localStorage.getItem('preferencia')).toBe('preservada');
    expect(location.href).toBe('/login');
  });

  it('UT-06 TEST-01 401 público rejeita preservando sessão e navegação', async () => {
    const location = controlledLocation();
    const storedUser = JSON.stringify({ nome: 'Ana Teste' });
    localStorage.setItem('access_token', 'token-sintetico');
    localStorage.setItem('user_data', storedUser);
    respond({}, 401);
    await expect(apiRequest('/auth/login', { requireAuth: false })).rejects.toThrow('Não autorizado');
    expect(localStorage.getItem('access_token')).toBe('token-sintetico');
    expect(localStorage.getItem('user_data')).toBe(storedUser);
    expect(location.href).toBe('http://localhost/area-protegida');
  });

  it('UT-07 TEST-01 HTTP 200 com success:false rejeita a mensagem', async () => {
    respond({ message: 'falha', success: false });
    await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow('falha');
  });

  it.each([
    { message: 'ok', success: true },
    { message: 'Login concluído', access_token: 'token-sintetico' },
  ])('UT-07 TEST-01 preserva sucesso HTTP 200: %j', async (body) => {
    respond(body);
    await expect(apiRequest('/fixture', { requireAuth: false })).resolves.toEqual(body);
  });
});

describe('IT-08 SEC-02 — diagnósticos HTTP sem conteúdo arbitrário', () => {
  const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const sensitive = 'senha-SEC02! cpf-98765432109 cep-87654321 sentinela-api@example.test';

  beforeEach(() => {
    for (const method of methods) vi.spyOn(console, method).mockImplementation(() => {});
  });

  function expectPrivateConsole() {
    for (const method of methods) {
      const output = JSON.stringify(vi.mocked(console[method]).mock.calls);
      for (const sentinel of sensitive.split(' ')) expect(output).not.toContain(sentinel);
    }
  }

  it.each([
    { format: 'message', body: { message: sensitive }, status: 400, expected: sensitive, contentType: 'application/json' },
    { format: 'error', body: { error: sensitive }, status: 403, expected: sensitive, contentType: 'application/json' },
    { format: 'errors', body: { errors: [{ message: sensitive }, 'Outro campo'] }, status: 422, expected: `${sensitive}, Outro campo`, contentType: 'application/json' },
    { format: 'texto', body: sensitive, status: 500, expected: 'Erro interno do servidor', contentType: 'text/plain' },
  ])('UT-05 IT-08 SEC-02 preserva erro $format / HTTP $status sem corpo no console', async ({ body, status, expected, contentType }) => {
    respond(body, status, contentType);
    await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow(expected);
    expect(console.error).toHaveBeenCalledExactlyOnceWith('API Error:', { status });
    expectPrivateConsole();
  });

  it.each([
    { error: true }, { status: 'error' }, { success: false },
  ])('UT-07 IT-08 SEC-02 HTTP 200 mantém rejeição com indicador %j sem log da mensagem', async (indicator) => {
    respond({ message: sensitive, ...indicator });
    await expect(apiRequest('/fixture', { requireAuth: false })).rejects.toThrow(sensitive);
    expect(console.warn).toHaveBeenCalledExactlyOnceWith('Server returned message in successful response');
    expectPrivateConsole();
  });

  it('UT-07 IT-08 SEC-02 HTTP 200 informativo mantém retorno sem log da mensagem', async () => {
    const body = { message: sensitive, data: { nome: sensitive } };
    respond(body);
    await expect(apiRequest('/fixture', { requireAuth: false })).resolves.toEqual(body);
    expectPrivateConsole();
  });

  it.each([true, false])('UT-06 IT-08 SEC-02 401 mantém sessão/navegação conforme requireAuth=%s sem corpo no console', async (requireAuth) => {
    const location = controlledLocation();
    localStorage.setItem('access_token', 'token-sintetico');
    localStorage.setItem('user_data', sensitive);
    localStorage.setItem('preferencia', 'preservada');
    respond({ message: sensitive }, 401);
    await expect(apiRequest('/fixture', { requireAuth })).rejects.toThrow(sensitive);
    expect(localStorage.getItem('access_token')).toBe(requireAuth ? null : 'token-sintetico');
    expect(localStorage.getItem('user_data')).toBe(requireAuth ? null : sensitive);
    expect(localStorage.getItem('preferencia')).toBe('preservada');
    expect(location.href).toBe(requireAuth ? '/login' : 'http://localhost/area-protegida');
    expectPrivateConsole();
  });
});
