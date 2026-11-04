'use client';

/**
 * Cliente HTTP único do frontend para o backend MedReminder.
 *
 * API pública (reutilizada por cadastro, AuthContext, lembretes, configurações,
 * tratamento e histórico):
 *
 * - `apiRequest<T>(endpoint, options?)` -> `Promise<T>`: faz a chamada, devolve o corpo
 *   já interpretado (JSON ou texto) em sucesso e lança `ApiError` em qualquer resposta
 *   HTTP de falha. Não desembrulha envelopes (`{ message, data }`): cada chamador
 *   decide. Não faz retry automático.
 * - `getApiBaseUrl()` / `buildApiUrl(endpoint)`: origem e URL efetivas (use no lugar de
 *   URLs fixas).
 * - `ApiError`: erro estruturado com `status`, `code?`, `messages`, `retryAfter?`, `body?`.
 * - `ApiConfigError`: origem ausente/ inválida em ambiente isolado.
 *
 * Opções de `apiRequest` (além de `RequestInit`, que é repassado sem alteração —
 * inclusive `signal`, `cache`, `method`, `body` e `headers`):
 *
 * - `requireAuth` (padrão `true`): anexa `Authorization: Bearer <access_token>`; sem
 *   token rejeita antes de chamar `fetch`. Use `false` para rotas públicas (login,
 *   cadastro).
 * - `onUnauthorized` (padrão `'invalidate'`): o que fazer num HTTP 401 de chamada
 *   autenticada.
 *   - `'invalidate'`: remove `access_token`/`user_data` do localStorage e navega para
 *     `/login` (sessão expirada/inválida) e depois lança `ApiError`.
 *   - `'throw'`: só lança `ApiError`, preservando a sessão. Uso previsto: operações em
 *     que 401 significa falha operacional, p.ex. PATCH `/usuario/senha` com senha atual
 *     incorreta (o design chama isso de `invalidateSessionOn401=false`). O chamador deve
 *     revalidar a sessão (GET `/usuario/me`, uma vez). Em chamadas com
 *     `requireAuth:false` o 401 nunca invalida a sessão, independentemente desta opção.
 *
 * Headers: os do chamador são preservados (ex.: `Idempotency-Key`). `Content-Type:
 * application/json` só é acrescentado em POST/PUT/PATCH quando o chamador não definiu
 * um e o corpo não é `FormData` (o navegador precisa definir o boundary multipart).
 *
 * Sem corpo de resposta em logs: o único diagnóstico é `console.error('API Error:',
 * { status })` (SEC-02). `ApiError.body` guarda o corpo bruto para uso programático,
 * mas é não enumerável (não aparece em `JSON.stringify`, spread ou inspeção) e NUNCA deve
 * ser registrado.
 */

/**
 * Origem de produção legada. Só é usada como fallback explícito (ver `getApiBaseUrl`);
 * nunca em testes nem em ambientes marcados como isolados.
 */
export const SESSION_INVALIDATED_EVENT = 'medreminder:session-invalidated';

export const PRODUCTION_API_URL = 'https://medreminder-backend.onrender.com';

/**
 * Origem de marcador usada SOMENTE quando `NODE_ENV === 'test'` e `NEXT_PUBLIC_API_URL`
 * não está definida. O TLD `.invalid` (RFC 2606) nunca resolve, então um teste que
 * esqueça de simular o `fetch` falha em vez de alcançar produção.
 */
export const TEST_PLACEHOLDER_API_URL = 'http://api.test.invalid';

/** Falha de configuração da origem da API (variável ausente ou inválida). */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigError';
  }
}

function isValidHttpOrigin(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolve a origem sem lançar. Cada leitura de `process.env.NEXT_PUBLIC_*` precisa
 * ser literal para o Next substituir o valor no build (lookups dinâmicos não são
 * inlined).
 */
function resolveApiBaseUrl(): string | ApiConfigError {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configured) {
    if (!isValidHttpOrigin(configured)) {
      return new ApiConfigError(
        'NEXT_PUBLIC_API_URL deve ser uma URL absoluta http(s), por exemplo http://localhost:3000.',
      );
    }
    return configured.replace(/\/+$/, '');
  }

  if (process.env.NEXT_PUBLIC_API_ENV === 'isolated') {
    return new ApiConfigError(
      'NEXT_PUBLIC_API_URL é obrigatória quando NEXT_PUBLIC_API_ENV=isolated: não há fallback para a API de produção.',
    );
  }
  if (process.env.NODE_ENV === 'test') {
    return TEST_PLACEHOLDER_API_URL;
  }
  return PRODUCTION_API_URL;
}

