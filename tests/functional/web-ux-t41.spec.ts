import type { Page } from '@playwright/test';
import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { routeReadApi } from '../support/web-ux-routes';
async function setup(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-14T15:00:00Z')); await routeReadApi(page);
  await page.route(`${PRODUCTION_API_ORIGIN}/auth/login`, route => {
    expect(route.request().method()).toBe('POST'); expect(route.request().postDataJSON()).toEqual({ email: 'ana@example.test', senha: 'Senha123!' });
    return route.fulfill({ json: { access_token: 'token-sintetico' } });
  });
  await page.route('**/assets/*.csv', route => route.fulfill({ body: 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n' }));
}
async function signIn(page: Page) {
  await page.getByLabel('E-mail', { exact: true }).fill('ana@example.test'); await page.getByLabel('Senha', { exact: true }).fill('Senha123!'); await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
test('WUX_NAV_01 login without pending destination opens Hoje after validated profile', async ({ page }) => {
  await setup(page); await page.goto('/login'); await signIn(page); await expect(page).toHaveURL(/\/hoje$/); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible(); await expect(page.getByText('Nenhuma dose prevista para hoje', { exact: true })).toBeVisible();
});
test('WUX_NAV_04 requested internal treatment survives Entrar with query and remains private until login', async ({ page }) => {
  await setup(page); await page.goto('/novo-medicamento?medicamento=Vitamina%20A'); await expect(page).toHaveURL(/\/login$/); await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveCount(0);
  await signIn(page); await expect(page).toHaveURL(/\/novo-medicamento\?medicamento=Vitamina%20A$/); await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina A');
});
for (const target of ['https://external.example/private', '//external.example/private', '/login', '/hoje/../login']) {
  test(`WUX_NAV_07 rejects unapproved return destination ${target}`, async ({ page }) => {
    await setup(page); await page.goto(`/login?returnTo=${encodeURIComponent(target)}`); await signIn(page); await expect(page).toHaveURL(/\/hoje$/); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
  });
}
test('T41 explicit internal returnTo opens the requested legacy profile route', async ({ page }) => {
  await setup(page); await page.goto('/login?returnTo=%2FConfiguracoes'); await signIn(page); await expect(page).toHaveURL(/\/Configuracoes$/); await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Sintética');
});
test('T41 voluntary logout clears pending target and a new login opens Hoje', async ({ page }) => {
  await setup(page); await page.goto('/login?returnTo=%2FConfiguracoes'); await signIn(page); await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); await expect(page.getByLabel('Nome', { exact: true })).toHaveCount(0); expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  await signIn(page); await expect(page).toHaveURL(/\/hoje$/); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
});
test('T41 denied login retains form and retry can authenticate without private screen on failure', async ({ page }) => {
  await setup(page); let fail = true;
  await page.route(`${PRODUCTION_API_ORIGIN}/auth/login`, route => route.fulfill(fail ? { status: 401, json: {} } : { json: { access_token: 'token-sintetico' } }));
  await page.goto('/login'); await signIn(page); await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos' })).toBeVisible(); await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('ana@example.test'); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Entrar', exact: true }).click(); await expect(page).toHaveURL(/\/hoje$/);
});
test('T41 after voluntary logout a newly requested protected destination can be remembered', async ({ page }) => {
  await setup(page); await page.goto('/login'); await signIn(page); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Perfil', exact: true }).click(); await expect(page).toHaveURL(/\/Configuracoes$/);
  await page.getByRole('button', { name: 'Sair', exact: true }).click(); await expect(page).toHaveURL(/\/login$/);
  // Browser Back requests the protected route again within the same layout.
  await page.goBack(); await expect(page).toHaveURL(/\/login$/); await signIn(page); await expect(page).toHaveURL(/\/Configuracoes$/);
});
