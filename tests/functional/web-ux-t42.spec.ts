import type { Page } from '@playwright/test';
import { expect, test, PRODUCTION_API_ORIGIN } from '../support/api-guard';
async function account(page: Page) {
  await page.getByLabel('E-mail', { exact: true }).fill('ana@example.test'); await page.getByLabel('Senha', { exact: true }).fill('Senha123!'); await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha123!'); await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
async function personal(page: Page) {
  await page.getByLabel('Nome completo', { exact: true }).fill('Ana Sintética'); await page.getByLabel('CPF', { exact: true }).fill('123.456.789-01'); await page.getByLabel('CEP', { exact: true }).fill('12345-678'); await page.getByLabel('Data de nascimento', { exact: true }).fill('1990-01-02');
}
test('WUX_ACCOUNT_01 account and personal stages provide mandatory summary before sending', async ({ page }) => {
  await page.goto('/cadastro'); await expect(page.getByRole('heading', { name: 'Conta', exact: true })).toBeVisible(); await expect(page.getByRole('list', { name: 'Etapas do cadastro' }).locator('[aria-current="step"]')).toHaveText('1. Conta');
  await account(page); await expect(page.getByRole('heading', { name: 'Dados pessoais', exact: true })).toBeVisible(); await personal(page);
  const summary = page.getByRole('region', { name: 'Confira os dados obrigatórios' }); await expect(summary).toContainText('Obrigatórios: e-mail, senha, nome, CPF, CEP e data de nascimento.'); await expect(summary).toContainText('Ana Sintética'); await expect(summary).toContainText('ana@example.test'); await expect(summary).not.toContainText('Senha123!');
  await page.getByRole('button', { name: 'Voltar para Conta' }).click(); await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('ana@example.test'); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); await expect(page.getByLabel('CPF', { exact: true })).toHaveValue('123.456.789-01');
});
test('WUX_ACCOUNT_02 registration gesture sends exact DTO once without fictitious values', async ({ page }) => {
  const writes: unknown[] = []; let finish!: () => void; const pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario`, async route => { writes.push(route.request().postDataJSON()); await pending; await route.fulfill({ status: 201, json: {} }); });
  await page.goto('/cadastro'); await account(page); await personal(page); await page.getByLabel('Sou cuidador').check(); await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Criando conta…', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Criando conta…', exact: true }).press('Enter');
  finish(); await expect(page).toHaveURL(/\/login$/); await expect(page.getByText('Cadastro concluído! Entre com seu e-mail e senha.', { exact: true })).toBeVisible();
  expect(writes).toEqual([{ nome: 'Ana Sintética', email: 'ana@example.test', senha: 'Senha123!', cpf: '12345678901', cep: '12345678', dataNasc: '1990-01-02', cuidador: true }]);
});
test('WUX_ACCOUNT_03 invalid CPF CEP and future birth date keep the stage and focus the indicated field', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-14T15:00:00Z')); await page.goto('/cadastro'); await account(page); await personal(page);
  for (const [field, invalid, valid, message] of [['CPF', '123', '12345678901', 'Informe um CPF com exatamente 11 dígitos.'], ['CEP', '123', '12345678', 'Informe um CEP com exatamente 8 dígitos.'], ['Data de nascimento', '2027-01-01', '1990-01-02', 'Informe uma data de nascimento válida que não esteja no futuro.']]) {
    await page.getByLabel(field, { exact: true }).fill(invalid); await page.getByRole('button', { name: 'Criar conta', exact: true }).click(); await expect(page.getByText(message, { exact: true })).toBeVisible(); await expect(page.getByLabel(field, { exact: true })).toBeFocused(); await expect(page.getByLabel(field, { exact: true })).toHaveAttribute('aria-invalid', 'true'); await page.getByLabel(field, { exact: true }).fill(valid);
  }
  await expect(page.getByRole('heading', { name: 'Dados pessoais', exact: true })).toBeVisible();
});
test('WUX_ACCOUNT_04 password visibility toggles accessibly without modifying either value', async ({ page }) => {
  await page.goto('/cadastro'); await page.getByLabel('Senha', { exact: true }).fill('Senha123!'); await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha123!');
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click(); await expect(page.getByRole('button', { name: 'Ocultar senha', exact: true })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text'); await expect(page.getByLabel('Confirmar senha', { exact: true })).toHaveValue('Senha123!');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click(); await expect(page.getByRole('button', { name: 'Mostrar senha', exact: true })).toHaveAttribute('aria-pressed', 'false'); await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password'); await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('Senha123!');
});
test('T42 server DTO messages remain visible and retry preserves personal values', async ({ page }) => {
  let fail = true;
  await page.route(`${PRODUCTION_API_ORIGIN}/usuario`, route => route.fulfill(fail ? { status: 400, json: { message: ['CPF já cadastrado', 'E-mail já cadastrado'] } } : { status: 201, json: {} }));
  await page.goto('/cadastro'); await account(page); await personal(page); await page.getByRole('button', { name: 'Criar conta', exact: true }).click(); const error = page.getByRole('alert').filter({ hasText: 'CPF já cadastrado' }); await expect(error).toContainText('E-mail já cadastrado'); await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Ana Sintética');
  fail = false; await page.getByRole('button', { name: 'Criar conta', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); await expect(page.getByText('Cadastro concluído! Entre com seu e-mail e senha.', { exact: true })).toBeVisible();
});
