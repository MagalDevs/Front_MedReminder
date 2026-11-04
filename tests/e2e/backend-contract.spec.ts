import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { backendEnvironment } from '../support/backend-environment';
import { BACKEND_CONTRACT_SOURCE } from '../fixtures/backend-contracts';

// Sem mocks. Requer API descartável e banco temporário: cria duas contas sintéticas.
// A limpeza é destruir esse ambiente após o teste, não apagar dados de ambiente compartilhado.
test.describe.serial('BEAPI-12 contratos reais e persistência isolada', () => {
  let api: string;
  let tokenA: string;
  let tokenB: string;
  let doseId: number;
  let remedioId: number;
  const nonce = randomUUID();
  const password = 'SenhaSintetica1!';
  const nextPassword = 'NovaSenhaSintetica2!';
  const emailA = `e2e-a-${nonce}@example.test`;
  const emailB = `e2e-b-${nonce}@example.test`;
  const key = `e2e:${nonce}`;
  const treatment = {
    remedio: {
      nome: 'Medicamento Sintético E2E', quantidadeCaixa: 10, dataValidade: '2031-12-31',
      quantidadeDiaria: 1, foto: 'https://example.test/synthetic.png', classificacao: 'Comprimido',
      horaInicio: '2030-01-02T12:00:00.000Z', cor: 'Vermelho', unidadeMedida: 'mg',
      motivo: 'Teste sintético', quantidadeDias: 1, quantidadeDose: '1 mg', observacao: '',
    },
    doses: ['2030-01-02T12:00:00.000Z'],
  };
  const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

  function syntheticCpf() {
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    for (const size of [9, 10]) {
      const sum = digits.slice(0, size).reduce((total, digit, index) => total + digit * (size + 1 - index), 0);
      const rest = sum % 11;
      digits.push(rest < 2 ? 0 : 11 - rest);
    }
    return digits.join('');
  }
  async function login(request: APIRequestContext, email: string, senha: string) {
    const response = await request.post(`${api}/auth/login`, { data: { email, senha } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.access_token).toBe('string');
    return body.access_token as string;
  }
  test.beforeAll(() => { api = backendEnvironment().api; });

  test('cadastro A/B e login respeitam envelopes das fixtures', async ({ request }) => {
    for (const email of [emailA, emailB]) {
      const response = await request.post(`${api}/usuario`, { data: {
        nome: 'Conta Sintética E2E', email, senha: password, dataNasc: '1990-01-02',
        cpf: syntheticCpf(), cep: '01001000', cuidador: false,
      } });
      expect([200, 201]).toContain(response.status());
      const body = await response.json();
      expect(body).toHaveProperty('message');
      expect(body.data).toHaveProperty('id');
      expect(body.data).not.toHaveProperty('senha');
    }
    tokenA = await login(request, emailA, password);
    tokenB = await login(request, emailB, password);
  });

  test('perfil PATCH retorna data, CEP vazio valida400 e senha tem resultado próprio', async ({ request }) => {
    const response = await request.patch(`${api}/usuario/me`, { headers: headers(tokenA), data: { nome: 'Conta Atualizada', email: emailA, cep: '01001000' } });
    expect(response.status()).toBe(200);
    expect((await response.json()).data.nome).toBe('Conta Atualizada');
    const invalid = await request.patch(`${api}/usuario/me`, { headers: headers(tokenA), data: { cep: '' } });
    expect(invalid.status()).toBe(400);
    const validation = await invalid.json();
    expect(Array.isArray(validation.message)).toBe(true);
    if (validation.code !== undefined) expect(typeof validation.code).toBe('string');
    const wrong = await request.patch(`${api}/usuario/senha`, { headers: headers(tokenA), data: { senhaAtual: 'SenhaIncorreta1!', novaSenha: nextPassword } });
    expect(wrong.status()).toBe(401);
    expect((await request.get(`${api}/usuario/me`, { headers: headers(tokenA) })).status()).toBe(200);
    const changed = await request.patch(`${api}/usuario/senha`, { headers: headers(tokenA), data: { senhaAtual: password, novaSenha: nextPassword } });
    expect(changed.status()).toBe(200);
    expect(await changed.json()).toHaveProperty('message');
    tokenA = await login(request, emailA, nextPassword);
  });

  test('tratamento atômico e replay mesma chave não duplicam registros', async ({ request }) => {
    const options = { headers: { ...headers(tokenA), 'Idempotency-Key': key }, data: treatment };
    const response = await request.post(`${api}/tratamento`, options);
    expect([200, 201]).toContain(response.status());
    const first = (await response.json()).data;
    expect(first.doses).toHaveLength(1);
    doseId = first.doses[0].id;
    remedioId = first.remedio.id;
    expect(Number.isInteger(doseId)).toBe(true);
    const replay = await request.post(`${api}/tratamento`, options);
    expect([200, 201]).toContain(replay.status());
    const second = (await replay.json()).data;
    expect(second.remedio.id).toBe(remedioId);
    expect(second.doses.map((dose: { id: number }) => dose.id)).toEqual([doseId]);
    const list = await request.get(`${api}/dose/me`, { headers: headers(tokenA) });
    expect(list.status()).toBe(200);
    expect((await list.json()).data.filter((dose: { id: number }) => dose.id === doseId)).toHaveLength(1);
  });

  test('token ausente/inválido e DTO de tratamento inválido são rejeitados sem escrita', async ({ request }) => {
    expect((await request.get(`${api}/usuario/me`)).status()).toBe(401);
    expect((await request.get(`${api}/usuario/me`, { headers: headers('invalido-sintetico') })).status()).toBe(401);
    const response = await request.post(`${api}/tratamento`, { headers: { ...headers(tokenA), 'Idempotency-Key': `invalid:${nonce}` }, data: { ...treatment, doses: [] } });
    expect(response.status()).toBe(400);
    const list = await request.get(`${api}/dose/me`, { headers: headers(tokenA) });
    expect((await list.json()).data.filter((dose: { remedio: { id: number } }) => dose.remedio.id === remedioId)).toHaveLength(1);
  });

  test('senha fraca é rejeitada pelo backend e credencial anterior continua válida', async ({ request }) => {
    const response = await request.patch(`${api}/usuario/senha`, { headers: headers(tokenA), data: { senhaAtual: nextPassword, novaSenha: 'fraca' } });
    expect(response.status()).toBe(400);
    expect(Array.isArray((await response.json()).message)).toBe(true);
    tokenA = await login(request, emailA, nextPassword);
  });

  test('mesma chave com outro conteúdo retorna409 sem nova dose', async ({ request }) => {
    const response = await request.post(`${api}/tratamento`, { headers: { ...headers(tokenA), 'Idempotency-Key': key }, data: { ...treatment, doses: ['2030-01-02T13:00:00.000Z'] } });
    expect(response.status()).toBe(409);
    const list = await request.get(`${api}/dose/me`, { headers: headers(tokenA) });
    expect((await list.json()).data.filter((dose: { remedio: { id: number } }) => dose.remedio.id === remedioId)).toHaveLength(1);
  });

  test('conta B não lista nem altera a dose da conta A', async ({ request }) => {
    const list = await request.get(`${api}/dose/me`, { headers: headers(tokenB) });
    expect(list.status()).toBe(200);
    expect((await list.json()).data.some((dose: { id: number }) => dose.id === doseId)).toBe(false);
    const mutation = await request.put(`${api}/dose/${doseId}`, { headers: headers(tokenB), data: { tomado: true } });
    expect(mutation.status()).toBe(403);
  });

  test('confirmação persiste após consulta e recarga do histórico no navegador', async ({ page, request }) => {
    const confirmation = await request.put(`${api}/dose/${doseId}`, { headers: headers(tokenA), data: { tomado: true } });
    expect(confirmation.status()).toBe(200);
    const list = await request.get(`${api}/dose/me`, { headers: headers(tokenA) });
    expect((await list.json()).data.find((dose: { id: number }) => dose.id === doseId).tomado).toBe(true);
    await page.addInitScript((token) => localStorage.setItem('access_token', token), tokenA);
    await page.goto('/historico');
    await expect(page.getByRole('heading', { name: treatment.remedio.nome })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Tomado$/ })).toBeVisible();
    await page.reload();
    await expect(page.locator('span').filter({ hasText: /^Tomado$/ })).toBeVisible();
  });

  test('E2E-01 E2E-05 login e perfil pela interface persistem após reload e logout', async ({ page, request }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail', { exact: true }).fill(emailA);
    await page.getByLabel('Senha', { exact: true }).fill(nextPassword);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/Configuracoes');
    const name = page.getByPlaceholder('Digite seu nome completo');
    await expect(name).toHaveValue('Conta Atualizada');
    await name.fill('Conta Alterada Pela Interface');
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    await expect(page.getByText('Dados atualizados com sucesso!')).toBeVisible();
    await page.reload();
    await expect(name).toHaveValue('Conta Alterada Pela Interface');
    const persisted = await request.get(`${api}/usuario/me`, { headers: headers(tokenA) });
    expect((await persisted.json()).data.nome).toBe('Conta Alterada Pela Interface');
    await page.getByRole('button', { name: /Sair/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    await page.goto('/Configuracoes');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('registra revisão e limite de comparação das fixtures sem dados pessoais', async ({}, testInfo) => {
    const environment = backendEnvironment();
    await testInfo.attach('contract-revisions', { contentType: 'application/json', body: JSON.stringify({
      fixtureBaseline: BACKEND_CONTRACT_SOURCE.commit,
      actualBackendRevision: environment.commit,
      compared: ['signup-envelope', 'login-root-token', 'profile-data', 'password-message', 'validation-array-code', 'treatment-data-remedio-doses', 'dose-me-data'],
      fullDtoParity: false,
      note: 'Fixtures opacas de entidades e paginação exigem reconciliação com o código backend; este teste confere somente campos exercitados.',
    }) });
  });
});
