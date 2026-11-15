import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { prepareSession, routeReadApi, syntheticProfile } from '../support/web-ux-routes';
test('WUX_ACCOUNT_05 profile PATCH includes changed allowlisted values and omits blank optionals', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); const writes: unknown[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario/me`, route => {
    if (route.request().method() !== 'PATCH') return route.fallback(); const body = route.request().postDataJSON(); writes.push(body); return route.fulfill({ json: { data: { ...syntheticProfile, ...body } } });
  });
  await page.goto('/Configuracoes'); await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Sintética'); await page.getByLabel('Nome', { exact: true }).fill('Ana Atualizada'); await page.getByLabel('CEP', { exact: true }).fill(''); await page.getByLabel('Data de nascimento', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click(); await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible(); expect(writes).toEqual([{ nome: 'Ana Atualizada' }]);
  await expect(page.getByLabel('CEP', { exact: true })).toHaveValue('12345678'); await expect(page.getByLabel('Data de nascimento', { exact: true })).toHaveValue('1990-01-02');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click(); await expect(page.getByText('Nenhuma alteração para salvar.', { exact: true })).toBeVisible(); expect(writes).toHaveLength(1);
});
test('WUX_ACCOUNT_08 legacy configuration URL exposes profile initials and only supported actions', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); await page.goto('/Configuracoes'); await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible(); await expect(page).toHaveURL(/\/Configuracoes$/);
  await expect(page.getByLabel('Iniciais do nome')).toHaveText('AS'); await expect(page.getByRole('link', { name: 'Perfil', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('input[type="file"]')).toHaveCount(0); await expect(page.getByRole('button', { name: /foto|recuperar|esqueci/i })).toHaveCount(0); await expect(page.getByRole('link', { name: /foto|recuperar|esqueci/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Segurança', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click(); await expect(page.getByText('Nenhuma alteração para salvar.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Hoje', exact: true }).click(); await expect(page).toHaveURL(/\/hoje$/);
});
test('T40 failed profile update preserves edits and successful explicit retry confirms the result', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); let fail = true; const writes: unknown[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario/me`, route => { if (route.request().method() !== 'PATCH') return route.fallback(); const body = route.request().postDataJSON(); writes.push(body); return route.fulfill(fail ? { status: 503, json: {} } : { json: { data: { ...syntheticProfile, ...body } } }); });
  await page.goto('/Configuracoes'); await page.getByLabel('Nome', { exact: true }).fill('Ana Recuperada'); await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click(); await expect(page.getByRole('alert').filter({ hasText: 'O serviço está temporariamente indisponível' })).toBeVisible(); await expect(page.getByText('Perfil atualizado.', { exact: true })).toHaveCount(0); await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Recuperada');
  fail = false; await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click(); await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible(); expect(writes).toEqual([{ nome: 'Ana Recuperada' }, { nome: 'Ana Recuperada' }]);
});
