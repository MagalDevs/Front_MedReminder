import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { arrayErrorFixture, stringErrorFixture } from '../fixtures/backend-contracts';

type ApiModule = typeof import('@/app/utils/api');
type ApiErrorInstance = InstanceType<ApiModule['ApiError']>;

// Cada caso reavalia o módulo: `API_URL` é calculada na importação e a origem vem do
// ambiente (vi.stubEnv + vi.resetModules).
async function loadApi(): Promise<ApiModule> {
  vi.resetModules();
  return import('@/app/utils/api');
}

function respond(body: BodyInit | null, status: number, headers: Record<string, string> = {}) {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValueOnce(new Response(body, { status, headers }));
  return fetchMock;
}

function respondJson(body: unknown, status: number, headers: Record<string, string> = {}) {
  return respond(JSON.stringify(body), status, { 'Content-Type': 'application/json', ...headers });
}

function sentHeaders(index = 0) {
  return new Headers(vi.mocked(fetch).mock.calls[index][1]?.headers);
}

function controlledLocation() {
  const location = { href: 'http://localhost/area-protegida' };
  vi.stubGlobal('window', new Proxy(window, {
    get(target, property) {
      return property === 'location' ? location : Reflect.get(target, property, target);
    },
  }));
  return location;
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('esperava rejeição');
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);
  vi.stubEnv('NEXT_PUBLIC_API_ENV', undefined);
});

