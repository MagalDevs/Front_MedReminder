import { describe, expect, it } from 'vitest';
import { ApiError } from '@/app/utils/api';
import { IntentionalRequestAbortError, RequestContractError, RequestTimeoutError, requestErrorMessage, requestErrorMessages } from '@/app/utils/request-errors';

function http(status: number, messages: string[] = [], retryAfter?: number) {
  return new ApiError({ status, message: messages.join(', '), messages, retryAfter });
}

describe('Mensagens públicas de requisição', () => {
  it.each([400, 422])('ERR-02 validação pública %i preserva cada mensagem', (status) => {
    expect(requestErrorMessages(http(status, ['CPF inválido', 'CEP deve conter oito dígitos'])))
      .toEqual(['CPF inválido', 'CEP deve conter oito dígitos']);
  });
  it.each([400, 422])('ERR-02 validação %i sem mensagem usa fallback exato', (status) => {
    expect(requestErrorMessage(http(status))).toBe('Dados inválidos. Verifique os campos e tente novamente.');
  });
  it('ERR-06 permissão negada', () => {
    expect(requestErrorMessage(http(403))).toBe('Você não tem permissão para realizar esta ação.');
  });
  it('ERR-07 recurso não encontrado', () => {
    expect(requestErrorMessage(http(404))).toBe('Não foi possível encontrar o recurso solicitado.');
  });
  it('ERR-08 conflito público', () => {
    expect(requestErrorMessage(http(409, ['E-mail já está em uso']))).toBe('E-mail já está em uso');
  });
  it('ERR-08 conflito sem mensagem usa fallback', () => {
    expect(requestErrorMessage(http(409))).toBe('Não foi possível concluir a operação porque os dados foram alterados ou já existem. Verifique e tente novamente.');
  });
  it.each([0, 42])('ERR-09 Retry-After válido inclusive zero: %i', (seconds) => {
    expect(requestErrorMessage(http(429, [], seconds))).toBe(`Muitas tentativas. Tente novamente mais tarde. Aguarde ${seconds} segundos.`);
  });
  it('ERR-09 sem Retry-After não inventa duração', () => {
    expect(requestErrorMessage(http(429))).toBe('Muitas tentativas. Tente novamente mais tarde.');
  });
  it.each([500, 502, 503])('ERR-10 servidor indisponível %i', (status) => {
    expect(requestErrorMessage(http(status, ['SQLITE_ERROR: segredo']))).toBe('O serviço está temporariamente indisponível. Tente novamente mais tarde.');
  });
  it('ERR-11 falha de conexão não reflete TypeError técnico', () => {
    expect(requestErrorMessage(new TypeError('Failed to fetch https://internal/secret'))).toBe('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  });
  it.each([new RequestContractError(), new SyntaxError('JSON secreto')])('ERR-12 resposta fora do contrato', (error) => {
    expect(requestErrorMessage(error)).toBe('Não foi possível interpretar a resposta do serviço. Tente novamente.');
  });
  it.each([new RequestTimeoutError(), new DOMException('Timeout técnico', 'TimeoutError')])('ERR-13 timeout de outra operação', (error) => {
    expect(requestErrorMessage(error)).toBe('O serviço demorou para responder. Tente novamente.');
  });
  it.each([new Error('status 401 inválido'), null, {}])('ERR-16 erro desconhecido usa fallback', (error) => {
    expect(requestErrorMessage(error)).toBe('Não foi possível concluir a operação. Tente novamente.');
  });
  it.each(['CPF SQLITE_ERROR: SELECT senha FROM usuario', 'Campo inválido https://interno/token', 'Senha inválida <script>secret</script>', 'Campo inválido\n at source.ts:4', 'Dados inválidos Bearer abc', 'Campo inválido: DROP TABLE usuario', 'Dados inválidos ALTER TABLE usuario', 'Campo inválido eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature'])('ERR-17 diagnóstico técnico não é exibido: %s', (message) => {
    expect(requestErrorMessage(http(400, [message]))).toBe('Dados inválidos. Verifique os campos e tente novamente.');
  });
  it.each([400, 422, 409])('ERR-02 ERR-08 ERR-17 HTTP%i rejeita protocolos e diagnósticos após prefixo público', (status) => {
    const expected = status === 409
      ? 'Não foi possível concluir a operação porque os dados foram alterados ou já existem. Verifique e tente novamente.'
      : 'Dados inválidos. Verifique os campos e tente novamente.';
    for (const message of [
      'Campo inválido postgresql://synthetic:secret@internal-db/medreminder',
      'Campo inválido redis://synthetic:secret@internal-cache/0',
      'Campo inválido ftp://internal-host/private',
      'Campo inválido file:///private/secret',
      'Campo inválido token: synthetic-secret',
      'Campo inválido Error: private stack',
    ]) {
      expect(requestErrorMessage(http(status, [message]))).toBe(expected);
      if (status !== 409) expect(requestErrorMessage(http(status, [message]), 'registration')).toBe('Erro ao cadastrar. Tente novamente.');
    }
  });
  it('ERR-19 cancelamento intencional é silencioso', () => {
    expect(requestErrorMessage(new IntentionalRequestAbortError())).toBeNull();
  });
  it('REG-15 cadastro respeita Retry-After específico', () => {
    expect(requestErrorMessage(http(429, [], 0), 'registration')).toBe('Muitas tentativas de cadastro. Tente novamente em 0 segundos.');
  });
  it.each([http(503), new TypeError('rede'), new Error('diagnóstico privado')])('REG-16 cadastro preserva precedência sobre mensagem geral', (error) => {
    expect(requestErrorMessage(error, 'registration')).toBe('Erro ao conectar com o servidor. Tente novamente mais tarde.');
  });
  it('REG-10 cadastro tem orientação precisa de resultado incerto', () => {
    expect(requestErrorMessage(new RequestTimeoutError(), 'registration')).toBe('O servidor demorou para responder e não foi possível confirmar o cadastro. Tente entrar com seu e-mail e senha antes de cadastrar novamente.');
  });
  it('ERR-03 login 401 depende do status', () => {
    expect(requestErrorMessage(http(401), 'login')).toBe('E-mail ou senha inválidos');
    expect(requestErrorMessage(http(400, ['Campo inválido no registro 401']), 'login')).toBe('Campo inválido no registro 401');
  });
  it('ERR-04 expiração depende do contexto da sessão', () => {
    expect(requestErrorMessage(http(401), 'session')).toBe('Sessão expirada. Entre novamente.');
    expect(requestErrorMessage(http(401, ['Senha atual inválida.']))).toBe('Senha atual inválida.');
  });
});
