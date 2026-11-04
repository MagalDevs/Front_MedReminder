import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigurarLembrete, { validarLoteTratamento } from "@/app/components/CardCadastrar/cardCadastrar";
import { LembreteContext } from "@/app/contexts/lembreteContext";
import {
  treatmentResponseFixture, treatmentRequestFixture, documentedTreatmentIssues,
  type TreatmentRequest,
} from "../fixtures/backend-contracts";

const { auth } = vi.hoisted(() => ({
  auth: { user: { id: 101, email: "ana@example.test" }, isAuthenticated: true },
}));
vi.mock("@/app/contexts/AuthContext", () => ({ useAuth: () => auth }));

const SUCESSO = "Lembrete e doses salvos com sucesso!";
const CORRIJA = "Por favor, corrija os erros no formulário";
const posts: { url: string; payload: TreatmentRequest; headers: Headers }[] = [];
const recarregar = vi.fn(async () => undefined);
let comportamento: "ok" | "rede" | 409 | 503 | "incompleto" = "ok";

function montar() {
  const view = render(
    <LembreteContext.Provider value={{
      lembretes: [], lembretesHoje: [], getLembretes: recarregar,
    }}>
      <ConfigurarLembrete medicamentoSelecionado={{ nome: "Dipirona", tipo: "Analgésico" }} />
    </LembreteContext.Provider>,
  );
  const mudar = (elemento: Element, value: string) => fireEvent.change(elemento, { target: { value } });
  mudar(screen.getByPlaceholderText("500"), "500");
  mudar(screen.getByPlaceholderText("30"), "30");
  mudar(screen.getByPlaceholderText("6 (horas)"), "24");
  mudar(screen.getByPlaceholderText("7"), "1");
  const datas = view.container.querySelectorAll('input[type="date"]');
  mudar(datas[0], "2027-12-31");
  mudar(datas[1], "2026-11-04");
  mudar(view.container.querySelector('input[type="time"]')!, "22:00");
  return { ...view, mudar, datas };
}
const salvar = () => fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));
const aguardarFalha = async () => {
  await waitFor(() => expect(window.alert).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled());
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-04T12:00:00-03:00"));
  auth.user = { id: 101, email: "ana@example.test" };
  auth.isAuthenticated = true;
  posts.length = 0;
  recarregar.mockClear();
  comportamento = "ok";
  localStorage.setItem("access_token", "token-sintetico");
  vi.spyOn(window, "alert").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const payload = JSON.parse(init.body as string) as TreatmentRequest;
    posts.push({ url, payload, headers: new Headers(init.headers) });
    if (comportamento === "rede") throw new TypeError("Failed to fetch");
    const status = typeof comportamento === "number" ? comportamento : 201;
    const response = status >= 400 ? { message: "Mensagem sem código de status" }
      : comportamento === "incompleto" ? { message: "Criado", data: { remedio: { id: 77 } } }
      : {
        ...treatmentResponseFixture,
        data: { remedio: { ...payload.remedio, id: 77 }, doses: payload.doses.map((data_dose, i) => ({ id: i + 1, data_dose })) },
      };
    return new Response(JSON.stringify(response), { status, headers: { "content-type": "application/json" } });
  }));
});

