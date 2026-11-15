import type { Locator, Page } from '@playwright/test';
import { expect, PRODUCTION_API_ORIGIN } from './api-guard';
import { prepareSession, routeReadApi, dose } from './web-ux-routes';
export const visualMedication = { id: 17, nome: 'Vitamina Sintética', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-01-01', cor: 'Azul', motivo: 'Rotina', observacao: '', quantidadeDose: '1,5 mg', unidadeMedida: 'comprimidos' };
export const visualRoutes = [['/', 'home'], ['/login', 'login'], ['/cadastro', 'signup'], ['/hoje', 'today'], ['/meus-medicamentos', 'medications'], ['/historico', 'history'], ['/Configuracoes', 'profile'], ['/novo-medicamento', 'wizard'], ['/meus-medicamentos/17/editar', 'edit'], ['/meus-lembretes', 'agenda']] as const;
export async function visualSetup(page: Page) {
  await prepareSession(page);
  await routeReadApi(page, [dose(31, '2026-11-14T08:00:00-03:00', visualMedication.nome, 17), dose(32, '2026-11-14T19:00:00-03:00', visualMedication.nome, 17)], [visualMedication]);
  await page.route('**/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv', route => route.fulfill({ contentType: 'text/csv', body: 'NOME_PRODUTO;DESCRIÇÃO\nVitamina Sintética;Suplemento\n' }));
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`, route => route.request().method() === 'GET' ? route.fulfill({ json: { data: visualMedication } }) : route.fallback());
}
export async function openVisualRoute(page: Page, path: string) {
  await page.goto(path); await expect(page.locator('h1').first()).toBeVisible(); await page.evaluate(() => document.fonts.ready);
  if (path.includes('/17/')) await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(visualMedication.nome);
  if (path === '/meus-medicamentos') await expect(page.getByRole('article')).toHaveCount(1);
  if (path === '/hoje' || path === '/meus-lembretes' || path === '/historico') await expect(page.getByRole('article').first()).toBeVisible();
}
export async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport); expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
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
