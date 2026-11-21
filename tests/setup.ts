import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";

beforeAll(() => {
  if (typeof HTMLDialogElement === "undefined") return;
  const prototype = HTMLDialogElement.prototype;
  if (typeof prototype.showModal === "function") return;
  // Focus and top-layer behavior are covered in the browser suite.
  Object.defineProperties(prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  return () => {
    Reflect.deleteProperty(prototype, "showModal");
    Reflect.deleteProperty(prototype, "close");
  };
});

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
