import type { Page } from '@playwright/test';
import { PRODUCTION_API_ORIGIN } from './api-guard';

export const syntheticProfile = { id: 7, nome: 'Ana Sintética', email: 'ana@example.test', cpf: '12345678901', cep: '12345678', dataNasc: '1990-01-02', cuidador: false };
export async function prepareSession(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-14T15:00:00Z'));
  await page.addInitScript(profile => {
    localStorage.setItem('access_token', 'token-sintetico');
    localStorage.setItem('user_data', JSON.stringify(profile));
  }, syntheticProfile);
}
export function dose(id: number, at: string, name = 'Vitamina A', medicationId = 4, taken = false) {
  return { id, data_dose: at, tomado: taken, remedio: { id: medicationId, nome: name, quantidadeDose: '1,5 comprimidos', cor: '#0B6E71' } };
}
export async function routeReadApi(page: Page, rows: unknown[] = [], medications: unknown[] = []) {
  await page.route(`${PRODUCTION_API_ORIGIN}/**`, async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== 'GET') return route.fallback();
    if (path === '/usuario/me') return route.fulfill({ json: { data: syntheticProfile } });
    if (path === '/dose/me') return route.fulfill({ json: { data: rows } });
    if (path === '/remedio/me') return route.fulfill({ json: { data: medications } });
    return route.fallback();
  });
}