/**
 * Origem efetiva da API, sem barra final.
 *
 * Ordem: (1) `NEXT_PUBLIC_API_URL` (valor incorporado no build; barra final removida);
 * (2) se `NEXT_PUBLIC_API_ENV === 'isolated'`, lança `ApiConfigError` (sem fallback);
 * (3) se `NODE_ENV === 'test'`, `TEST_PLACEHOLDER_API_URL`; (4) nos demais casos,
 * `PRODUCTION_API_URL` (compatibilidade de deploy existente). Variável definida mas
 * inválida sempre lança. Lido a cada chamada.
 *
 * @throws ApiConfigError
 */
export function getApiBaseUrl(): string {
  const resolved = resolveApiBaseUrl();
  if (resolved instanceof ApiConfigError) throw resolved;
  return resolved;
}

/**
 * Monta a URL absoluta de um endpoint: exatamente uma barra entre origem e caminho,
 * com ou sem barra inicial no endpoint e com ou sem barra final na origem.
 * Query string é preservada. Ex.: `buildApiUrl('dose/me')` e `buildApiUrl('/dose/me')`
 * -> `<origem>/dose/me`.
 *
 * @throws ApiConfigError
 */
export function buildApiUrl(endpoint: string): string {
  return `${getApiBaseUrl()}/${endpoint.replace(/^\/+/, '')}`;
}

const initialOrigin = resolveApiBaseUrl();

/**
 * @deprecated Calculada uma vez na importação; use `getApiBaseUrl()`/`buildApiUrl()`.
 * Vazia quando a origem é inválida/ausente em ambiente isolado.
 */
export const API_URL: string = typeof initialOrigin === 'string' ? initialOrigin : '';

/** Política para HTTP 401 em chamadas autenticadas. Ver o cabeçalho do módulo. */
export type UnauthorizedPolicy = 'invalidate' | 'throw';

export interface ApiRequestOptions extends RequestInit {
  /** Anexa o Bearer e exige token armazenado. Padrão `true`. */
  requireAuth?: boolean;
  /** Comportamento em HTTP 401 autenticado. Padrão `'invalidate'`. */
  onUnauthorized?: UnauthorizedPolicy;
}

export interface ApiErrorInit {
  status: number;
  message: string;
  code?: string;
  messages?: string[];
  retryAfter?: number;
  body?: unknown;
}

/**
 * Erro de resposta HTTP de falha do backend. Construído mesmo quando o corpo não pôde
 * ser interpretado (JSON inválido, texto, vazio).
 *
 * - `message`: texto amigável para exibição (mensagem do backend, as mensagens de
 *   validação unidas por ", " ou, sem corpo útil, um texto padrão do status).
 * - `status`: status HTTP real. Use-o em vez de procurar números dentro de `message`.
 * - `code`: campo `code` do corpo, quando for string.
 * - `messages`: mensagens fornecidas pelo backend (string única ou array de
 *   validação), preservadas individualmente; `[]` quando o corpo não trouxe nenhuma.
 * - `retryAfter`: segundos de espera do header `Retry-After` (inteiro ou HTTP-date
 *   convertido em segundos a partir de agora, mínimo 0); `undefined` se ausente/ inválido.
 * - `body`: corpo bruto (não enumerável; não registrar em log).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly messages: string[];
  readonly retryAfter?: number;
  declare readonly body?: unknown;

  constructor({ status, message, code, messages = [], retryAfter, body }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.messages = messages;
    this.retryAfter = retryAfter;
    Object.defineProperty(this, 'body', { value: body, enumerable: false, writable: false });
  }
}

/** Lê `Retry-After` (segundos inteiros ou HTTP-date) e devolve segundos, ou undefined. */
function parseRetryAfter(value: string | null | undefined): number | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  if (/^\d+$/.test(text)) return Number(text);
  // HTTP-date tem nome de dia/mês; evita que Date.parse aceite números soltos ("1.5").
  if (!/[A-Za-z]{3}/.test(text)) return undefined;
  const date = Date.parse(text);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function nonEmptyStrings(values: unknown[]): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v !== '');
}

