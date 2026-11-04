import { test as base, expect } from "@playwright/test";

// Origem da API de produção codificada no frontend (src/app/utils/api.ts).
// Testes funcionais não podem alcançá-la: toda requisição não prevista é
// bloqueada e reprovada ao final do teste.
export const PRODUCTION_API_ORIGIN = "https://medreminder-backend.onrender.com";

type ApiGuard = {
  /** Requisições à API bloqueadas por não estarem previstas no teste. */
  unexpectedApiRequests: string[];
};

export const test = base.extend<{ apiGuard: ApiGuard }>({
  apiGuard: [
    async ({ context }, use) => {
      const unexpectedApiRequests: string[] = [];
      // Rotas mais recentes têm prioridade: um teste que prevê uma chamada
      // registra sua própria rota (page.route) por cima deste bloqueio.
      await context.route(`${PRODUCTION_API_ORIGIN}/**`, (route) => {
        const request = route.request();
        unexpectedApiRequests.push(`${request.method()} ${new URL(request.url()).pathname}`);
        return route.abort("blockedbyclient");
      });
      await use({ unexpectedApiRequests });
      expect(
        unexpectedApiRequests,
        "requisições à API não previstas (bloqueadas)",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
