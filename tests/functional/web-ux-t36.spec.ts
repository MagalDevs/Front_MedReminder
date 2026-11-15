import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { dose, prepareSession, routeReadApi, syntheticProfile } from '../support/web-ux-routes';
test.use({ timezoneId: 'America/Sao_Paulo' });

test('WUX_DAY_01 local day and tie IDs determine displayed order', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, [dose(9, '2026-11-14T18:00:00Z'), dose(3, '2026-11-14T16:00:00Z'), dose(2, '2026-11-14T16:00:00Z'), dose(1, '2026-11-15T03:00:00Z')]);
  await page.goto('/hoje'); const list = page.getByRole('list', { name: 'Doses de hoje' });
  await expect(list.locator('li')).toHaveCount(3);
  expect(await list.locator('li').evaluateAll(items => items.map(item => item.getAttribute('data-dose-id')))).toEqual(['2', '3', '9']);
  await expect(list).toContainText('14/11/2026 às 13:00'); await expect(page.getByRole('link', { name: 'Hoje', exact: true })).toHaveAttribute('aria-current', 'page');
});
test('WUX_DAY_03 next future dose coexists with overdue doses', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, [dose(1, '2026-11-14T14:59:00Z', 'Atrasado'), dose(2, '2026-11-14T18:00:00Z', 'Depois'), dose(3, '2026-11-14T16:00:00Z', 'Próximo')]);
  await page.goto('/hoje'); await expect(page.getByRole('region', { name: 'Próxima dose', exact: true })).toContainText('13:00 Próximo');
  await expect(page.getByRole('list', { name: 'Doses de hoje' })).toContainText('Atrasada'); await expect(page.getByRole('list', { name: 'Doses de hoje' })).toContainText('Atrasado');
});
test('WUX_DAY_05 successful empty today offers history and adding medication', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); await page.goto('/hoje');
  await expect(page.getByText('Nenhuma dose prevista para hoje', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Ver Histórico', exact: true }).click(); await expect(page).toHaveURL(/\/historico$/);
  await page.goto('/hoje'); await page.getByRole('link', { name: 'Adicionar medicamento', exact: true }).click(); await expect(page).toHaveURL(/\/novo-medicamento$/);
});
test('T36 failed dose read stays partial and retries instead of claiming empty success', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); let failed = true;
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/me?**`, route => failed ? route.fulfill({ status: 503, json: { message: 'Indisponível' } }) : route.fulfill({ json: { data: [dose(2, '2026-11-14T16:00:00Z')] } }));
  await page.goto('/hoje'); await expect(page.getByRole('alert').filter({ hasText: 'Ao carregar doses' })).toBeVisible();
  await expect(page.getByText('Nenhuma dose prevista para hoje', { exact: true })).toHaveCount(0); await expect(page.getByRole('status').filter({ hasText: 'Hoje: 0 doses, 0 registradas e 0 não registradas.' })).toContainText('(parcial)');
  failed = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByRole('list', { name: 'Doses de hoje' }).locator('li')).toHaveCount(1);
});
test('T36 restoring and unavailable session withholds private content until manual recovery', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, [dose(2, '2026-11-14T16:00:00Z', 'Privado')]); let fail = true;
  let release!: () => void; const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario/me`, async route => { await hold; await route.fulfill(fail ? { status: 503, json: {} } : { json: { data: syntheticProfile } }); });
  await page.goto('/hoje'); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toHaveCount(0); await expect(page.getByText('Privado', { exact: true })).toHaveCount(0);
  release(); await expect(page.getByText('Sessão indisponível. Tente restaurar a sessão.')).toBeVisible(); await expect(page).toHaveURL(/\/hoje$/);
  fail = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible(); await expect(page.getByRole('heading', { name: 'Privado', exact: true })).toBeVisible();
});
test('T36 anonymous today requires login before private screen', async ({ page }) => {
  await page.goto('/hoje'); await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toHaveCount(0);
});
