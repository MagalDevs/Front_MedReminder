import {
  act,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AlertaLembretes from "@/app/components/AlarmeDose/AlertaLembrete";
import Lembrete from "@/app/components/AlarmeDose/Lembrete";
import {
  LembreteContext,
  LembreteProvider,
} from "@/app/contexts/lembreteContext";
import MeusLembretesContent from "@/app/meus-lembretes/MeusLembretesContent";
import { API_URL } from "@/app/utils/api";

// T12 (TEST-01, TEST-02): provider, lista, filtros, alerta e confirmação de dose
// com o cliente HTTP real (src/app/utils/api.ts). Só a fronteira `fetch` é
// simulada, com dados sintéticos e relógio fixo em 2026-11-04T12:00:00-03:00
// (fuso America/Sao_Paulo, definido em vitest.config.mts).

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const AGORA = new Date("2026-11-04T12:00:00-03:00");
const TOKEN = "token-sintetico";

// ---------------------------------------------------------------------------
// Fixtures sintéticas e API simulada
// ---------------------------------------------------------------------------

interface DoseFixture {
  id: number;
  tomado: boolean;
  data_dose: string;
  usuarioId: number;
  remedioId: number;
  remedio: Record<string, unknown>;
}

function makeDose(opts: {
  id: number;
  remedioId: number;
  nome: string;
  data_dose: string;
  tomado?: boolean;
  cor?: string;
}): DoseFixture {
  return {
    id: opts.id,
    tomado: opts.tomado ?? false,
    data_dose: opts.data_dose,
    usuarioId: 1,
    remedioId: opts.remedioId,
    remedio: {
      id: opts.remedioId,
      nome: opts.nome,
      classificacao: "Analgésico",
      quantidadeDiaria: 2,
      quantidadeCaixa: 20,
      horaInicio: "08:00",
      cor: opts.cor ?? "Azul",
      unidadeMedida: "comprimido",
      motivo: "Teste",
      quantidadeDias: 10,
      dataValidade: "2027-01-01",
      observacao: "",
      // Identifica o cartão da dose na lista (valor único por dose).
      quantidadeDose: `dose-${opts.id}`,
      usuarioId: 1,
    },
  };
}

const MEDICAMENTOS = [
  { id: 1, nome: "Alfa" },
  { id: 2, nome: "Beta" },
];

interface Call {
  method: string;
  path: string;
  url: string;
  headers: Headers;
  body: string | undefined;
}

interface FakeApi {
  doses: DoseFixture[];
  calls: Call[];
  /** Ordem dos eventos de rede, no formato "METODO /caminho". */
  events: string[];
  /** Se definido, o PUT responde com este erro. */
  putError?: { status: number; message: string };
  /** Se definido, GET remedio/me responde com este status. */
  remedioStatus?: number;
  /** Se definido, o PUT só responde depois de esta promessa resolver. */
  putGate?: Promise<void>;
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => structuredClone(body),
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function installApi(doses: DoseFixture[]): FakeApi {
  const api: FakeApi = { doses, calls: [], events: [] };

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const path = new URL(url).pathname;
      const body = typeof init?.body === "string" ? init.body : undefined;
      api.calls.push({ method, path, url, headers: new Headers(init?.headers), body });
      api.events.push(`${method} ${path}`);

      if (method === "GET" && path === "/dose/me") {
        return jsonResponse(200, { message: "ok", data: api.doses });
      }
      if (method === "GET" && path === "/remedio/me") {
        if (api.remedioStatus) {
          return jsonResponse(api.remedioStatus, { message: "Falha remedio" });
        }
        return jsonResponse(200, { message: "ok", data: MEDICAMENTOS });
      }
      const put = /^\/dose\/(\d+)$/.exec(path);
      if (method === "PUT" && put) {
        if (api.putGate) await api.putGate;
        if (api.putError) {
          return jsonResponse(api.putError.status, {
            message: api.putError.message,
          });
        }
        const dose = api.doses.find((d) => d.id === Number(put[1]));
        if (dose) dose.tomado = true;
        return jsonResponse(200, { message: "ok", data: dose });
      }
      throw new Error(`Fetch não simulado: ${method} ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return api;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Avança o relógio falso e libera microtasks dentro de act(). */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function pathsOf(api: FakeApi, method: string, path: string) {
  return api.calls.filter((c) => c.method === method && c.path === path);
}

beforeEach(() => {
  window.localStorage.setItem("access_token", TOKEN);
  // Os componentes e o cliente registram logs a cada chamada; não são o objeto
  // dos testes.
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

/** Relógio apenas de Date: timers reais mantêm waitFor/userEvent funcionando. */
function useFixedDate() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
}

/** Relógio completo: setTimeout controlado pelo teste. */
function useFakeClock() {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
}

// ---------------------------------------------------------------------------
// UT-11 - lembretesHoje (contexts/lembreteContext.tsx:64-74)
// ---------------------------------------------------------------------------

function Sonda() {
  const ctx = useContext(LembreteContext);
  return (
    <ul>
      {(ctx?.lembretesHoje ?? []).map((l) => (
        <li key={l.id} data-testid="hoje">
          {l.id}
        </li>
      ))}
      <li data-testid="total">{ctx?.lembretes.length ?? -1}</li>
    </ul>
  );
}

describe("UT-11 TEST-01: lembretesHoje entre agora e o fim do dia", () => {
  it("UT-11 TEST-01: exclui 11:59:59.999 e o dia seguinte; inclui 12:00 e 23:59:59.999", async () => {
    useFixedDate();
    installApi([
      makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T11:59:59.999-03:00" }),
      makeDose({ id: 2, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:00:00.000-03:00" }),
      makeDose({ id: 3, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T23:59:59.999-03:00" }),
      makeDose({ id: 4, remedioId: 1, nome: "Alfa", data_dose: "2026-11-05T00:00:00.000-03:00" }),
    ]);

    render(
      <LembreteProvider>
        <Sonda />
      </LembreteProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("total")).toHaveTextContent("4"),
    );
    const ids = screen.getAllByTestId("hoje").map((el) => el.textContent);
    expect(ids).toEqual(["2", "3"]);
  });

  it("UT-11 TEST-01: lembretesHoje não exclui dose já tomada (comportamento atual do filtro)", async () => {
    useFixedDate();
    installApi([
      makeDose({
        id: 1,
        remedioId: 1,
        nome: "Alfa",
        data_dose: "2026-11-04T13:00:00-03:00",
        tomado: true,
      }),
    ]);

    render(
      <LembreteProvider>
        <Sonda />
      </LembreteProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("total")).toHaveTextContent("1"),
    );
    // Caracterização do filtro por horário: tomado não é considerado.
    expect(screen.getAllByTestId("hoje")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// IT-06 - Lembrete.tsx: Medicamento Tomado (Lembrete.tsx:45-58)
// ---------------------------------------------------------------------------

describe("IT-06 TEST-01 TEST-02: confirmação de dose no alerta", () => {
  it("IT-06 TEST-01: envia exatamente {tomado:true} ao ID, reconsulta e só então fecha", async () => {
    useFixedDate();
    const user = userEvent.setup();
    const api = installApi([
      makeDose({ id: 7, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:30:00-03:00" }),
    ]);
    const gate = deferred();
    api.putGate = gate.promise;
    const onClose = vi.fn(() => {
      api.events.push("onClose");
    });

    render(
      <LembreteProvider>
        <Lembrete
          id={7}
          dataHora="2026-11-04T12:30:00-03:00"
          medicamentoNome="Alfa"
          quantidadeDose="1 comprimido"
          cor="Azul"
          onClose={onClose}
        />
      </LembreteProvider>,
    );

    // Provider faz a carga inicial.
    await waitFor(() => expect(pathsOf(api, "GET", "/dose/me")).toHaveLength(1));
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getByText("1 comprimido")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Medicamento Tomado" }));

    // PUT enviado, ainda sem resposta: nada de reconsulta nem de fechar.
    await waitFor(() => expect(pathsOf(api, "PUT", "/dose/7")).toHaveLength(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(pathsOf(api, "GET", "/dose/me")).toHaveLength(1);

    gate.resolve();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    const [put] = pathsOf(api, "PUT", "/dose/7");
    expect(put.url).toBe(`${API_URL}/dose/7`);
    expect(JSON.parse(put.body ?? "null")).toEqual({ tomado: true });
    expect(put.body).toBe('{"tomado":true}');
    expect(put.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(put.headers.get("Content-Type")).toBe("application/json");

    // Ordem: carga inicial, PUT, nova consulta, depois fecha.
    expect(api.events).toEqual([
      "GET /dose/me",
      "PUT /dose/7",
      "GET /dose/me",
      "onClose",
    ]);
  });

  it("IT-06 TEST-02: alerta no horário da dose; Medicamento Tomado atualiza e fecha o alerta", async () => {
    useFakeClock();
    const api = installApi([
      makeDose({ id: 9, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T12:30:00-03:00" }),
    ]);
    const gate = deferred();
    api.putGate = gate.promise;

    try {
      render(
        <LembreteProvider>
          <AlertaLembretes />
        </LembreteProvider>,
      );
      await advance(0);
      expect(screen.queryByText("Hora do Medicamento!")).not.toBeInTheDocument();

      // 11 min antes: ainda não; no horário exato: alerta.
      await advance(29 * 60_000 + 59_999);
      expect(screen.queryByText("Hora do Medicamento!")).not.toBeInTheDocument();
      await advance(1);
      expect(screen.getByText("Hora do Medicamento!")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
      expect(screen.getByText("dose-9")).toBeInTheDocument();

      // Clique; o PUT ainda não respondeu: o alerta continua aberto.
      act(() => {
        screen.getByRole("button", { name: "Medicamento Tomado" }).click();
      });
      await advance(0);
      expect(pathsOf(api, "PUT", "/dose/9")).toHaveLength(1);
      expect(screen.getByText("Hora do Medicamento!")).toBeInTheDocument();

      gate.resolve();
      await advance(0);
      expect(screen.queryByText("Hora do Medicamento!")).not.toBeInTheDocument();

      const [put] = pathsOf(api, "PUT", "/dose/9");
      expect(put.body).toBe('{"tomado":true}');
      // carga inicial + reconsulta depois do PUT
      expect(api.events).toEqual(["GET /dose/me", "PUT /dose/9", "GET /dose/me"]);
    } finally {
      vi.clearAllTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// IT-07 - MeusLembretesContent (MeusLembretesContent.tsx:38-98,100-129)
// ---------------------------------------------------------------------------

function dosesDoDia(): DoseFixture[] {
  return [
    makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T09:00:00-03:00", tomado: false }),
    makeDose({ id: 2, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T10:00:00-03:00", tomado: true }),
    makeDose({ id: 3, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T11:00:00-03:00", tomado: true }),
    makeDose({ id: 4, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T14:00:00-03:00", tomado: false }),
    // Fora do período padrão "hoje".
    makeDose({ id: 5, remedioId: 1, nome: "Alfa", data_dose: "2026-11-03T09:00:00-03:00", tomado: false }),
  ];
}

function renderLista() {
  return render(
    <LembreteProvider>
      <MeusLembretesContent />
    </LembreteProvider>,
  );
}

function visiveis(): string[] {
  return [1, 2, 3, 4, 5]
    .filter((id) => screen.queryByText(`dose-${id}`) !== null)
    .map((id) => `dose-${id}`);
}

async function esperarLista() {
  await screen.findByText("Filtros");
}

function combo(index: 0 | 1 | 2) {
  return screen.getAllByRole("combobox")[index];
}

function cartao(id: number) {
  const el = screen.getByText(`dose-${id}`).closest(".p-4");
  if (!el) throw new Error(`cartão da dose ${id} não encontrado`);
  return el as HTMLElement;
}

describe("IT-07 TEST-01 TEST-02: lista, filtros e marcar como tomado", () => {
  it("IT-07 TEST-01: carga inicial usa GET remedio/me e dose/me com token e mostra só as doses de hoje", async () => {
    useFixedDate();
    const api = installApi(dosesDoDia());
    renderLista();
    await esperarLista();

    const med = pathsOf(api, "GET", "/remedio/me");
    expect(med).toHaveLength(1);
    expect(med[0].url).toBe(`${API_URL}/remedio/me`);
    expect(med[0].headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);

    const doses = pathsOf(api, "GET", "/dose/me");
    expect(doses.length).toBeGreaterThanOrEqual(1);
    expect(doses[0].url).toBe(`${API_URL}/dose/me`);
    expect(doses[0].headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(doses[0].body).toBeUndefined();

    expect(visiveis()).toEqual(["dose-1", "dose-2", "dose-3", "dose-4"]);

    // Período "Todo o histórico" inclui o dia anterior.
    await userEvent.setup().selectOptions(combo(2), "todos");
    expect(visiveis()).toEqual(["dose-1", "dose-2", "dose-3", "dose-4", "dose-5"]);
  });

  it("IT-07 TEST-01: filtro de medicamento mantém só as doses do medicamento escolhido", async () => {
    useFixedDate();
    installApi(dosesDoDia());
    const user = userEvent.setup();
    renderLista();
    await esperarLista();

    await user.selectOptions(combo(0), "1");
    expect(visiveis()).toEqual(["dose-1", "dose-3"]);

    await user.selectOptions(combo(0), "2");
    expect(visiveis()).toEqual(["dose-2", "dose-4"]);

    await user.selectOptions(combo(0), "");
    expect(visiveis()).toEqual(["dose-1", "dose-2", "dose-3", "dose-4"]);
  });

  it("IT-07 TEST-01: filtro de status e a combinação medicamento + status", async () => {
    useFixedDate();
    installApi(dosesDoDia());
    const user = userEvent.setup();
    renderLista();
    await esperarLista();

    await user.selectOptions(combo(1), "true");
    expect(visiveis()).toEqual(["dose-2", "dose-3"]);

    await user.selectOptions(combo(1), "false");
    expect(visiveis()).toEqual(["dose-1", "dose-4"]);

    await user.selectOptions(combo(0), "1");
    expect(visiveis()).toEqual(["dose-1"]);

    await user.selectOptions(combo(1), "true");
    expect(visiveis()).toEqual(["dose-3"]);

    await user.selectOptions(combo(0), "2");
    expect(visiveis()).toEqual(["dose-2"]);
  });

  it("IT-07 TEST-02: Marcar como tomado envia PUT dose/<id> com {tomado:true}, recarrega e muda o estado", async () => {
    useFixedDate();
    const api = installApi(dosesDoDia());
    const user = userEvent.setup();
    renderLista();
    await esperarLista();

    // Pendente passada (dose-1) tem botão; futura (dose-4) e tomadas não.
    expect(screen.getAllByRole("button", { name: /Marcar como tomado/ })).toHaveLength(1);
    expect(within(cartao(1)).getByText("Pendente")).toBeInTheDocument();
    const getsAntes = pathsOf(api, "GET", "/dose/me").length;

    await user.click(within(cartao(1)).getByRole("button", { name: /Marcar como tomado/ }));

    await waitFor(() =>
      expect(within(cartao(1)).getByText("Tomado")).toBeInTheDocument(),
    );
    const puts = pathsOf(api, "PUT", "/dose/1");
    expect(puts).toHaveLength(1);
    expect(puts[0].url).toBe(`${API_URL}/dose/1`);
    expect(puts[0].body).toBe('{"tomado":true}');
    expect(puts[0].headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(pathsOf(api, "GET", "/dose/me").length).toBe(getsAntes + 1);
    expect(api.events.slice(-2)).toEqual(["PUT /dose/1", "GET /dose/me"]);
    expect(screen.queryByRole("button", { name: /Marcar como tomado/ })).not.toBeInTheDocument();
  });

  it("IT-07 TEST-02: falha do PUT mostra a mensagem existente e não recarrega", async () => {
    useFixedDate();
    const api = installApi(dosesDoDia());
    api.putError = { status: 500, message: "Falha simulada do servidor" };
    const user = userEvent.setup();
    renderLista();
    await esperarLista();
    const getsAntes = pathsOf(api, "GET", "/dose/me").length;

    await user.click(within(cartao(1)).getByRole("button", { name: /Marcar como tomado/ }));

    expect(
      await screen.findByText(
        "Não foi possível marcar o lembrete como tomado. Tente novamente.",
      ),
    ).toBeInTheDocument();
    expect(pathsOf(api, "PUT", "/dose/1")).toHaveLength(1);
    expect(pathsOf(api, "GET", "/dose/me")).toHaveLength(getsAntes);
    expect(api.doses[0].tomado).toBe(false);
  });

  it("IT-07 TEST-01: falha na carga de medicamentos mostra a mensagem de carregamento", async () => {
    useFixedDate();
    const api = installApi(dosesDoDia());
    api.remedioStatus = 500;
    renderLista();

    expect(
      await screen.findByText(
        "Não foi possível carregar seus lembretes. Tente novamente mais tarde.",
      ),
    ).toBeInTheDocument();
  });

  it("IT-07 TEST-01: sem doses mostra o estado vazio com ação para adicionar medicamento", async () => {
    useFixedDate();
    installApi([]);
    renderLista();

    expect(await screen.findByText("Nenhum lembrete encontrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar medicamento/ })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// IT-12 - AlertaLembretes: timers e doses simultâneas (FE-05)
// ---------------------------------------------------------------------------

function montarAlertas() {
  return render(
    <LembreteProvider>
      <AlertaLembretes />
    </LembreteProvider>,
  );
}

function nomesNoAlerta(): string[] {
  return screen
    .queryAllByText(/^(Alfa|Beta)$/)
    .map((el) => el.textContent ?? "");
}

describe("IT-12 TEST-01 TEST-02: alertas agendados, simultâneos e limpeza de timers", () => {
  it("IT-12 TEST-01: agenda um timer por dose pendente futura e exibe o alerta no horário", async () => {
    useFakeClock();
    installApi([
      makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:10:00-03:00" }),
      makeDose({ id: 2, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T12:20:00-03:00" }),
      // Já passou: nenhum timer.
      makeDose({ id: 3, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T11:00:00-03:00" }),
    ]);

    try {
      montarAlertas();
      await advance(0);
      expect(vi.getTimerCount()).toBe(2);
      expect(nomesNoAlerta()).toEqual([]);

      await advance(10 * 60_000);
      expect(nomesNoAlerta()).toEqual(["Alfa"]);
    } finally {
      vi.clearAllTimers();
    }
  });

  it.fails("[BLOQUEADO FE-05] IT-12 TEST-01: dose já tomada não exibe alerta (AlertaLembrete.tsx:22-47 ignora `tomado`)", async () => {
    useFakeClock();
    installApi([
      makeDose({
        id: 1,
        remedioId: 1,
        nome: "Alfa",
        data_dose: "2026-11-04T12:10:00-03:00",
        tomado: true,
      }),
    ]);

    try {
      montarAlertas();
      await advance(0);
      await advance(10 * 60_000);
      expect(screen.queryByText("Hora do Medicamento!")).not.toBeInTheDocument();
    } finally {
      vi.clearAllTimers();
    }
  });

  it.fails("[BLOQUEADO FE-05] IT-12 TEST-02: doses simultâneas entram em fila, sem perder alerta (AlertaLembrete.tsx:44 sobrescreve o visível)", async () => {
    useFakeClock();
    installApi([
      makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:10:00-03:00" }),
      makeDose({ id: 2, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T12:10:00-03:00" }),
    ]);

    try {
      montarAlertas();
      await advance(0);
      await advance(10 * 60_000);

      // Um alerta de cada vez, mas a segunda dose pendente não pode se perder.
      const primeiro = nomesNoAlerta();
      expect(primeiro).toHaveLength(1);

      act(() => {
        screen.getByRole("button", { name: "Medicamento Tomado" }).click();
      });
      await advance(0);

      const segundo = nomesNoAlerta();
      expect(segundo).toHaveLength(1);
      expect(segundo[0]).not.toBe(primeiro[0]);
    } finally {
      vi.clearAllTimers();
    }
  });

  it.fails("[BLOQUEADO FE-05] IT-12 TEST-02: timers são cancelados ao desmontar (AlertaLembrete.tsx:34 sem cleanup)", async () => {
    useFakeClock();
    installApi([
      makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:10:00-03:00" }),
      makeDose({ id: 2, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T12:20:00-03:00" }),
    ]);

    try {
      const { unmount } = montarAlertas();
      await advance(0);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.clearAllTimers();
    }
  });

  it.fails("[BLOQUEADO FE-05] IT-12 TEST-02: não duplica timers ao reexecutar o efeito após exibir uma dose (AlertaLembrete.tsx:20-47)", async () => {
    useFakeClock();
    installApi([
      makeDose({ id: 1, remedioId: 1, nome: "Alfa", data_dose: "2026-11-04T12:10:00-03:00" }),
      makeDose({ id: 2, remedioId: 2, nome: "Beta", data_dose: "2026-11-04T12:20:00-03:00" }),
    ]);

    try {
      montarAlertas();
      await advance(0);
      expect(vi.getTimerCount()).toBe(2);

      // Dispara a primeira; resta só o timer da segunda dose.
      await advance(10 * 60_000);
      expect(nomesNoAlerta()).toEqual(["Alfa"]);
      expect(vi.getTimerCount()).toBe(1);
    } finally {
      vi.clearAllTimers();
    }
  });
});
