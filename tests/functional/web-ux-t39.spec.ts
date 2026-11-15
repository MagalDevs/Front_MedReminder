import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { dose, prepareSession, routeReadApi } from '../support/web-ux-routes';
test.use({ timezoneId: 'America/Sao_Paulo' });
test('WUX_DAY_06 history includes only past instants in descending order and labels planned time', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, [dose(1, '2026-11-13T10:00:00Z', 'Ontem'), dose(2, '2026-11-14T14:00:00Z', 'Mais recente'), dose(3, '2026-11-14T16:00:00Z', 'Futuro')]);
  await page.goto('/historico'); const list = page.getByRole('list', { name: 'Doses do histórico' }); await expect(list.locator('li')).toHaveCount(2);
  expect(await list.locator('li').evaluateAll(items => items.map(item => item.getAttribute('data-dose-id')))).toEqual(['2', '1']);
  await expect(list).toContainText('Horário previsto: 14/11/2026 às 11:00'); await expect(list).not.toContainText('Futuro'); await expect(page.getByRole('link', { name: 'Histórico', exact: true })).toHaveAttribute('aria-current', 'page');
});
test('WUX_DAY_07 period medication and state intersect over all 102 paginated records', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page);
  const rows = [...Array.from({ length: 100 }, (_, i) => dose(i + 1, '2026-10-01T12:00:00Z', 'Mesmo nome', 4, true)), dose(101, '2026-11-14T13:00:00Z', 'Mesmo nome', 8, true), dose(102, '2026-11-14T14:00:00Z', 'Mesmo nome', 8, false)];
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/me?**`, route => { const current = Number(new URL(route.request().url()).searchParams.get('page')); return route.fulfill({ json: { data: rows.slice((current - 1) * 100, current * 100), pagination: { page: current, limit: 100, total: 102, totalPages: 2 } } }); });
  await page.goto('/historico'); await expect(page.getByRole('status').filter({ hasText: '102 doses;' })).toHaveText('102 doses; 101 registrada(s); 1 não registrada(s).');
  await page.getByLabel('Período', { exact: true }).selectOption('today'); await page.getByLabel('Medicamento', { exact: true }).selectOption('8'); await page.getByLabel('Estado', { exact: true }).selectOption('registered');
  const list = page.getByRole('list', { name: 'Doses do histórico' }); await expect(list.locator('li')).toHaveCount(1); await expect(list.locator('li')).toHaveAttribute('data-dose-id', '101'); await expect(page.getByRole('status').filter({ hasText: '1 doses;' })).toHaveText('1 doses; 1 registrada(s); 0 não registrada(s).');
  await page.getByLabel('Medicamento', { exact: true }).selectOption('4'); await expect(page.getByText('Nenhuma dose corresponde aos filtros', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click(); await expect(list.locator('li')).toHaveCount(102);
});
test('T39 partial second page failure stays labeled and retry restores complete history totals', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); let fail = true;
  const first = Array.from({ length: 100 }, (_, index) => dose(index + 1, '2026-11-13T12:00:00Z', 'Antigo', 4, true));
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/me?**`, route => { const current = Number(new URL(route.request().url()).searchParams.get('page')); return route.fulfill(current === 2 && fail ? { status: 503, json: {} } : { json: { data: current === 1 ? first : [dose(101, '2026-11-14T14:00:00Z', 'Recente', 8, true)], pagination: { page: current, limit: 100, total: 101, totalPages: 2 } } }); });
  await page.goto('/historico'); await expect(page.getByRole('alert').filter({ hasText: 'Ao carregar histórico' })).toBeVisible(); await expect(page.getByRole('status').filter({ hasText: '100 doses;' })).toContainText('(parcial)'); await expect(page.getByText('Nenhuma dose no histórico até agora', { exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByRole('status').filter({ hasText: '101 doses;' })).toHaveText('101 doses; 101 registrada(s); 0 não registrada(s).'); await expect(page.getByRole('list', { name: 'Doses do histórico' }).locator('li').first()).toHaveAttribute('data-dose-id', '101');
});
