import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { dose, prepareSession, routeReadApi } from '../support/web-ux-routes';

test.use({ timezoneId: 'America/Sao_Paulo' });
const medication = { id: 17, nome: 'Vitamina Sintética', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-01-01', cor: 'Azul', motivo: 'Rotina', observacao: '', quantidadeDose: '1,5 mg', unidadeMedida: 'comprimidos', quantidadeDiaria: 6, quantidadeDias: 10 };
async function setup(page: Parameters<typeof prepareSession>[0]) {
  await prepareSession(page);
  await routeReadApi(page, [dose(31, '2026-11-14T08:00:00-03:00', medication.nome, 17)], [medication]);
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, route => route.request().method() === 'GET' ? route.fulfill({ json: { data: medication } }) : route.fallback());
}

test('WUX_MED_05 edit opens the selected item and cancel preserves its original values', async ({ page }) => {
  await setup(page); await page.goto('/meus-medicamentos');
  await page.getByRole('link', { name: 'Editar medicamento' }).click();
  await expect(page).toHaveURL(/\/meus-medicamentos\/17\/editar$/);
  await expect(page.getByRole('heading', { name: 'Editar medicamento', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(medication.nome);
  await expect(page.getByLabel('Quantidade em estoque')).toHaveValue('10');
  let writes = 0; page.on('request', request => { if (request.method() === 'PUT') writes++; });
  await page.getByLabel('Nome', { exact: true }).fill('Alteração descartada');
  await page.getByRole('link', { name: 'Voltar para Medicamentos' }).click();
  await expect(page).toHaveURL(/\/meus-medicamentos$/); await expect(page.getByRole('article')).toContainText(medication.nome);
  expect(writes).toBe(0);
});

test('WUX_MED_06 save sends only seven changed metadata fields to the existing ID and recovers after failure', async ({ page }) => {
  await setup(page); let fail = true; const bodies: unknown[] = [];
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON(); bodies.push(body);
    return route.fulfill(fail ? { status: 503, json: {} } : { json: { data: { ...medication, ...body } } });
  });
  await page.goto('/meus-medicamentos/17/editar');
  const changed = { nome: 'Vitamina Revisada', classificacao: 'Outra', quantidadeCaixa: 25, dataValidade: '2028-02-29', cor: 'Verde claro', motivo: 'Novo motivo', observacao: 'Com água' };
  for (const [label, value] of [['Nome', changed.nome], ['Classificação', changed.classificacao], ['Quantidade em estoque', '25'], ['Validade', changed.dataValidade], ['Motivo', changed.motivo], ['Observação', changed.observacao]]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('radio', { name: 'Verde claro', exact: true }).locator('..').click();
  await expect(page.getByRole('radio', { name: 'Verde claro', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'O serviço está temporariamente indisponível.' })).toBeVisible(); await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(changed.nome);
  await expect(page.getByText('Medicamento atualizado. Os horários das doses foram preservados.')).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Medicamento atualizado.' })).toBeVisible(); expect(bodies).toEqual([changed, changed]);
  await page.getByRole('button', { name: 'Salvar alterações' }).click(); await expect(page.getByText('Nenhuma alteração para salvar.')).toBeVisible(); expect(bodies).toHaveLength(2);
});

test('WUX_MED_07 treatment remains read only with the explicit schedule limit', async ({ page }) => {
  await setup(page); await page.goto('/meus-medicamentos/17/editar');
  await expect(page.getByText('Esta edição não altera os horários das doses', { exact: true })).toBeVisible();
  const details = page.getByRole('region', { name: 'Tratamento (somente leitura)' });
  await expect(details).toContainText('14/11/2026'); await expect(details).toContainText('08:00');
  for (const text of ['Intervalo', 'Duração', 'Quantidade por dose', 'Unidade de estoque', '1,5 mg', 'comprimidos']) await expect(details).toContainText(text);
  await expect(details.locator('input,select,textarea')).toHaveCount(0);
  await details.getByRole('link', { name: 'Ver horários' }).click(); await expect(page).toHaveURL(/\/meus-lembretes\?medicamentoId=17$/);
});

test('T44 invalid unsafe IDs never request an item and unauthenticated edit requires login', async ({ page, context }) => {
  await setup(page); const reads: string[] = []; page.on('request', request => { if (/\/remedio\//.test(request.url())) reads.push(request.url()); });
  for (const id of ['abc', '0', '-1', '9007199254740992', '17x']) {
    await page.goto(`/meus-medicamentos/${id}/editar`); await expect(page.getByRole('alert').filter({ hasText: 'Medicamento inválido.' })).toHaveText('Medicamento inválido.'); await expect(page.getByLabel('Nome', { exact: true })).toHaveCount(0);
  }
  expect(reads).toEqual([]);
  await page.evaluate(() => localStorage.clear()); const guest = await context.newPage(); await guest.goto('/meus-medicamentos/17/editar');
  await expect(guest).toHaveURL(/\/login$/); await expect(guest.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await routeReadApi(guest);
  await guest.route(`${PRODUCTION_API_ORIGIN}/auth/login`, route => route.fulfill({ json: { access_token: 'token-sintetico' } }));
  await guest.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, route => route.fulfill({ json: { data: medication } }));
  await guest.getByLabel('E-mail', { exact: true }).fill('ana@example.test'); await guest.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await guest.getByRole('button', { name: 'Entrar', exact: true }).click(); await expect(guest).toHaveURL(/\/meus-medicamentos\/17\/editar$/);
  await expect(guest.getByLabel('Nome', { exact: true })).toHaveValue(medication.nome);
});

test('T44 failed item load offers a manual retry without an empty editable form', async ({ page }) => {
  await setup(page); let fail = true;
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, route => route.fulfill(fail ? { status: 503, json: {} } : { json: { data: medication } }));
  await page.goto('/meus-medicamentos/17/editar'); await expect(page.getByRole('alert').filter({ hasText: 'O serviço está temporariamente indisponível.' })).toBeVisible(); await expect(page.getByLabel('Nome', { exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(medication.nome);
});
