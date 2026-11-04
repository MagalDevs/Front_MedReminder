import { test as base, expect } from "@playwright/test";
import { PRODUCTION_API_ORIGIN } from "./api-guard";

/**
 * Pré-condição dos testes E2E: uma API isolada, informada em E2E_API_URL.
 * Sem ela (ou apontando para produção) o teste FALHA com "BLOQUEADO"; não é
 * pulado, e um caso BLOQUEADO nunca conta como aprovado (TEST-04).
 */
export function resolveIsolatedApiUrl(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.E2E_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "BLOQUEADO: E2E_API_URL não definida. Os testes E2E exigem uma API isolada (não produção) com dados sintéticos.",
    );
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("BLOQUEADO: E2E_API_URL não é uma URL válida.");
  }
  if (url.origin === PRODUCTION_API_ORIGIN) {
    throw new Error(
      "BLOQUEADO: E2E_API_URL aponta para a API de produção; use um ambiente isolado.",
    );
  }
  return url.origin;
}

export const test = base.extend<{ isolatedApiUrl: string }>({
  isolatedApiUrl: [
    async ({}, use) => {
      await use(resolveIsolatedApiUrl());
    },
    { auto: true },
  ],
});

export { expect };
