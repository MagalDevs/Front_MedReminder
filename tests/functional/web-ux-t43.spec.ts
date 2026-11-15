import { expect, test } from '../support/api-guard';
import { dose, prepareSession, routeReadApi } from '../support/web-ux-routes';
test.use({ timezoneId: 'America/Sao_Paulo' });
const medications = [{ id: 4, nome: 'Mesmo nome' }, { id: 8, nome: 'Mesmo nome' }];
const rows = [dose(1, '2026-11-14T17:00:00Z', 'Mesmo nome', 4), dose(2, '2026-11-14T18:00:00Z', 'Mesmo nome', 8), dose(3, '2026-11-15T19:00:00Z', 'Mesmo nome', 8)];
test('WUX_NAV_05 all existing medication agenda history and configuration URLs show equivalent content', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, rows, medications);
  for (const [path, heading] of [['/meus-medicamentos', 'Medicamentos'], ['/meus-lembretes', 'Agenda de doses'], ['/historico', 'Histórico'], ['/Configuracoes', 'Perfil']]) {
    await page.goto(path); await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible(); await expect(page).toHaveURL(new RegExp(`${path}$`)); await expect(page.getByRole('heading', { name: /404/ })).toHaveCount(0);
  }
});
test('WUX_MED_04 Ver horários filters by ID despite identical names and includes future doses', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, rows, medications); await page.goto('/meus-medicamentos');
  await page.getByRole('article').filter({ has: page.locator('#medication-8') }).getByRole('link', { name: 'Ver horários' }).click(); await expect(page).toHaveURL(/\/meus-lembretes\?medicamentoId=8$/);
  const list = page.getByRole('list', { name: 'Agenda de doses' }); await expect(list.locator('li')).toHaveCount(2); expect(await list.locator('li').evaluateAll(items => items.map(item => item.getAttribute('data-dose-id')))).toEqual(['2', '3']);
  await expect(list).toContainText('15/11/2026 às 16:00'); await expect(list).not.toContainText('14/11/2026 às 14:00');
  await page.getByRole('link', { name: 'Ver Hoje', exact: true }).click(); await expect(page).toHaveURL(/\/hoje$/); await expect(page.getByRole('list', { name: 'Doses de hoje' }).locator('li')).toHaveCount(2);
});
test('T43 unknown valid ID shows an empty agenda while invalid ID never silently shows unrelated doses', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, rows, medications); await page.goto('/meus-lembretes?medicamentoId=999'); await expect(page.getByText('Nenhuma dose encontrada nesta agenda', { exact: true })).toBeVisible(); await expect(page.getByRole('list', { name: 'Agenda de doses' })).toHaveCount(0);
  await page.goto('/meus-lembretes?medicamentoId=abc'); await expect(page.getByRole('alert').filter({ hasText: 'Identificador de medicamento inválido' })).toBeVisible(); await expect(page.getByRole('heading', { name: 'Mesmo nome', exact: true })).toHaveCount(0); await page.getByRole('link', { name: 'Ver Hoje', exact: true }).click(); await expect(page).toHaveURL(/\/hoje$/);
});
