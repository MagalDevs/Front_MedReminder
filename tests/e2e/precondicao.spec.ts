import { expect, test } from "../support/e2e";

// Pré-condição dos testes E2E reais. Verifica somente a configuração
// (E2E_API_URL isolada e diferente de produção); NÃO prova persistência nem
// isolamento A/B, que pertencem aos casos E2E-01 a E2E-05 do test-plan.
test("pré-condição E2E: API isolada configurada", async ({ isolatedApiUrl }) => {
  expect(isolatedApiUrl).toMatch(/^https?:\/\//);
});