describe('BEAPI-01 origem configurável do cliente HTTP', () => {
  it.each([
    'https://api-a.example.test',
    'http://localhost:4010',
  ])('BEAPI-01 usa a origem configurada %s em fetch, buildApiUrl e API_URL', async (origin) => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', origin);
    const api = await loadApi();
    const fetchMock = respondJson({ ok: 1 }, 200);
    await api.apiRequest('/dose/me', { requireAuth: false });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${origin}/dose/me`, expect.any(Object));
    expect(api.getApiBaseUrl()).toBe(origin);
    expect(api.buildApiUrl('usuario/me')).toBe(`${origin}/usuario/me`);
    expect(api.API_URL).toBe(origin);
  });

  it('BEAPI-01 duas origens diferentes no mesmo processo não vazam entre si', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api-a.example.test');
    const apiA = await loadApi();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api-b.example.test');
    const apiB = await loadApi();
    expect(apiA.API_URL).toBe('https://api-a.example.test');
    expect(apiB.API_URL).toBe('https://api-b.example.test');
    expect(apiB.buildApiUrl('/x')).toBe('https://api-b.example.test/x');
  });

  it.each([
    ['https://api.example.test', 'dose/me'],
    ['https://api.example.test', '/dose/me'],
    ['https://api.example.test/', 'dose/me'],
    ['https://api.example.test/', '/dose/me'],
    ['https://api.example.test///', '//dose/me'],
    ['  https://api.example.test/  ', '/dose/me'],
  ])('BEAPI-01 normaliza barras: origem %j + endpoint %j -> uma barra', async (origin, endpoint) => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', origin);
    const api = await loadApi();
    expect(api.buildApiUrl(endpoint)).toBe('https://api.example.test/dose/me');
  });

  it('BEAPI-01 preserva query string e prefixo de caminho da origem', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://gateway.example.test/medreminder/');
    const api = await loadApi();
    expect(api.buildApiUrl('/dose/me?page=2&limit=20'))
      .toBe('https://gateway.example.test/medreminder/dose/me?page=2&limit=20');
  });

  it('BEAPI-01 NODE_ENV=test sem variável usa marcador inválido, nunca produção', async () => {
    const api = await loadApi();
    expect(api.getApiBaseUrl()).toBe(api.TEST_PLACEHOLDER_API_URL);
    expect(api.getApiBaseUrl()).not.toContain('onrender.com');
    expect(new URL(api.getApiBaseUrl()).hostname.endsWith('.invalid')).toBe(true);
  });

  it('BEAPI-01 ambiente isolado sem NEXT_PUBLIC_API_URL falha em vez de usar produção', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_ENV', 'isolated');
    vi.stubEnv('NODE_ENV', 'production');
    const api = await loadApi();
    expect(api.API_URL).toBe('');
    expect(() => api.getApiBaseUrl()).toThrow(api.ApiConfigError);
    await expect(api.apiRequest('/dose/me', { requireAuth: false })).rejects.toThrow(api.ApiConfigError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('BEAPI-01 build de produção sem variável mantém o fallback legado explícito', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const api = await loadApi();
    expect(api.getApiBaseUrl()).toBe(api.PRODUCTION_API_URL);
    expect(api.PRODUCTION_API_URL).toBe('https://medreminder-backend.onrender.com');
  });

  it.each(['localhost:3000', '/relativa', 'ftp://api.example.test', 'não é url'])(
    'BEAPI-01 rejeita NEXT_PUBLIC_API_URL inválida %j sem cair em fallback',
    async (value) => {
      vi.stubEnv('NEXT_PUBLIC_API_URL', value);
      vi.stubEnv('NODE_ENV', 'production');
      const api = await loadApi();
      expect(() => api.getApiBaseUrl()).toThrow(api.ApiConfigError);
      expect(() => api.buildApiUrl('/x')).toThrow(api.ApiConfigError);
    },
  );

  it('BEAPI-01 variável em branco equivale a não definida (sem produção em ambiente isolado)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '   ');
    vi.stubEnv('NEXT_PUBLIC_API_ENV', 'isolated');
    const api = await loadApi();
    expect(() => api.getApiBaseUrl()).toThrow(api.ApiConfigError);
  });
});

describe('BEAPI-01 headers, signal e corpo preservados', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test');
  });

  it('BEAPI-01 preserva headers do chamador (Idempotency-Key) e acrescenta Bearer e Content-Type', async () => {
    const { apiRequest } = await loadApi();
    window.localStorage.setItem('access_token', 'token-sintetico');
    const fetchMock = respondJson({ message: 'ok', success: true }, 201);
    await apiRequest('/tratamento', {
      method: 'POST',
      body: '{"doses":[]}',
      headers: { 'Idempotency-Key': 'sintetico:tratamento-001', 'X-Fixture': 'sintetica' },
    });
    const headers = sentHeaders();
    expect(headers.get('Idempotency-Key')).toBe('sintetico:tratamento-001');
    expect(headers.get('X-Fixture')).toBe('sintetica');
    expect(headers.get('Authorization')).toBe('Bearer token-sintetico');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"doses":[]}' });
  });

  it('BEAPI-01 preserva headers fornecidos como Headers e como array de pares', async () => {
    const { apiRequest } = await loadApi();
    respondJson({}, 200);
    await apiRequest('/x', { requireAuth: false, headers: new Headers({ 'X-A': '1' }) });
    respondJson({}, 200);
    await apiRequest('/x', { requireAuth: false, headers: [['X-B', '2']] });
    expect(sentHeaders(0).get('X-A')).toBe('1');
    expect(sentHeaders(1).get('X-B')).toBe('2');
  });

  it('BEAPI-01 repassa a mesma RequestInit.signal ao fetch', async () => {
    const { apiRequest } = await loadApi();
    const controller = new AbortController();
    const fetchMock = respondJson({}, 200);
    await apiRequest('/dose/me', { requireAuth: false, signal: controller.signal });
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it('BEAPI-01 abort do chamador propaga o erro original do fetch (não vira ApiError)', async () => {
    const { apiRequest, ApiError } = await loadApi();
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.mocked(fetch).mockRejectedValueOnce(abortError);
    const error = await catchError(apiRequest('/dose/me', { requireAuth: false, signal: controller.signal }));
    expect(error).toBe(abortError);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('BEAPI-01 FormData: não força Content-Type e repassa o mesmo corpo', async () => {
    const { apiRequest } = await loadApi();
    const form = new FormData();
    form.append('foto', new Blob(['x'], { type: 'image/png' }), 'foto.png');
    const fetchMock = respondJson({}, 200);
    await apiRequest('/usuario/foto', { requireAuth: false, method: 'POST', body: form });
    expect(sentHeaders().has('Content-Type')).toBe(false);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(form);
  });

  it('BEAPI-01 Content-Type explícito do chamador não é sobrescrito', async () => {
    const { apiRequest } = await loadApi();
    respondJson({}, 200);
    await apiRequest('/x', { requireAuth: false, method: 'PATCH', headers: { 'content-type': 'text/plain' } });
    expect(sentHeaders().get('Content-Type')).toBe('text/plain');
  });
});

describe('BEAPI-02 erro HTTP estruturado', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test');
  });

  it('BEAPI-02 400 com message em array preserva messages, code e status', async () => {
    const { apiRequest, ApiError } = await loadApi();
    respondJson({ ...arrayErrorFixture, error: 'Bad Request' }, 400);
    const error = await catchError(apiRequest('/tratamento', { requireAuth: false, method: 'POST' }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    const apiError = error as ApiErrorInstance;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('SYNTHETIC_VALIDATION_ERROR');
    expect(apiError.messages).toEqual(arrayErrorFixture.message);
    // O genérico error:'Bad Request' não prevalece sobre as mensagens de validação.
    expect(apiError.message).toBe((arrayErrorFixture.message as string[]).join(', '));
    expect(apiError.name).toBe('ApiError');
    expect(apiError.retryAfter).toBeUndefined();
  });

  it('BEAPI-02 message em string vira messages de um item e mantém code', async () => {
    const { apiRequest } = await loadApi();
    respondJson(stringErrorFixture, 401);
    const error = (await catchError(apiRequest('/usuario/senha', { requireAuth: false }))) as ApiErrorInstance;
    expect(error.status).toBe(401);
    expect(error.code).toBe('SYNTHETIC_PASSWORD_ERROR');
    expect(error.messages).toEqual(['Senha atual incorreta']);
    expect(error.message).toBe('Senha atual incorreta');
  });

  it('BEAPI-02 não extrai status de dentro da mensagem e ignora code não-string', async () => {
    const { apiRequest } = await loadApi();
    respondJson({ message: 'Erro 401 simulado', code: 4242, statusCode: 418 }, 400);
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error.status).toBe(400);
    expect(error.code).toBeUndefined();
    expect(error.messages).toEqual(['Erro 401 simulado']);
  });

  it('BEAPI-02 401 com corpo ilegível ainda invalida a sessão e devolve ApiError', async () => {
    const { apiRequest, ApiError } = await loadApi();
    const location = controlledLocation();
    window.localStorage.setItem('access_token', 'token-sintetico');
    window.localStorage.setItem('user_data', '{"nome":"Ana Teste"}');
    respond('{json quebrado', 401, { 'Content-Type': 'application/json' });
    const error = (await catchError(apiRequest('/usuario/me'))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Não autorizado');
    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(window.localStorage.getItem('user_data')).toBeNull();
    expect(location.href).toBe('/login');
  });

  it("BEAPI-02 401 com onUnauthorized:'throw' preserva sessão e navegação, mas mantém o erro", async () => {
    const { apiRequest, ApiError } = await loadApi();
    const location = controlledLocation();
    window.localStorage.setItem('access_token', 'token-sintetico');
    window.localStorage.setItem('user_data', '{"nome":"Ana Teste"}');
    respondJson(stringErrorFixture, 401);
    const error = (await catchError(apiRequest('/usuario/senha', {
      method: 'PATCH', body: '{}', onUnauthorized: 'throw',
    }))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.messages).toEqual(['Senha atual incorreta']);
    expect(sentHeaders().get('Authorization')).toBe('Bearer token-sintetico');
    expect(window.localStorage.getItem('access_token')).toBe('token-sintetico');
    expect(window.localStorage.getItem('user_data')).toBe('{"nome":"Ana Teste"}');
    expect(location.href).toBe('http://localhost/area-protegida');
  });

  it("BEAPI-02 onUnauthorized:'invalidate' explícito equivale ao padrão", async () => {
    const { apiRequest } = await loadApi();
    const location = controlledLocation();
    window.localStorage.setItem('access_token', 'token-sintetico');
    respondJson({}, 401);
    await expect(apiRequest('/usuario/me', { onUnauthorized: 'invalidate' })).rejects.toThrow('Não autorizado');
    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(location.href).toBe('/login');
  });

  it('BEAPI-02 429 com Retry-After em segundos', async () => {
    const { apiRequest } = await loadApi();
    respondJson({ message: 'Muitas tentativas', code: 'SYNTHETIC_RATE_LIMIT', statusCode: 429 }, 429, { 'Retry-After': '30' });
    const error = (await catchError(apiRequest('/auth/login', { requireAuth: false }))) as ApiErrorInstance;
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.code).toBe('SYNTHETIC_RATE_LIMIT');
    expect(error.messages).toEqual(['Muitas tentativas']);
  });

  it('BEAPI-02 429 com Retry-After em HTTP-date vira segundos a partir de agora', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00'));
    const { apiRequest } = await loadApi();
    respond('', 429, { 'Retry-After': 'Wed, 04 Nov 2026 15:01:30 GMT' });
    const error = (await catchError(apiRequest('/auth/login', { requireAuth: false }))) as ApiErrorInstance;
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(90);
  });

  it('BEAPI-02 Retry-After HTTP-date no passado resulta em 0', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00'));
    const { apiRequest, ApiError } = await loadApi();
    respond('', 429, { 'Retry-After': 'Wed, 04 Nov 2026 14:00:00 GMT' });
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.retryAfter).toBe(0);
  });

  it.each(['abc', '-5', '1.5', ''])('BEAPI-02 Retry-After inválido %j fica indefinido', async (value) => {
    const { apiRequest, ApiError } = await loadApi();
    respond('', 429, { 'Retry-After': value });
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBeUndefined();
  });

  it('BEAPI-02 503 com Retry-After preserva status e usa mensagem padrão', async () => {
    const { apiRequest } = await loadApi();
    respondJson({ message: 'Banco ocupado', code: 'SYNTHETIC_BUSY', statusCode: 503 }, 503, { 'Retry-After': '2' });
    const error = (await catchError(apiRequest('/tratamento', { requireAuth: false, method: 'POST' }))) as ApiErrorInstance;
    expect(error.status).toBe(503);
    expect(error.retryAfter).toBe(2);
    expect(error.code).toBe('SYNTHETIC_BUSY');
    expect(error.messages).toEqual(['Banco ocupado']);
  });

  it('BEAPI-02 503 sem corpo usa a mensagem padrão do status e messages vazio', async () => {
    const { apiRequest, ApiError } = await loadApi();
    respond(null, 503);
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(503);
    expect(error.message).toBe('API request failed with status 503');
    expect(error.messages).toEqual([]);
    expect(error.code).toBeUndefined();
  });

  it.each([
    ['corpo vazio', '', {}],
    ['texto puro', 'Bad Gateway', { 'Content-Type': 'text/plain' }],
    ['JSON inválido', '{"message": ', { 'Content-Type': 'application/json' }],
    ['HTML', '<html>erro</html>', { 'Content-Type': 'text/html' }],
    ['JSON não-objeto', '"texto"', { 'Content-Type': 'application/json' }],
    ['JSON null', 'null', { 'Content-Type': 'application/json' }],
  ])('BEAPI-02 502 com %s ainda gera ApiError com status e Retry-After', async (_label, body, headers) => {
    const { apiRequest, ApiError } = await loadApi();
    respond(body, 502, { ...headers, 'Retry-After': '7' });
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.retryAfter).toBe(7);
    expect(error.messages).toEqual([]);
    expect(error.message).toBe('API request failed with status 502');
  });

  it('BEAPI-02 body bruto fica acessível mas não enumerável nem serializável; console só recebe status', async () => {
    const { apiRequest, ApiError } = await loadApi();
    respondJson({ message: 'segredo-sintetico-123', extra: 'cpf-98765432109' }, 400);
    const error = (await catchError(apiRequest('/x', { requireAuth: false }))) as ApiErrorInstance;
    expect(error.body).toEqual({ message: 'segredo-sintetico-123', extra: 'cpf-98765432109' });
    expect(Object.keys(error)).not.toContain('body');
    expect(JSON.stringify(error)).not.toContain('cpf-98765432109');
    expect(JSON.stringify({ ...error })).not.toContain('cpf-98765432109');
    expect(console.error).toHaveBeenCalledExactlyOnceWith('API Error:', { status: 400 });
    expect(error).toBeInstanceOf(ApiError);
  });
});

afterEach(() => {
  vi.resetModules();
});


describe('BEAPI-03 invalida??o da identidade em mem?ria', () => {
  it('BEAPI-03 401 autenticado notifica providers da sessão corrente', async () => {
    const api = await loadApi(); controlledLocation();
    localStorage.setItem('access_token', 'token-a');
    const notified = vi.fn(); window.addEventListener(api.SESSION_INVALIDATED_EVENT, notified);
    respondJson({}, 401);
    await expect(api.apiRequest('usuario/me')).rejects.toMatchObject({ status: 401 });
    expect(notified).toHaveBeenCalledTimes(1);
    window.removeEventListener(api.SESSION_INVALIDATED_EVENT, notified);
  });
  it('BEAPI-03 401 atrasado de A preserva token B e não invalida nem redireciona', async () => {
    const api = await loadApi(); const location = controlledLocation();
    localStorage.setItem('access_token', 'token-a');
    let resolve!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(r => { resolve = r; }));
    const request = api.apiRequest('usuario/me');
    localStorage.setItem('access_token', 'token-b');
    resolve(new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } }));
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem('access_token')).toBe('token-b');
    expect(location.href).toBe('http://localhost/area-protegida');
  });
});
