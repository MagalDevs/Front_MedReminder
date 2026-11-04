import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Isolamento entre testes (test-plan.md, "Fixtures and Isolation"):
// nenhuma chamada de rede real, nenhum estado de storage, timer ou mock
// vaza de um caso para outro.

beforeEach(() => {
  // Fetch global rejeita tudo o que o teste não simulou explicitamente.
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const method =
        init?.method ?? (input instanceof Request ? input.method : "GET");
      const target =
        input instanceof Request ? input.url : String(input);
      return Promise.reject(
        new Error(`Fetch não simulado: ${method} ${target}`),
      );
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
