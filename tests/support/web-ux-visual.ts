import type { Locator, Page } from '@playwright/test';
import { expect, PRODUCTION_API_ORIGIN } from './api-guard';
import { prepareSession, routeReadApi, dose, syntheticProfile } from './web-ux-routes';
export const visualMedication = { id: 17, nome: 'Vitamina Sintética', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-01-01', cor: 'Azul', motivo: 'Rotina', observacao: '', quantidadeDose: '1,5 comprimidos', unidadeMedida: 'comprimidos' };
export const visualRoutes = [['/', 'home'], ['/login', 'login'], ['/cadastro', 'signup'], ['/hoje', 'today'], ['/meus-medicamentos', 'medications'], ['/historico', 'history'], ['/Configuracoes', 'profile'], ['/novo-medicamento', 'wizard'], ['/meus-medicamentos/17/editar', 'edit'], ['/meus-lembretes', 'agenda']] as const;
export async function visualSetup(page: Page) {
  await prepareSession(page);
  await routeReadApi(page, [dose(31, '2026-11-14T08:00:00-03:00', visualMedication.nome, 17), dose(32, '2026-11-14T19:00:00-03:00', visualMedication.nome, 17)], [visualMedication]);
  await page.route('**/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv', route => route.fulfill({ contentType: 'text/csv', body: 'NOME_PRODUTO;DESCRIÇÃO\nVitamina Sintética;Suplemento\n' }));
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, route => route.request().method() === 'GET' ? route.fulfill({ json: { data: visualMedication } }) : route.fallback());
}
export async function openVisualRoute(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.getByText('Verificando sessão…', { exact: true })).toHaveCount(0);
  if (path === '/Configuracoes') await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(syntheticProfile.nome);
  if (path === '/' || path === '/novo-medicamento') {
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Carregando catálogo...' })).toHaveCount(0);
  }
  if (path === '/novo-medicamento') await expect(page.getByLabel('Nome do medicamento', { exact: true })).toBeVisible();
  if (path.includes('/17/')) await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(visualMedication.nome);
  if (path === '/meus-medicamentos') await expect(page.getByRole('article')).toHaveCount(1);
  if (path === '/hoje' || path === '/meus-lembretes' || path === '/historico') await expect(page.getByRole('article').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
export async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport); expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
}
// Exercise the later stages through their controls; no finished payload bypasses the forms.
export async function walkLaterForms(page: Page, inspect: (name: string) => Promise<void>) {
  await openVisualRoute(page, '/novo-medicamento');
  for (const [label, value] of [['Nome do medicamento', 'Vitamina Sintética'], ['Quantidade em estoque', '10'], ['Unidade do estoque', 'comprimidos'], ['Validade', '2027-01-01'], ['URL da foto', 'https://example.test/medication.png']]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('radio', { name: 'Azul', exact: true }).locator('..').click();
  await expect(page.getByRole('radio', { name: 'Azul', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('[aria-label="Etapa atual: Tratamento"]')).toBeFocused();
  for (const [label, value] of [['Quantidade por dose', '1,5'], ['Unidade por dose', 'mg'], ['Primeira dose', '2026-11-15T08:00'], ['Intervalo em horas', '6'], ['Duração', '1']]) await page.getByLabel(label, { exact: true }).fill(value);
  await inspect('treatment');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  const review = page.getByRole('region', { name: 'Revisão', exact: true });
  await expect(review).toContainText('Vitamina Sintética'); await expect(review).toContainText('4 doses');
  await page.getByRole('button', { name: 'Ver todos os horários', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ocultar horários', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const list = page.getByRole('list', { name: 'Horários previstos' });
  expect(await list.locator('time').evaluateAll(items => items.map(item => item.getAttribute('datetime')))).toEqual(['2026-11-15T11:00:00.000Z', '2026-11-15T17:00:00.000Z', '2026-11-15T23:00:00.000Z', '2026-11-16T05:00:00.000Z']);
  await inspect('review-expanded');
  await reachable(list.locator('li').last());
  await page.getByRole('button', { name: 'Editar tratamento', exact: true }).click();
  await expect(page.getByLabel('Primeira dose', { exact: true })).toHaveValue('2026-11-15T08:00');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina Sintética');
  await openVisualRoute(page, '/cadastro');
  for (const [label, value] of [['E-mail', 'ana@example.test'], ['Senha', 'Senha123!'], ['Confirmar senha', 'Senha123!']]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dados pessoais', exact: true })).toBeFocused();
  for (const [label, value] of [['Nome completo', 'Ana Sintética'], ['CPF', '12345678901'], ['CEP', '12345678'], ['Data de nascimento', '1990-01-02']]) await page.getByLabel(label, { exact: true }).fill(value);
  await expect(page.getByRole('region', { name: 'Confira os dados obrigatórios' })).toContainText('Ana Sintética');
  await inspect('personal');
  await page.getByRole('button', { name: 'Voltar para Conta', exact: true }).click();
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('ana@example.test');
}
export async function laterStageGeometry(page: Page, text200 = false) {
  await noHorizontalOverflow(page);
  const controls = page.locator('main input:not([type=radio]),main select,main textarea,main button');
  const targets = await controls.all(); expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    await expect(target).toBeVisible(); await expect(target).toBeEnabled(); await reachable(target);
    await expect(target).toBeInViewport({ ratio: 1 });
    if (text200) await expect(target).toHaveCSS('font-size', '32px');
  }
  for (const date of await page.locator('main input[type=date],main input[type=datetime-local]').all()) {
    await nativeDateGeometry(page, date, text200);
  }
  // Each real Tab stop in the stage must be reached by keyboard and remain unobscured.
  const seen = new Set<number>();
  await page.locator('main').evaluate(el => { el.setAttribute('tabindex', '-1'); (el as HTMLElement).focus(); });
  for (let tab = 0; tab < 60 && seen.size < targets.length; tab++) {
    await page.keyboard.press('Tab');
    for (let index = 0; index < targets.length; index++) if (await targets[index].evaluate(el => el === document.activeElement)) { seen.add(index); await reachable(targets[index]); }
  }
  expect(seen.size).toBe(targets.length);
  const clipped = await page.locator('main h2,main p,main label,main dt,main dd,main time').evaluateAll(elements => elements.filter(el => {
    const s = getComputedStyle(el); return s.visibility === 'hidden' || s.display === 'none' || (['hidden', 'clip'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1) || (['hidden', 'clip'].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1);
  }).map(el => el.textContent));
  expect(clipped).toEqual([]);
}
async function nativeDateGeometry(page: Page, input: Locator, text200: boolean) {
  // Chrome's closed native shadow tree exposes the actual painted segments through CDP.
  // Measuring those boxes avoids guessing text widths or requiring a particular row count.
  const cdp = await page.context().newCDPSession(page);
  try {
    type NativeNode = { nodeId: number; attributes?: string[]; children?: NativeNode[]; shadowRoots?: NativeNode[] };
    const nodes: NativeNode[] = [];
    function collect(node: NativeNode) { nodes.push(node); for (const child of [...node.children ?? [], ...node.shadowRoots ?? []]) collect(child); }
    collect((await cdp.send('DOM.getDocument', { depth: -1, pierce: true })).root);
    const id = await input.getAttribute('id'); expect(id).toBeTruthy();
    const host = nodes.find(node => node.attributes?.some((value, index, attrs) => value === 'id' && attrs[index + 1] === id))!;
    const inner: NativeNode[] = []; const collectInner = (node: NativeNode) => { inner.push(node); for (const child of node.children ?? []) collectInner(child); };
    for (const root of host.shadowRoots ?? []) collectInner(root);
    const fields = inner.filter(node => node.attributes?.includes('spinbutton'));
    expect(fields).toHaveLength(await input.getAttribute('type') === 'date' ? 3 : 5);
    const edit = inner.find(node => node.attributes?.includes('-webkit-datetime-edit'))!;
    const picker = inner.find(node => node.attributes?.includes('-webkit-calendar-picker-indicator'))!;
    expect(edit).toBeDefined(); expect(picker).toBeDefined();
    async function box(node: NativeNode) {
      const resolved = await cdp.send('DOM.resolveNode', { nodeId: node.nodeId });
      const result = await cdp.send('Runtime.callFunctionOn', { objectId: resolved.object.objectId!, functionDeclaration: 'function() { const r = this.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, font: getComputedStyle(this).fontSize }; }', returnByValue: true });
      return result.result.value as { left: number; right: number; top: number; bottom: number; width: number; height: number; font: string };
    }
    const hostBox = await box(host), editBox = await box(edit), pickerBox = await box(picker);
    for (const node of [...fields, picker]) {
      const part = await box(node); expect(part.width).toBeGreaterThan(0); expect(part.height).toBeGreaterThan(0);
      const container = node === picker ? hostBox : editBox;
      expect(part.left).toBeGreaterThanOrEqual(container.left); expect(part.right).toBeLessThanOrEqual(container.right);
      expect(part.top).toBeGreaterThanOrEqual(container.top); expect(part.bottom).toBeLessThanOrEqual(container.bottom);
      if (node !== picker) { expect(part.right <= pickerBox.left || part.left >= pickerBox.right || part.bottom <= pickerBox.top || part.top >= pickerBox.bottom).toBe(true); if (text200) expect(part.font).toBe('32px'); }
    }
  } finally { await cdp.detach(); }
}
export async function reachable(control: Locator) {
  await control.scrollIntoViewIfNeeded(); await expect(control).toBeVisible();
  const geometry = await control.evaluate(element => {
    const r = element.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { width: r.width, height: r.height, left: r.left, right: r.right, viewport: innerWidth, hit: !!hit && (element.contains(hit) || hit.contains(element)), clipped: element.scrollHeight > element.clientHeight + 1 && getComputedStyle(element).overflowY === 'hidden' };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.hit).toBe(true); expect(geometry.clipped).toBe(false);
}
export function contrastRatio(a: string, b: string) {
  const luminance = (color: string) => {
    const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
export async function pair(locator: Locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element); let ancestor: Element | null = element; let background = 'rgb(255, 255, 255)';
    while (ancestor) { const value = getComputedStyle(ancestor).backgroundColor; if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') { background = value; break; } ancestor = ancestor.parentElement; }
    return { foreground: style.color, background, font: parseFloat(style.fontSize), weight: Number(style.fontWeight), outline: style.outlineColor };
  });
}
