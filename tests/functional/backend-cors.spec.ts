import { createServer, type Server } from 'node:http';
import { expect, test } from '@playwright/test';
import { backendEnvironment } from '../support/backend-environment';

// Nunca interceptar a API: route.fulfill pode injetar CORS e dar falso positivo.
test.describe('BEAPI-10 CORS real isolado', () => {
  test.beforeEach(() => { backendEnvironment(); });

  test('origem permitida lê 401 sem Bearer e com Bearer inválido', async ({ page }) => {
    const { api } = backendEnvironment();
    await page.goto('/login');
    for (const token of ['', 'token-invalido-sintetico']) {
      const status = await page.evaluate(async ({ api, token }) => {
        const response = await fetch(`${api}/usuario/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return response.status;
      }, { api, token });
      expect(status).toBe(401);
    }
  });

  test('preflight permite Authorization Content-Type e Idempotency-Key', async ({ page, request, baseURL }) => {
    const { api } = backendEnvironment();
    const response = await request.fetch(`${api}/tratamento`, {
      method: 'OPTIONS', headers: { Origin: String(baseURL), 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,idempotency-key' },
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['access-control-allow-origin']).toBe(baseURL);
    const allowed = response.headers()['access-control-allow-headers'].toLowerCase();
    for (const header of ['authorization', 'content-type', 'idempotency-key']) expect(allowed).toContain(header);
    await page.goto('/login');
    const status = await page.evaluate(async (api) => (await fetch(`${api}/tratamento`, {
      method: 'POST', headers: { Authorization: 'Bearer token-invalido-sintetico', 'Content-Type': 'application/json', 'Idempotency-Key': 'cors-sintetico' }, body: '{}',
    })).status, api);
    expect(status).toBe(401);
  });

  test('origem não permitida é bloqueada pelo navegador', async ({ page }) => {
    const { api } = backendEnvironment();
    const server: Server = createServer((_request, response) => {
      response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Origem sintética negada</title>');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Origem de teste indisponível');
      await page.goto(`http://127.0.0.1:${address.port}`);
      const blocked = await page.evaluate(async (api) => {
        try { await fetch(`${api}/usuario/me`, { headers: { Authorization: 'Bearer token-invalido-sintetico' } }); return false; }
        catch { return true; }
      }, api);
      expect(blocked).toBe(true);
    } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
  });

  test('limite de login expõe Retry-After ao JavaScript', async ({ page }) => {
    const { api } = backendEnvironment();
    await page.goto('/login');
    const result = await page.evaluate(async (api) => {
      for (let i = 0; i < 30; i++) {
        const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cors-limit@example.test', senha: 'SenhaInvalida1!' }) });
        if (response.status === 429) return { status: response.status, retryAfter: response.headers.get('Retry-After') };
      }
      return { status: 0, retryAfter: null };
    }, api);
    expect(result.status, 'Configure o limite de login isolado para produzir 429 em até 30 tentativas sintéticas').toBe(429);
    expect(result.retryAfter).toBeTruthy();
  });
});