describe("BEAPI-08 fronteiras antes de qualquer envio", () => {
  it.each([null, ""])("BEAPI-08 validade %j bloqueia o envio", async (validade) => {
    // Null is the initial state; empty is a date explicitly cleared by the user.
    if (validade === null) {
      render(<ConfigurarLembrete medicamentoSelecionado={{ nome: "Dipirona", tipo: "" }} />);
    } else {
      const { mudar, datas } = montar();
      mudar(datas[0], validade);
    }
    salvar();
    expect(await screen.findByText("Data de validade é obrigatória")).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(CORRIJA);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("BEAPI-08 zero doses bloqueia o envio e o validador rejeita lote vazio", () => {
    const { mudar } = montar();
    mudar(screen.getByPlaceholderText("7"), "0");
    salvar();
    expect(validarLoteTratamento("2027-12-31", [])).toHaveProperty("horario");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("BEAPI-08 1001 doses bloqueiam toda a mutação sem fragmentar", () => {
    const { mudar } = montar();
    mudar(screen.getByPlaceholderText("7"), "1001");
    salvar();
    expect(screen.getByText("O tratamento deve conter entre 1 e 1000 doses")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([1, 1000])("BEAPI-08 %i doses válidas enviam um único lote", async (count) => {
    const { mudar } = montar();
    mudar(screen.getByPlaceholderText("7"), String(count));
    salvar();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(SUCESSO));
    expect(posts).toHaveLength(1);
    expect(posts[0].payload.doses).toHaveLength(count);
    expect(posts[0].payload.doses[0]).toBe("2026-11-05T01:00:00.000Z");
    expect(new Set(posts[0].payload.doses).size).toBe(count);
    expect(documentedTreatmentIssues(posts[0].payload, { "Idempotency-Key": posts[0].headers.get("Idempotency-Key")! })).toEqual([]);
  });

  it.each([
    ["2026-11-04T15:00:00Z", "2026-11-04T15:00:00Z"],
    ["2026-11-04T12:00:00-03:00", "2026-11-04T15:00:00Z"],
    ["2026-11-04T16:00:00+01:00", "2026-11-04T12:00:00-03:00"],
  ])("BEAPI-08 duplicidade por instante %s e %s é rejeitada", (a, b) => {
    expect(validarLoteTratamento("2027-12-31", [a, b])).toEqual({ horario: "Os horários das doses não podem se repetir" });
  });

  it.each(["2026-02-30T12:00:00-03:00", "não é uma data", "2026-11-04T24:00:00Z", "2026-11-04T12:00:00"])(
    "BEAPI-08 data de dose inválida %s é rejeitada", (dose) => {
      expect(validarLoteTratamento("2027-12-31", [dose])).toHaveProperty("horario", "Data ou horário da dose inválido");
    },
  );

  it.each([0, 1])("BEAPI-08 data inválida no campo %i bloqueia envio sem normalizar calendário", (index) => {
    const { mudar, datas } = montar();
    // jsdom's date input sanitizes invalid strings; text allows testing the defensive boundary.
    datas[index].setAttribute("type", "text");
    mudar(datas[index], "2026-02-30");
    salvar();
    expect(screen.getByText(index === 0 ? "Data de validade inválida" : "Data ou horário da primeira dose inválido")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("BEAPI-08 ISO com offsets distintos preserva instantes válidos diferentes", () => {
    expect(validarLoteTratamento(treatmentRequestFixture.remedio.dataValidade, [
      "2026-11-04T12:00:00-03:00", "2026-11-04T12:00:00+01:00",
    ])).toEqual({});
  });
});

describe("BEAPI-07 BEAPI-08 operação atômica idempotente", () => {
  it("BEAPI-07 payload remedio+doses e header UUID com Bearer; sucesso confirmado limpa e recarrega", async () => {
    const uuid = vi.spyOn(crypto, "randomUUID");
    montar();
    salvar();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(SUCESSO));
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toMatch(/\/tratamento$/);
    expect(Object.keys(posts[0].payload)).toEqual(["remedio", "doses"]);
    expect(posts[0].payload.remedio).toMatchObject({ quantidadeDiaria: 24, quantidadeDias: 1, dataValidade: "2027-12-31", horaInicio: "2026-11-05T01:00:00.000Z" });
    expect(posts[0].payload.doses).toEqual(["2026-11-05T01:00:00.000Z"]);
    expect(posts[0].headers.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/i);
    expect(uuid).toHaveBeenCalledTimes(1);
    expect(posts[0].headers.get("Authorization")).toBe("Bearer token-sintetico");
    expect(posts[0].headers.get("Content-Type")).toBe("application/json");
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText("Dipirona")).toHaveValue("");
  });

  it("BEAPI-07 resposta incerta não faz retry automático e reenvio explícito conserva corpo e chave", async () => {
    comportamento = "rede";
    montar();
    salvar();
    await aguardarFalha();
    expect(posts).toHaveLength(1);
    expect(recarregar).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalledWith(SUCESSO);
    comportamento = "ok";
    salvar();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(SUCESSO));
    expect(posts).toHaveLength(2);
    expect(posts[1].payload).toEqual(posts[0].payload);
    expect(posts[1].headers.get("Idempotency-Key")).toBe(posts[0].headers.get("Idempotency-Key"));
  });

  it("BEAPI-07 conteúdo alterado após resposta incerta exige nova chave", async () => {
    comportamento = "rede";
    const { mudar } = montar();
    salvar();
    await aguardarFalha();
    mudar(screen.getByPlaceholderText("Tomar após as refeições"), "Observação alterada");
    salvar();
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].headers.get("Idempotency-Key")).not.toBe(posts[0].headers.get("Idempotency-Key"));
    expect(posts[1].payload).not.toEqual(posts[0].payload);
    await aguardarFalha();
  });

  it("BEAPI-07 outra conta nunca reutiliza chave mesmo com conteúdo idêntico", async () => {
    comportamento = "rede";
    montar();
    salvar();
    await aguardarFalha();
    auth.user = { id: 202, email: "bia@example.test" };
    // An edit re-renders the real form, as an AuthProvider update would.
    fireEvent.change(screen.getByPlaceholderText("500"), { target: { value: "500.0" } });
    fireEvent.change(screen.getByPlaceholderText("500"), { target: { value: "500" } });
    salvar();
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].payload).toEqual(posts[0].payload);
    expect(posts[1].headers.get("Idempotency-Key")).not.toBe(posts[0].headers.get("Idempotency-Key"));
    await aguardarFalha();
  });

  it.each([
    [409, "Conflito ao salvar o tratamento. Verifique os dados antes de tentar novamente."],
    [503, "Serviço indisponível. Tente novamente mais tarde."],
  ] as const)("BEAPI-07 status %i via ApiError não confirma sucesso nem recarrega", async (status, message) => {
    comportamento = status;
    montar();
    salvar();
    await aguardarFalha();
    expect(window.alert).toHaveBeenCalledWith(message);
    expect(window.alert).not.toHaveBeenCalledWith(SUCESSO);
    expect(posts).toHaveLength(1);
    expect(recarregar).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("500")).toHaveValue(500);
    salvar();
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].headers.get("Idempotency-Key")).toBe(posts[0].headers.get("Idempotency-Key"));
    await aguardarFalha();
  });

  it("BEAPI-07 envelope incompleto é resposta incerta e permite reenvio da mesma chave", async () => {
    comportamento = "incompleto";
    montar();
    salvar();
    await aguardarFalha();
    expect(window.alert).not.toHaveBeenCalledWith(SUCESSO);
    expect(recarregar).not.toHaveBeenCalled();
    comportamento = "ok";
    salvar();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(SUCESSO));
    expect(posts[1].headers.get("Idempotency-Key")).toBe(posts[0].headers.get("Idempotency-Key"));
  });
});

it.each(['logout', 'other-account'])('BEAPI-07 resposta pendente apos %s nao confirma nem limpa formulario', async change => {
  const original = vi.mocked(fetch).getMockImplementation()!;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  vi.mocked(fetch).mockImplementation(async (...args) => {
    const response = await original(...args);
    await gate;
    return response;
  });
  montar(); salvar(); await waitFor(() => expect(posts).toHaveLength(1));
  if (change === 'logout') { auth.isAuthenticated = false; localStorage.removeItem('access_token'); }
  else { auth.user = { id: 202, email: 'bia@example.test' }; localStorage.setItem('access_token', 'token-b'); }
  fireEvent.change(screen.getByPlaceholderText('Tomar após as refeições'), { target: { value: 'New account draft' } });
  await act(async () => { release(); });
  expect(window.alert).not.toHaveBeenCalledWith(SUCESSO);
  expect(recarregar).not.toHaveBeenCalled();
  expect(screen.getByPlaceholderText('Dipirona')).toHaveValue('Dipirona');
});
