import { test as base, expect, type Page, type Request } from '@playwright/test';

const FRONT = 'http://localhost:3000';
const API = 'http://localhost:3001';
const account = {
  nome: 'Pessoa sintética browser',
  email: 'feedback-browser@example.com',
  cpf: '00000000071',
  cep: '01001000',
  dataNasc: '1990-01-01',
  cuidador: false,
  senha: 'Synthetic1!browser',
};
const SUCCESS = 'Cadastro concluído! Entre com seu e-mail e senha.';
const TIMEOUT = 'O servidor demorou para responder e não foi possível confirmar o cadastro. Tente entrar com seu e-mail e senha antes de cadastrar novamente.';

const test = base.extend<{ originGuard: void }>({
  originGuard: [async ({ context }, use) => {
    const unexpected: string[] = [];
    await context.route('**/*', async route => {
      const origin = new URL(route.request().url()).origin;
      if (origin === FRONT || origin === API) await route.continue();
      else {
        unexpected.push(origin);
        await route.abort('blockedbyclient');
      }
    });
    await use();
    expect(unexpected, 'Nenhuma API ou origem externa é permitida').toEqual([]);
  }, { auto: true }],
});

async function fillRegistration(page: Page) {
  await page.goto('/cadastro');
  await page.getByPlaceholder('Nome e sobrenome').fill(account.nome);
  await page.getByPlaceholder('exemplo@email.com').fill(account.email);
  await page.getByPlaceholder('000.000.000-00').fill(account.cpf);
  await page.getByPlaceholder('00000-000').fill(account.cep);
  await page.locator('input[type="date"]').fill(account.dataNasc);
  await page.locator('input[type="password"]').nth(0).fill(account.senha);
  await page.locator('input[type="password"]').nth(1).fill(account.senha);
}

test('REG-01 REG-03 REG-08 REG-19 formulário local confirma201 e persiste entre cadastro login e perfil reais', async ({ page }) => {
  const posts: Request[] = [];
  const logs: string[] = [];
  page.on('console', message => logs.push(message.text()));
  page.on('pageerror', error => logs.push(error.message));
  page.on('request', request => {
    if (request.method() === 'POST' && request.url() === `${API}/usuario`) posts.push(request);
  });
  await fillRegistration(page);
  await page.evaluate(() => {
    const metrics = { start: 0, loading: null as number | null };
    (window as unknown as { feedbackMetrics: typeof metrics }).feedbackMetrics = metrics;
    document.querySelector('form')!.addEventListener('submit', () => {
      metrics.start = performance.now();
    }, { once: true });
    const observer = new MutationObserver(() => {
      const button = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (metrics.start && metrics.loading === null && button?.disabled && button.textContent?.includes('Carregando...')) {
        metrics.loading = performance.now() - metrics.start;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  });
  const responsePromise = page.waitForResponse(response => response.url() === `${API}/usuario` && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  await expect(page).toHaveURL(`${FRONT}/login`);
  await expect(page.getByRole('status')).toHaveText(SUCCESS);
  expect(posts).toHaveLength(1);
  expect(posts[0].postDataJSON()).toEqual(account);
  expect((await posts[0].allHeaders()).authorization).toBeUndefined();
  const metrics = await page.evaluate(() => {
    const current = (window as unknown as { feedbackMetrics: { start: number; loading: number | null } }).feedbackMetrics;
    return { loading: current.loading, complete: performance.now() - current.start };
  });
  expect(metrics.loading).not.toBeNull();
  expect(metrics.loading!).toBeLessThanOrEqual(200);
  expect(metrics.complete).toBeGreaterThan(0);
  console.info(`REG-03 browser_flow_ms=${metrics.complete.toFixed(3)} loading_ms=${metrics.loading!.toFixed(3)} destination=localhost:3001`);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({ local: {}, session: {} });
  for (const value of [account.senha, account.email, account.cpf, account.cep]) {
    expect(logs.join('\n')).not.toContain(value);
    expect(page.url()).not.toContain(value);
  }
  const loginResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/auth/session/login' && response.request().method() === 'POST');
  const profileResponse = page.waitForResponse(response => response.url() === `${API}/usuario/me` && response.request().method() === 'GET');
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(account.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  expect((await loginResponse).status()).toBe(200);
  const profile = await profileResponse;
  expect(profile.status()).toBe(200);
  const profileBody = await profile.json();
  expect(profileBody.data).toMatchObject({ nome: account.nome, email: account.email, cpf: account.cpf, cep: account.cep, cuidador: false });
  expect(profileBody.data).not.toHaveProperty('senha');
  await expect(page).toHaveURL(`${FRONT}/`);
  await expect(page.getByRole('button', { name: 'User menu' })).toHaveText('Olá, Pessoa');
});

test('ERR-01 REG-11 REG-13 falha HTTP mostra alerta recupera botão e exige nova ação', async ({ page }) => {
  let count = 0;
  await page.route(`${API}/usuario`, route => {
    count++;
    return route.fulfill({ status: count === 1 ? 503 : 409, contentType: 'application/json', headers: { 'access-control-allow-origin': FRONT }, body: JSON.stringify({ message: count === 1 ? 'SQLITE_ERROR private' : 'CPF já cadastrado' }) });
  });
  await fillRegistration(page);
  const button = page.getByRole('button', { name: 'Cadastrar', exact: true });
  await button.click();
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveText('Erro ao conectar com o servidor. Tente novamente mais tarde.');
  await expect(button).toBeEnabled();
  await expect(page.getByPlaceholder('exemplo@email.com')).toHaveValue(account.email);
  expect(count).toBe(1);
  await expect(page).toHaveURL(`${FRONT}/cadastro`);
  expect(await page.getByRole('status').allTextContents()).not.toContain(SUCCESS);
  await button.click();
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveText('CPF já cadastrado');
  await expect(button).toBeEnabled();
  expect(count).toBe(2);
});

test('REG-04 REG-05 REG-06 REG-10 timeout15000ms recupera controle sem reenvio nem sucesso tardio', async ({ page }) => {
  await page.clock.install();
  let count = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(`${API}/usuario`, async route => {
    count++;
    await pending;
    await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'access-control-allow-origin': FRONT }, body: '{}' }).catch(() => {});
  });
  await fillRegistration(page);
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Carregando...', exact: true })).toBeDisabled();
  await page.getByPlaceholder('exemplo@email.com').press('Enter');
  await expect.poll(() => count).toBe(1);
  await page.clock.fastForward(15000);
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveText(TIMEOUT);
  await expect(page.getByRole('button', { name: 'Cadastrar', exact: true })).toBeEnabled();
  release();
  await page.clock.fastForward(30000);
  await expect(page).toHaveURL(`${FRONT}/cadastro`);
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveText(TIMEOUT);
  expect(count).toBe(1);
  expect(await page.getByRole('status').allTextContents()).not.toContain(SUCCESS);
});

test('ERR-01 NET-20 catálogo automático mostra um alerta antes da busca e login direto omite confirmação', async ({ page }) => {
  await page.route(`${FRONT}/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv`, route => route.abort('internetdisconnected'));
  await page.goto('/');
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveText('Ao carregar catálogo de medicamentos: Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  await expect(page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))).toHaveCount(1);
  await expect(page.getByPlaceholder('Buscar medicamento...')).toHaveValue('');
  await page.getByPlaceholder('Buscar medicamento...').fill('Teste');
  await expect(page.getByText('Nenhum resultado encontrado')).toHaveCount(0);
  await page.goto('/login');
  await expect(page.getByRole('status')).toHaveCount(0);
});
