import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { prepareSession, routeReadApi } from '../support/web-ux-routes';
test.use({ timezoneId: 'America/Sao_Paulo' });
const items = [
  { id: 1, nome: 'Vitamina A', classificacao: 'Suplemento', dataValidade: '2026-11-14' },
  { id: 2, nome: 'Vitamina A', classificacao: 'Outro', dataValidade: '2026-11-14' },
  { id: 3, nome: 'Vitamina A', classificacao: 'Suplemento', dataValidade: '2026-11-13' },
  { id: 4, nome: 'Vitamina B', classificacao: 'Suplemento', dataValidade: '2026-11-14' },
  { id: 5, nome: 'Vitamina A', classificacao: 'Suplemento', dataValidade: null },
];
test('WUX_MED_01 name classification and expiry intersect with clear restoring all records', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page, [], items); await page.goto('/meus-medicamentos');
  await page.getByLabel('Nome', { exact: true }).fill('vitamina a'); await page.getByLabel('Classificação', { exact: true }).selectOption('Suplemento'); await page.getByLabel('Validade', { exact: true }).selectOption('next30days');
  await expect(page.getByRole('article')).toHaveCount(1); await expect(page.getByRole('article')).toContainText('14/11/2026');
  await expect(page.getByRole('status').filter({ hasText: '1 medicamento' })).toHaveText('1 medicamento');
  await page.getByLabel('Validade', { exact: true }).selectOption('unknown'); await expect(page.getByRole('article')).toHaveCount(1); await expect(page.getByRole('article')).toContainText('Sem data');
  await page.getByLabel('Nome', { exact: true }).fill('Nada'); await expect(page.getByText('Nenhum medicamento corresponde aos filtros', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click(); await expect(page.getByRole('article')).toHaveCount(5); await expect(page.getByRole('status').filter({ hasText: '5 medicamentos' })).toHaveText('5 medicamentos');
  await expect(page.getByRole('navigation')).toHaveCount(1); await expect(page.getByRole('link', { name: 'Medicamentos', exact: true })).toHaveAttribute('aria-current', 'page');
  const row = page.getByRole('article').filter({ has: page.locator('#medication-2') });
  await expect(row.getByRole('link', { name: 'Editar medicamento' })).toHaveAttribute('href', '/meus-medicamentos/2/editar');
  await row.getByRole('link', { name: 'Ver horários' }).click(); await expect(page).toHaveURL(/\/meus-lembretes\?medicamentoId=2$/);
});
test('T37 medication read failure recovers to successful empty state', async ({ page }) => {
  await prepareSession(page); await routeReadApi(page); let fail = true;
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/me`, route => route.fulfill(fail ? { status: 503, json: {} } : { json: { data: [] } }));
  await page.goto('/meus-medicamentos'); await expect(page.getByRole('alert').filter({ hasText: 'Ao carregar medicamentos' })).toBeVisible(); await expect(page.getByText('Nenhum medicamento cadastrado', { exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByText('Nenhum medicamento cadastrado', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Adicionar medicamento', exact: true }).click(); await expect(page).toHaveURL(/\/novo-medicamento$/);
});
