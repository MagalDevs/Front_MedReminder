import { expect, test } from "../support/api-guard";

// Smoke de infraestrutura (T5): o build de produção sobe na porta 3001 e a
// página inicial carrega no Chromium sem alcançar a API. Não cobre fluxo de produto.
//
// Achado preexistente, deliberadamente não afirmado aqui: sem sessão, a página
// emite "Authentication required but no token found" como erro não tratado
// (LembreteProvider consulta rota privada no mount; ver FE-03/FE-05). A
// caracterização desse comportamento pertence às tarefas T8/T12/T13.
test("smoke: a página inicial carrega sem requisições à API", async ({ page, apiGuard }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  // Sem sessão a aplicação pode permanecer em "/" ou redirecionar para "/login".
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/(login)?$/);
  expect(apiGuard.unexpectedApiRequests).toEqual([]);
});
