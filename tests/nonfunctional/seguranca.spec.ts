import { test, expect, setup, CORS, TOKEN, USER, evidence } from './support';
import { PRODUCTION_API_ORIGIN } from '../support/api-guard';

const PASSWORD = 'NF_PASSWORD_SYNTHETIC';
const ERROR_BODY = 'NF_RAW_ERROR_SYNTHETIC';

test('NF-03 NF-WEB-04 login logging and storage exposure', async ({ page }, info) => {
  await setup(page, 0, false);
  const logs: string[] = [];
  page.on('console', message => logs.push(message.text()));
  await page.route(`${PRODUCTION_API_ORIGIN}/auth/login`, route => route.fulfill({ headers: CORS, json: { access_token: TOKEN } }));
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(USER.email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:3001/');
  await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
  expect(logs.join('\n')).not.toContain(PASSWORD);
  expect(logs.join('\n')).not.toContain(TOKEN);
  const storage = await page.evaluate(() => ({ tokenPresent: !!localStorage.getItem('access_token'), profilePresent: !!localStorage.getItem('user_data') }));
  expect(storage.tokenPresent).toBe(true);
  await evidence(info, 'security-login', { passwordsOrTokensInConsole: false, storage,
    limitation: 'Token/profile in localStorage accessible to same-origin JavaScript; this is not XSS protection or backend authorization evidence' });
});

test('NF-03 NF-WEB-04 raw HTTP error body absent from console', async ({ page }, info) => {
  await setup(page, 0, false);
  const logs: string[] = [];
  page.on('console', message => logs.push(message.text()));
  await page.route(`${PRODUCTION_API_ORIGIN}/auth/login`, route => route.fulfill({ status: 500, headers: CORS,
    json: { message: 'Falha sintética', privateDetail: ERROR_BODY } }));
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(USER.email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Falha sintética', { exact: true })).toBeVisible();
  expect(logs.join('\n')).not.toContain(ERROR_BODY);
  expect(logs.join('\n')).not.toContain(PASSWORD);
  await evidence(info, 'security-errors', { arbitraryErrorBodyInConsole: false, passwordInConsole: false, displayedMessage: 'Safe synthetic message' });
});

test('NF-03 NF-WEB-04 authenticated 401 clears storage', async ({ page }, info) => {
  await setup(page);
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario/me`, route => route.fulfill({ status: 401, headers: CORS, json: { message: 'Sessão inválida' } }));
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/me`, route => route.fulfill({ status: 401, headers: CORS, json: { message: 'Sessão inválida' } }));
  await page.goto('/meus-lembretes');
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('user_data'))).toBeNull();
  await evidence(info, 'security-401', { tokenRemoved: true, profileRemoved: true, loginRedirect: true, backend: 'Simulated 401; JWT validation not tested' });
});

test('NF-03 NF-WEB-04 logout removes token and profile', async ({ page }, info) => {
  await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => ({ token: localStorage.getItem('access_token'), profile: localStorage.getItem('user_data') }))).toEqual({ token: null, profile: null });
  await evidence(info, 'security-logout', { storageCleared: true, scope: 'Local logout only; pending dose queue verified in integration tests, not this browser case' });
});
