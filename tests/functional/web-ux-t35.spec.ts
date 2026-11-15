import { expect, test } from '../support/api-guard';

test('WUX_NAV_03 public purpose precedes account creation and both destinations work', async ({ page }) => {
  await page.route('**/assets/*.csv', route => route.fulfill({ body: 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n' }));
  await page.goto('/');
  const purpose = page.getByText('Organize seus medicamentos e acompanhe os horários das doses.', { exact: true });
  await expect(purpose).toBeVisible();
  const create = page.getByRole('link', { name: 'Criar conta', exact: true });
  expect(await purpose.evaluate((node, target) => Boolean(node.compareDocumentPosition(target as Node) & Node.DOCUMENT_POSITION_FOLLOWING), await create.elementHandle())).toBe(true);
  await create.click(); await expect(page).toHaveURL(/\/cadastro$/);
  await page.goto('/'); await page.getByRole('link', { name: 'Entrar', exact: true }).click(); await expect(page).toHaveURL(/\/login$/);
});

test('T35 public catalog selection works without private session', async ({ page }) => {
  await page.route('**/assets/*.csv', route => route.fulfill({ body: 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n' }));
  await page.goto('/'); const input = page.getByRole('combobox', { name: 'Buscar no catálogo' });
  await input.fill('Vitamina'); await page.getByRole('option', { name: /Vitamina A/ }).click();
  await expect(page.getByRole('heading', { name: 'Vitamina A', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Suplemento');
});

test('T35 unavailable catalog keeps account access and manual consultation', async ({ page }) => {
  await page.route('**/assets/*.csv', route => route.fulfill({ status: 503, body: '' }));
  await page.goto('/'); await expect(page.getByRole('alert').filter({ hasText: 'Ao carregar catálogo' })).toBeVisible();
  await page.getByRole('combobox').fill('Nome manual'); await page.getByRole('button', { name: 'Cadastrar manualmente' }).click();
  await expect(page.getByRole('heading', { name: 'Nome manual' })).toBeVisible();
  await page.getByRole('link', { name: 'Criar conta', exact: true }).click(); await expect(page).toHaveURL(/\/cadastro$/);
});

