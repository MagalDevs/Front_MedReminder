/**
 * Origem de produção legada. Só é usada como fallback explícito (ver `getApiBaseUrl`);
 * nunca em testes nem em ambientes marcados como isolados.
 */
export const PRODUCTION_API_URL = "https://medreminder-backend.onrender.com";
export const DEVELOPMENT_API_URL = "http://localhost:3001";

/**
 * Origem de marcador usada SOMENTE quando `NODE_ENV === 'test'` e `NEXT_PUBLIC_API_URL`
 * não está definida. O TLD `.invalid` (RFC 2606) nunca resolve, então um teste que
 * esqueça de simular o `fetch` falha em vez de alcançar produção.
 */
export const TEST_PLACEHOLDER_API_URL = "http://api.test.invalid";

/** Falha de configuração da origem da API (variável ausente ou inválida). */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigError";
  }
}

function isValidHttpOrigin(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
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
        "NEXT_PUBLIC_API_URL deve ser uma URL absoluta http(s), por exemplo http://localhost:3001.",
      );
    }
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NEXT_PUBLIC_API_ENV === "isolated") {
    return new ApiConfigError(
      "NEXT_PUBLIC_API_URL é obrigatória quando NEXT_PUBLIC_API_ENV=isolated: não há fallback para a API de produção.",
    );
  }
  if (process.env.NODE_ENV === "test") {
    return TEST_PLACEHOLDER_API_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return DEVELOPMENT_API_URL;
  }
  return PRODUCTION_API_URL;
}

/**
 * Origem efetiva da API, sem barra final.
 *
 * Ordem: (1) `NEXT_PUBLIC_API_URL` (valor incorporado no build; barra final removida);
 * (2) se `NEXT_PUBLIC_API_ENV === 'isolated'`, lança `ApiConfigError` (sem fallback);
 * (3) se `NODE_ENV === 'test'`, `TEST_PLACEHOLDER_API_URL`;
 * (4) em desenvolvimento, `DEVELOPMENT_API_URL` (localhost:3001); (5) nos demais casos,
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
  return `${getApiBaseUrl()}/${endpoint.replace(/^\/+/, "")}`;
}

const initialOrigin = resolveApiBaseUrl();

/**
 * @deprecated Calculada uma vez na importação; use `getApiBaseUrl()`/`buildApiUrl()`.
 * Vazia quando a origem é inválida/ausente em ambiente isolado.
 */
export const API_URL: string =
  typeof initialOrigin === "string" ? initialOrigin : "";