/** Extrai as mensagens do backend: message (string|string[]) > error (string) > errors[]. */
function extractMessages(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return [];
  const body = data as Record<string, unknown>;

  if (typeof body.message === 'string' && body.message !== '') return [body.message];
  if (Array.isArray(body.message)) {
    const list = nonEmptyStrings(body.message);
    if (list.length > 0) return list;
  }
  if (typeof body.error === 'string' && body.error !== '') return [body.error];
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.map((e: unknown) =>
      typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
        ? e.message
        : String(e),
    );
  }
  return [];
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Requisição inválida';
    case 401:
      return 'Não autorizado';
    case 403:
      return 'Acesso negado';
    case 404:
      return 'Recurso não encontrado';
    case 429:
      return 'Muitas requisições. Tente novamente mais tarde';
    case 500:
      return 'Erro interno do servidor';
    default:
      return `API request failed with status ${status}`;
  }
}

function buildApiError(response: Response, data: unknown): ApiError {
  const messages = extractMessages(data);
  const code =
    typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
      ? data.code
      : undefined;
  return new ApiError({
    status: response.status,
    message: messages.length > 0 ? messages.join(', ') : fallbackMessage(response.status),
    code,
    messages,
    retryAfter: parseRetryAfter(response.headers.get('retry-after')),
    body: data,
  });
}

/**
 * Faz uma requisição ao backend.
 *
 * @param endpoint - Caminho do endpoint (com ou sem barra inicial); a origem vem de `getApiBaseUrl()`.
 * @param options - `RequestInit` + `requireAuth` + `onUnauthorized`.
 * @returns O corpo da resposta de sucesso (JSON ou texto), sem desembrulhar envelopes.
 * @throws ApiError em qualquer resposta HTTP de falha; ApiConfigError se a origem for inválida;
 *   `Error('Authentication required but no token found')` sem token; erros de rede/abort do
 *   `fetch` são repassados sem alteração.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { requireAuth = true, onUnauthorized = 'invalidate', ...fetchOptions } = options;

  const url = buildApiUrl(endpoint);

  // Headers do chamador são copiados e preservados.
  const headers = new Headers(fetchOptions.headers);

  // Content-Type padrão ao enviar dados, exceto FormData (o navegador define o boundary).
  const method = fetchOptions.method?.toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestToken = requireAuth ? localStorage.getItem('access_token') : null;

  // Add auth token if required and available
  if (requireAuth) {
    const token = requestToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      throw new Error('Authentication required but no token found');
    }
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  // Interpreta o corpo. Em falha HTTP, um corpo ilegível nunca impede o ApiError.
  let data: unknown;
  let parseError: unknown;
  let parseFailed = false;
  try {
    const contentType = response.headers.get('content-type');
    data = contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch (error) {
    parseFailed = true;
    parseError = error;
  }

  if (!response.ok) {
    // Token inválido/expirado: limpa a sessão (a menos que o chamador peça o contrário).
    if (response.status === 401 && requireAuth && onUnauthorized === 'invalidate' &&
        localStorage.getItem('access_token') === requestToken) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT));
      window.location.href = '/login';
    }

    // Keep diagnostics independent of arbitrary response content.
    console.error('API Error:', { status: response.status });

    throw buildApiError(response, parseFailed ? undefined : data);
  }

  // Sucesso com corpo ilegível: mantém o comportamento anterior (propaga o erro de parsing).
  if (parseFailed) throw parseError;

  // Even if response is OK, check if there's an error message in the response
  // Some APIs return error messages with 200 status codes
  if (typeof data === 'object' && data !== null &&
      'message' in data && typeof data.message === 'string' &&
      !('access_token' in data) &&
      !('success' in data && data.success === true)) {
    console.warn('Server returned message in successful response');

    // Check for specific error indicators despite 200 status
    if ('error' in data ||
        ('status' in data && data.status === 'error') ||
        ('success' in data && data.success === false)) {
      throw new Error(typeof data.message === 'string' ? data.message : 'API request failed');
    }
  }
  return data as T;
}
