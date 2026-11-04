import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';

// Browser real + respostas controladas; não comprova persistência na API real.
test('BEAPI-09 histórico usa doses autenticadas, filtros e recarga', async ({ page }) => {
  const user = { id: 7, nome: 'Ana Sintética', email: 'ana@example.test' };
  await page.addInitScript((profile) => {
    localStorage.setItem('access_token', 'token-sintetico');
    localStorage.setItem('user_data', JSON.stringify(profile));
  }, user);
  let confirmed = false;
  const requests: string[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type' } });
      return;
    }
    expect(request.headers().authorization).toBe('Bearer token-sintetico');
    requests.push(path);
    if (path === '/usuario/me') {
      await route.fulfill({ json: { data: user } });
    } else if (path === '/dose/me') {
      await route.fulfill({ json: { data: [{ id: 12, data_dose: '2020-01-02T12:00:00Z', tomado: confirmed, remedio: { id: 4, nome: 'Medicamento Sintético' } }] } });
    } else {
      await route.fallback();
    }
  });
  await page.goto('/historico');
  await expect(page.getByRole('heading', { name: 'Medicamento Sintético' })).toBeVisible();
  await expect(page.locator('span').filter({ hasText: /^Não tomado$/ })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Adiado', exact: true })).toHaveCount(0);
  await page.getByLabel('Medicamento', { exact: true }).selectOption('4');
  await page.getByLabel('Status', { exact: true }).selectOption('tomado');
  await expect(page.getByText('Nenhum histórico encontrado')).toBeVisible();
  confirmed = true; // Representa resposta já confirmada pelo servidor; não simula sua persistência.
  await page.reload();
  await expect(page.locator('span').filter({ hasText: /^Tomado$/ })).toBeVisible();
  expect(requests).toContain('/dose/me');
  expect(requests).not.toContain('/remedio');
});
