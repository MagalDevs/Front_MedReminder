import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

// Teste sentinela da infraestrutura (T4). Não conta como cobertura funcional.
describe("infra: Vitest isolation", () => {
  it("resolve o alias @/ para src", async () => {
    const api = await import("@/app/utils/api");
    expect(typeof api.apiRequest).toBe("function");
  });

  it("usa jsdom e os matchers do jest-dom com cleanup do RTL", () => {
    render(createElement("p", null, "olá infra"));
    expect(screen.getByText("olá infra")).toBeInTheDocument();
  });

  it("rejeita fetch não simulado", async () => {
    await expect(fetch("https://exemplo.invalid/rota")).rejects.toThrow(
      "Fetch não simulado: GET https://exemplo.invalid/rota",
    );
  });

  it("deixa o storage e o DOM limpos após o teste anterior", () => {
    // O teste de jsdom acima renderizou um <p>; o cleanup do RTL o removeu.
    expect(screen.queryByText("olá infra")).not.toBeInTheDocument();
    window.localStorage.setItem("chave", "valor");
    expect(window.localStorage.getItem("chave")).toBe("valor");
  });

  it("restaura o storage entre testes", () => {
    expect(window.localStorage.getItem("chave")).toBeNull();
  });

  it("restaura relógio falso e fetch simulado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T12:00:00-03:00"));
    expect(new Date().toISOString()).toBe("2026-11-04T15:00:00.000Z");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("volta ao relógio real e ao fetch bloqueado depois do teste anterior", async () => {
    expect(vi.isFakeTimers()).toBe(false);
    await expect(fetch("/x")).rejects.toThrow("Fetch não simulado");
  });

  it("usa o fuso America/Sao_Paulo", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
      "America/Sao_Paulo",
    );
  });
});
