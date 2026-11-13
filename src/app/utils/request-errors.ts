import { ApiConfigError, ApiError } from './api';

export type RequestErrorContext = 'operation' | 'registration' | 'login' | 'session';

export class RequestContractError extends Error {
  constructor() { super('Resposta fora do contrato'); this.name = 'RequestContractError'; }
}

export class RequestTimeoutError extends Error {
  constructor() { super('Tempo de espera encerrado'); this.name = 'RequestTimeoutError'; }
}

export class IntentionalRequestAbortError extends Error {
  constructor() { super('Requisição cancelada'); this.name = 'IntentionalRequestAbortError'; }
}

const fallback = 'Não foi possível concluir a operação. Tente novamente.';
const validation = 'Dados inválidos. Verifique os campos e tente novamente.';
const conflict = 'Não foi possível concluir a operação porque os dados foram alterados ou já existem. Verifique e tente novamente.';

// Only public validation/domain messages are eligible for display. Diagnostics
// remain inaccessible even when a backend puts them in a message field.
function publicMessages(messages: string[]): string[] {
  const publicField = /^(?:Nome|Data de nascimento|CPF|CEP|E-?mail|Email|Senha|A senha|Nova senha|Campo|Dados|Validade|Lote|Quantidade|Dose|Remédio|Medicamento|Tratamento|Identidade Firebase|O vínculo|Esta conta|Já existe|Usuário|Usuaria|Usuária)\b/iu;
  const diagnostic = /(?:[a-z][a-z0-9+.-]*:\/\/|file:|SQLITE_|SQLSTATE|\b(?:SELECT|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|PRAGMA|ATTACH)\s|\bDELETE\s+FROM|\bUPDATE\s.+\bSET\b|\bBearer\s|\btoken\s*[:=]|\beyJ[\w-]+\.[\w-]+\.[\w-]+\b|node_modules|\.[jt]sx?:\d|<[^>]*>|[{}\r\n]|\bError:)/iu;
  return messages.filter(message => message.length <= 280 && publicField.test(message) && !diagnostic.test(message));
}

export function requestErrorMessages(error: unknown, context: RequestErrorContext = 'operation'): string[] {
  if (error instanceof IntentionalRequestAbortError) return [];
  if (error instanceof RequestTimeoutError || ((error instanceof Error || error instanceof DOMException) && error.name === 'TimeoutError')) {
    return [context === 'registration'
      ? 'O servidor demorou para responder e não foi possível confirmar o cadastro. Tente entrar com seu e-mail e senha antes de cadastrar novamente.'
      : 'O serviço demorou para responder. Tente novamente.'];
  }
  if (error instanceof ApiConfigError) return ['Não foi possível iniciar a operação. Verifique a configuração do serviço.'];
  if (error instanceof RequestContractError || error instanceof SyntaxError) return ['Não foi possível interpretar a resposta do serviço. Tente novamente.'];
  if (error instanceof ApiError) {
    const messages = publicMessages(error.messages);
    if (error.status === 400 || error.status === 422) return messages.length ? messages : [context === 'registration' ? 'Erro ao cadastrar. Tente novamente.' : validation];
    if (error.status === 401) {
      if (context === 'login') return ['E-mail ou senha inválidos'];
      if (context === 'session') return ['Sessão expirada. Entre novamente.'];
      return messages.length ? messages : [fallback];
    }
    if (error.status === 403) return ['Você não tem permissão para realizar esta ação.'];
    if (error.status === 404) return ['Não foi possível encontrar o recurso solicitado.'];
    if (error.status === 409) return messages.length ? messages : [conflict];
    if (error.status === 429) {
      const seconds = error.retryAfter;
      const valid = seconds !== undefined && Number.isFinite(seconds) && seconds >= 0;
      if (context === 'registration') return [valid ? `Muitas tentativas de cadastro. Tente novamente em ${seconds} segundos.` : 'Muitas tentativas de cadastro. Tente novamente mais tarde.'];
      return [`Muitas tentativas. Tente novamente mais tarde.${valid ? ` Aguarde ${seconds} segundos.` : ''}`];
    }
    if (error.status >= 500) return [context === 'registration' ? 'Erro ao conectar com o servidor. Tente novamente mais tarde.' : 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'];
  }
  if (error instanceof TypeError) return [context === 'registration' ? 'Erro ao conectar com o servidor. Tente novamente mais tarde.' : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'];
  return [context === 'registration' ? 'Erro ao conectar com o servidor. Tente novamente mais tarde.' : fallback];
}

export function requestErrorMessage(error: unknown, context: RequestErrorContext = 'operation'): string | null {
  const messages = requestErrorMessages(error, context);
  return messages.length ? messages.join(' ') : null;
}
