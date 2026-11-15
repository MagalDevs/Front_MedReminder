import type { Page } from '@playwright/test';
import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { dose, prepareSession, routeReadApi } from '../support/web-ux-routes';
test.use({ timezoneId: 'America/Sao_Paulo' });
const instants = ['2026-11-15T11:00:00.000Z', '2026-11-15T17:00:00.000Z', '2026-11-15T23:00:00.000Z', '2026-11-16T05:00:00.000Z'];
const saved = { data: { remedio: { id: 71, nome: 'Vitamina' }, doses: instants.map((at, index) => ({ id: index + 1, remedioId: 71, data_dose: at, tomado: false })) } };
async function setup(page: Page) {
  await prepareSession(page); await routeReadApi(page);
  await page.route('**/assets/*.csv', route => route.fulfill({ body: 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n' }));
}
async function medication(page: Page) {
  await page.getByLabel('Nome do medicamento', { exact: true }).fill('Vitamina');
  await page.getByLabel('Quantidade em estoque', { exact: true }).fill('10'); await page.getByLabel('Unidade do estoque', { exact: true }).fill('comprimidos');
  await page.getByLabel('Validade', { exact: true }).fill('2027-12-31'); await page.getByLabel('URL da foto', { exact: true }).fill('https://example.test/photo.png');
  await page.locator('label').filter({ has: page.getByRole('radio', { name: 'Azul', exact: true }) }).click(); await expect(page.getByRole('radio', { name: 'Azul', exact: true })).toBeChecked();
}
async function treatment(page: Page) {
  await page.getByLabel('Quantidade por dose', { exact: true }).fill('1,5'); await page.getByLabel('Unidade por dose', { exact: true }).fill('mg');
  await page.getByLabel('Primeira dose', { exact: true }).fill('2026-11-15T08:00'); await page.getByLabel('Intervalo em horas', { exact: true }).fill('6'); await page.getByLabel('Duração', { exact: true }).fill('1');
}
async function review(page: Page) { await medication(page); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); await treatment(page); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); }
test('WUX_NAV_06 anonymous treatment is blocked before any input or private request', async ({ page }) => {
  await page.goto('/novo-medicamento?medicamento=Vitamina'); await expect(page).toHaveURL(/\/login$/); await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveCount(0);
});
test('WUX_FORM_01 stages preserve draft and valid initial name never overwrites edits', async ({ page }) => {
  await setup(page); await page.goto('/novo-medicamento?medicamento=Vitamina%20A'); await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina A');
  await expect(page.getByRole('list', { name: 'Etapas do cadastro' }).locator('[aria-current="step"]')).toHaveText('Medicamento');
  await medication(page); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); await treatment(page);
  await expect(page.getByRole('list', { name: 'Etapas do cadastro' }).locator('[aria-current="step"]')).toHaveText('Tratamento');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click(); await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina');
  await page.getByRole('link', { name: 'Medicamentos', exact: true }).click(); await page.getByRole('link', { name: 'Adicionar medicamento', exact: true }).click();
  await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina'); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); await expect(page.getByLabel('Quantidade por dose', { exact: true })).toHaveValue('1,5');
});
test('WUX_FORM_11 review exposes exact dose schedule and timezone before saving', async ({ page }) => {
  await setup(page); await page.goto('/novo-medicamento'); await review(page);
  const region = page.getByRole('region', { name: 'Revisão', exact: true });
  await expect(region).toContainText('Vitamina'); await expect(region).toContainText('1,5 mg'); await expect(region).toContainText('A cada 6 horas'); await expect(region).toContainText('4 doses'); await expect(region).toContainText('America/Sao_Paulo');
  await expect(page.getByTestId('review-start')).toHaveAttribute('datetime', instants[0]); await expect(page.getByTestId('review-end')).toHaveAttribute('datetime', '2026-11-16T11:00:00.000Z');
  await page.getByRole('button', { name: 'Ver todos os horários' }).click(); const list = page.getByRole('list', { name: 'Horários previstos' }); await expect(list.locator('li')).toHaveCount(4); expect(await list.locator('time').evaluateAll(items => items.map(item => item.getAttribute('datetime')))).toEqual(instants);
});
test('WUX_FORM_14 review gesture sends single atomic payload and idempotency key', async ({ page }) => {
  await setup(page); const posts: { body: unknown; key: string | undefined }[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/tratamento`, async route => { posts.push({ body: route.request().postDataJSON(), key: route.request().headers()['idempotency-key'] }); await route.fulfill({ status: 201, json: saved }); });
  await page.goto('/novo-medicamento'); await review(page); await page.getByRole('button', { name: 'Salvar tratamento', exact: true }).dblclick();
  await expect(page.getByText('Tratamento salvo.', { exact: true })).toBeVisible(); expect(posts).toHaveLength(1); expect(posts[0].key).toBeTruthy();
  expect(posts[0].body).toEqual({ remedio: { nome: 'Vitamina', classificacao: 'Não classificado', quantidadeCaixa: 10, unidadeMedida: 'comprimidos', dataValidade: '2027-12-31', quantidadeDiaria: 4, quantidadeDias: 1, horaInicio: instants[0], quantidadeDose: '1.5 mg', cor: 'Azul', motivo: 'Não especificado', observacao: '', foto: 'https://example.test/photo.png' }, doses: instants });
});
test('WUX_FORM_15 confirmed summary survives internal navigation and leads to selected medication', async ({ page }) => {
  await setup(page); await page.route(`${PRODUCTION_API_ORIGIN}/tratamento`, route => route.fulfill({ status: 201, json: saved })); await page.goto('/novo-medicamento'); await review(page); await page.getByRole('button', { name: 'Salvar tratamento', exact: true }).click();
  const confirmed = page.getByRole('region', { name: 'Tratamento confirmado' }); await expect(confirmed).toContainText('Vitamina'); await expect(confirmed).toContainText('Primeira dose criada'); await expect(confirmed.locator('time')).toHaveAttribute('datetime', instants[0]);
  await page.getByRole('link', { name: 'Ir para Hoje' }).click(); await page.getByRole('link', { name: 'Adicionar medicamento', exact: true }).click(); await expect(confirmed).toContainText('Vitamina'); await expect(confirmed.locator('time')).toHaveAttribute('datetime', instants[0]);
  await page.getByRole('link', { name: 'Ver horários', exact: true }).click(); await expect(page).toHaveURL(/\/meus-lembretes\?medicamentoId=71$/);
});
test('T38 confirmed create with global refresh failure retries GET only and updates alarm collection', async ({ page }) => {
  await setup(page); let created = false; let fail = true; let posts = 0; let readsAfterCreate = 0;
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/me?**`, route => { if (created) readsAfterCreate++; return route.fulfill(created && fail ? { status: 503, json: {} } : { json: { data: created ? [dose(91, '2026-11-14T15:00:00Z', 'Vitamina', 71)] : [] } }); });
  await page.route(`${PRODUCTION_API_ORIGIN}/tratamento`, route => { posts++; created = true; return route.fulfill({ status: 201, json: saved }); });
  await page.goto('/novo-medicamento'); await review(page); await page.getByRole('button', { name: 'Salvar tratamento', exact: true }).click(); await expect(page.getByText('Tratamento salvo. Não foi possível atualizar a lista.', { exact: true })).toBeVisible();
  fail = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByText('Tratamento salvo.', { exact: true })).toBeVisible(); expect(posts).toBe(1); expect(readsAfterCreate).toBe(2); await expect(page.getByRole('dialog', { name: 'Lembrete de dose' })).toContainText('Vitamina');
});
test('T38 uncertain creation freezes exact body and key across route navigation then manual retry', async ({ page }) => {
  await setup(page); const posts: { body: string | null; key: string | undefined }[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/tratamento`, route => { posts.push({ body: route.request().postData(), key: route.request().headers()['idempotency-key'] }); return posts.length === 1 ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ status: 201, json: saved }); });
  await page.goto('/novo-medicamento'); await review(page); await page.getByRole('button', { name: 'Salvar tratamento', exact: true }).click(); await expect(page.getByText('A nova tentativa usa exatamente o mesmo conteúdo.')).toBeVisible();
  await page.getByRole('link', { name: 'Consultar registros' }).click(); await page.getByRole('link', { name: 'Adicionar medicamento', exact: true }).click(); await expect(page.getByRole('button', { name: 'Salvar tratamento', exact: true })).toHaveCount(0); await expect(page.getByText('A nova tentativa usa exatamente o mesmo conteúdo.')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByText('Tratamento salvo.', { exact: true })).toBeVisible(); expect(posts).toHaveLength(2); expect(posts[1]).toEqual(posts[0]);
});
