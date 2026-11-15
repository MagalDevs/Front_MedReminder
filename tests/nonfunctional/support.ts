import type { Page, TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cpus, totalmem, platform, release } from 'node:os';
import { execFileSync } from 'node:child_process';
export { test, expect } from '../support/api-guard';
import { PRODUCTION_API_ORIGIN } from '../support/api-guard';

export const NOW = '2026-11-04T12:00:00-03:00';
export const TOKEN = 'NF_TOKEN_SYNTHETIC';
export const USER = { id: 7, nome: 'Pessoa NF Sintética', email: 'nf@example.test' };
export const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
let browserVersion = 'not initialized';
const targetApiOrigin = process.env.NF_API_ORIGIN || PRODUCTION_API_ORIGIN;

export function medicine(id: number) {
  return { id, nome: `Medicamento NF ${id}`, classificacao: 'Sintético', quantidadeDiaria: 1,
    quantidadeCaixa: 30, horaInicio: '2026-11-04T11:00:00Z', cor: 'Azul', unidadeMedida: 'mg',
    motivo: 'Fixture', quantidadeDias: 1, dataValidade: '2027-01-01T00:00:00Z', foto: null,
    observacao: '', quantidadeDose: '1 comp', usuarioId: USER.id };
}

/** Only explicit GET fixtures are handled; every unexpected request falls through to the API guard. */
export async function setup(page: Page, volume = 0, authenticated = true, ownContext = false) {
  browserVersion = page.context().browser()?.version() ?? 'unavailable';
  const unexpected: string[] = [];
  if (ownContext) await page.context().route(`${targetApiOrigin}/**`, async route => {
    unexpected.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    await route.abort('blockedbyclient');
  });
  await page.clock.setFixedTime(new Date(NOW));
  if (authenticated) await page.addInitScript(({ token, user }) => {
    if (!sessionStorage.getItem('__nf_seeded')) {
      sessionStorage.setItem('__nf_seeded', '1');
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  }, { token: TOKEN, user: USER });
  const medicines = Array.from({ length: volume }, (_, i) => medicine(i + 1));
  const doses = medicines.map(remedio => ({ id: remedio.id, remedioId: remedio.id,
    usuarioId: USER.id, remedio, tomado: remedio.id % 2 === 0, data_dose: '2026-11-04T11:00:00-03:00' }));
  await page.route(`${targetApiOrigin}/**`, async route => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const path = new URL(req.url()).pathname;
    if (req.method() !== 'GET' || !['/usuario/me', '/dose/me', '/remedio/me'].includes(path)) return route.fallback();
    const data = path === '/usuario/me' ? USER : path === '/dose/me' ? doses : medicines;
    return route.fulfill({ headers: CORS, json: { message: 'Fixture local', data } });
  });
  return unexpected;
}

export function summary(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples, median: sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] :
    (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
    p95NearestRank: sorted[Math.ceil(sorted.length * .95) - 1], maximum: sorted[sorted.length - 1] };
}

export async function evidence(info: TestInfo, name: string, result: unknown) {
  const fileName = process.env.NF_EVIDENCE_PREFIX ? `${process.env.NF_EVIDENCE_PREFIX}-${name}` : name;
  const record = { measuredAt: new Date().toISOString(), frontendCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    measuredBuildCommit: process.env.NF_BUILD_COMMIT || 'current working tree',
    workingTree: 'May contain integration changes; git diff identifies final revision', node: process.version,
    browser: info.project.use.browserName ?? 'chromium', browserVersion, os: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model, memoryBytes: totalmem(), timezone: 'America/Sao_Paulo',
    boundary: 'Local Chromium, production Next build, intercepted synthetic API; no real backend or cloud capacity claim', result };
  const serialized = JSON.stringify(record, null, 2) + '\n';
  const directory = join(process.cwd(), 'docs/evidencias/2026-11-04/nonfunctional');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${fileName}.json`), serialized);
  await info.attach(name, { body: serialized, contentType: 'application/json' });
}
