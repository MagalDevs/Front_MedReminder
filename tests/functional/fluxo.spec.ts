/**
 * Suíte funcional T13 (FN-01 a FN-07, requisito TEST-03): navegador real
 * (Chromium) contra o build de produção, com a API controlada por interceptação.
 *
 * ATENÇÃO: A API É SIMULADA (page.route). Estes testes comprovam gestos da UI,
 * requests enviados (método, URL, headers, body), mensagens e transições do
 * frontend. NÃO comprovam persistência real, contrato real do backend nem
 * validação real de token: quem prova isso é o E2E contra API isolada.
 *
 * Isolamento:
 * - Toda chamada à API de produção não prevista pelo teste é abortada e reprova
 *   o teste (tests/support/api-guard.ts; aqui via route.fallback()).
 * - Relógio fixo em 2026-11-04T12:00:00-03:00 (page.clock.setFixedTime) e fuso
 *   America/Sao_Paulo. O CSV de medicamentos é o catálogo real servido pelo app.
 * - Dados sintéticos (ana@example.test, token-sintetico, medicamentos "Teste").
 * - Não há fluxo frontend de edição de medicamento nesta baseline: nenhum teste
 *   de edição foi escrito. O botão "Editar medicamento" só navega.
 *
 * Defeitos conhecidos ficam como test.fail() com "[BLOQUEADO ...]" no título:
 * o teste descreve o comportamento CORRETO e passa enquanto o defeito existir;
 * se for corrigido, o test.fail() reprova e deve ser convertido em teste normal.
 *
 * Snapshots (FN-06): tests/functional/fluxo.spec.ts-snapshots/. As baselines
 * dependem de plataforma (sufixo -win32/-linux) e fonte; gere-as por plataforma
 * e nunca regenere para esconder regressão visual.
 */
import type { Page } from "@playwright/test";
import { PRODUCTION_API_ORIGIN, expect, test as guarded } from "../support/api-guard";

const NOW = new Date("2026-11-04T12:00:00-03:00");
const TOKEN = "token-sintetico";
const USER = { id: 7, nome: "Ana Teste", email: "ana@example.test" };
const USER_PASSWORD = "senha-sintetica";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, idempotency-key",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// ---------------------------------------------------------------------------
// API simulada
// ---------------------------------------------------------------------------

type ApiCall = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
};
type Reply = { status?: number; json?: unknown; abort?: boolean };
type Handler = Reply | ((call: ApiCall, index: number) => Reply);
type Rule = { method: string; path: string | RegExp; handler: Handler; hits: number };

class FakeApi {
  /** Todas as chamadas à API recebidas (sem preflights), na ordem. */
  readonly requests: ApiCall[] = [];
  private readonly rules: Rule[] = [];

  /** Regras registradas depois têm prioridade sobre as anteriores. */
  on(method: string, path: string | RegExp, handler: Handler): void {
    this.rules.unshift({ method, path, handler, hits: 0 });
  }

  calls(method: string, path: string | RegExp): ApiCall[] {
    return this.requests.filter(
      (call) =>
        call.method === method &&
        (typeof path === "string" ? call.path === path : path.test(call.path)),
    );
  }

  /** Sequência "MÉTODO /caminho" das chamadas recebidas. */
  sequence(): string[] {
    return this.requests.map((call) => `${call.method} ${call.path}`);
  }

  async install(page: Page): Promise<void> {
    await page.route(`${PRODUCTION_API_ORIGIN}/**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === "OPTIONS") {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      const rule = this.rules.find(
        (r) =>
          r.method === request.method() &&
          (typeof r.path === "string" ? r.path === path : r.path.test(path)),
      );
      if (!rule) {
        // Não prevista: delega ao bloqueio do api-guard, que aborta e reprova.
        await route.fallback();
        return;
      }
      const raw = request.postData();
      const call: ApiCall = {
        method: request.method(),
        path,
        headers: await request.allHeaders(),
        body: raw === null ? undefined : (JSON.parse(raw) as unknown),
      };
      this.requests.push(call);
      const index = rule.hits++;
      const reply = typeof rule.handler === "function" ? rule.handler(call, index) : rule.handler;
      if (reply.abort) {
        await route.abort("internetdisconnected");
        return;
      }
      const hasBody = reply.json !== undefined;
      await route.fulfill({
        status: reply.status ?? 200,
        headers: { ...CORS, ...(hasBody ? { "content-type": "application/json" } : {}) },
        body: hasBody ? JSON.stringify(reply.json) : "",
      });
    });
  }
}

/** Um 401 redireciona a página enquanto um alert está aberto: a aba pode sumir antes do accept. */
function ignorarCorridaDeNavegacao(): void {}

type DialogLog = { messages: string[]; confirmResult: boolean };

const test = guarded.extend<{ api: FakeApi; dialogs: DialogLog }>({
  api: async ({ page }, provide) => {
    await page.clock.setFixedTime(NOW);
    const api = new FakeApi();
    api.on("GET", "/usuario/me", { json: { data: USER } });
    api.on("GET", "/dose/me", { json: { data: [] } });
    await api.install(page);
    await provide(api);
  },
  dialogs: async ({ page }, provide) => {
    const log: DialogLog = { messages: [], confirmResult: true };
    page.on("dialog", (dialog) => {
      log.messages.push(`${dialog.type()}: ${dialog.message()}`);
      if (dialog.type() === "confirm" && !log.confirmResult) {
        void dialog.dismiss().catch(ignorarCorridaDeNavegacao);
      } else {
        void dialog.accept().catch(ignorarCorridaDeNavegacao);
      }
    });
    await provide(log);
  },
});

test.use({ timezoneId: "America/Sao_Paulo", locale: "pt-BR" });

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Semeia a sessão sintética uma única vez por aba (sobrevive a recargas/redirects). */
async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(
    ([token, user]) => {
      if (!sessionStorage.getItem("__sessao_semeada")) {
        sessionStorage.setItem("__sessao_semeada", "1");
        localStorage.setItem("access_token", token);
        localStorage.setItem("user_data", user);
      }
    },
    [TOKEN, JSON.stringify(USER)] as const,
  );
}

function remedio(id: number, nome: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    nome,
    classificacao: "Analgésico",
    quantidadeDiaria: 3,
    quantidadeCaixa: 30,
    horaInicio: "2026-11-04T11:00:00.000Z",
    cor: "Azul",
    unidadeMedida: "mg",
    motivo: "Dor sintética",
    quantidadeDias: 7,
    dataValidade: "2027-06-30T00:00:00.000Z",
    foto: "https://example.com/image.jpg",
    observacao: "Observação sintética",
    quantidadeDose: "1 comp",
    usuarioId: USER.id,
    ...extra,
  };
}

function dose(id: number, rem: ReturnType<typeof remedio>, dataDose: string, tomado: boolean) {
  return { id, tomado, data_dose: dataDose, usuarioId: USER.id, remedioId: rem.id, remedio: rem };
}

type Agenda = {
  remedios: ReturnType<typeof remedio>[];
  doses: ReturnType<typeof dose>[];
};

/** Estado "persistido" do fake: PUT/DELETE alteram o que as próximas consultas devolvem. */
function criarAgenda(): Agenda {
  const dipirona = remedio(1, "Dipirona Teste");
  const amoxicilina = remedio(2, "Amoxicilina Teste", { classificacao: "Antibiótico" });
  const losartana = remedio(3, "Losartana Teste", { classificacao: "Anti-hipertensivo" });
  return {
    remedios: [dipirona, amoxicilina, losartana],
    doses: [
      dose(101, dipirona, "2026-11-04T08:00:00-03:00", true),
      dose(102, dipirona, "2026-11-04T09:00:00-03:00", false),
      dose(103, amoxicilina, "2026-11-04T10:00:00-03:00", false),
      dose(104, amoxicilina, "2026-11-04T20:00:00-03:00", false),
      dose(105, losartana, "2026-11-03T09:00:00-03:00", false),
    ],
  };
}

function usarAgenda(api: FakeApi, agenda: Agenda): void {
  api.on("GET", "/remedio/me", () => ({ json: { message: "ok", data: agenda.remedios } }));
  api.on("GET", "/dose/me", () => ({ json: { message: "ok", data: agenda.doses } }));
  api.on("PUT", /^\/dose\/\d+$/, (call) => {
    const id = Number(call.path.split("/")[2]);
    const alvo = agenda.doses.find((d) => d.id === id);
    if (alvo) alvo.tomado = true;
    return { json: { message: "Dose atualizada", data: { id, tomado: true } } };
  });
  api.on("DELETE", /^\/remedio\/\d+$/, (call) => {
    const id = Number(call.path.split("/")[2]);
    agenda.remedios = agenda.remedios.filter((r) => r.id !== id);
    return { json: { message: "Removido", data: [] } };
  });
}

/** Provider de lembretes consulta /dose/me em toda página com sessão. */
function usarListaVazia(api: FakeApi): void {
  api.on("GET", "/dose/me", { json: { message: "ok", data: [] } });
}

function usarLogin(api: FakeApi): void {
  api.on("POST", "/auth/login", { json: { access_token: TOKEN, message: "Login realizado" } });
  api.on("GET", "/usuario/me", { json: { message: "ok", data: USER } });
}

async function storageDaSessao(page: Page) {
  return page.evaluate(() => ({
    token: localStorage.getItem("access_token"),
    user: localStorage.getItem("user_data"),
    length: localStorage.length,
  }));
}

async function expectSemSessao(page: Page): Promise<void> {
  expect(await storageDaSessao(page)).toEqual({ token: null, user: null, length: 0 });
}

const AUTH_HEADER = `Bearer ${TOKEN}`;
const MENSAGEM_POR_STATUS = {
  403: "Acesso negado",
  429: "Muitas requisições. Tente novamente mais tarde",
  500: "Erro interno do servidor",
} as const;
type StatusDeErro = keyof typeof MENSAGEM_POR_STATUS;
const STATUS_DE_ERRO: StatusDeErro[] = [403, 429, 500];

// ---------------------------------------------------------------------------
// FN-01 login/logout
// ---------------------------------------------------------------------------

test("FN-01 TEST-03 login mockado exibe o nome do perfil e o logout limpa o storage", async ({
  page,
  api,
}) => {
  usarLogin(api);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(USER.email);
  await page.getByLabel("Senha", { exact: true }).fill(USER_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
  const menu = page.getByRole("button", { name: "User menu" });
  await expect(menu).toContainText("Olá, Ana");

  // Requests: login público (sem Authorization) e perfil com o token recebido.
  await expect.poll(() => api.sequence()).toEqual(["POST /auth/login", "GET /usuario/me", "GET /dose/me"]);
  const [login] = api.calls("POST", "/auth/login");
  expect(login.body).toEqual({ email: USER.email, senha: USER_PASSWORD });
  expect(login.headers["content-type"]).toContain("application/json");
  expect(login.headers["authorization"]).toBeUndefined();
  const [perfil] = api.calls("GET", "/usuario/me");
  expect(perfil.headers["authorization"]).toBe(AUTH_HEADER);

  // Sessão gravada com o token e o perfil sintéticos.
  const sessao = await storageDaSessao(page);
  expect(sessao.token).toBe(TOKEN);
  expect(JSON.parse(sessao.user ?? "null")).toEqual(USER);

  // Menu -> Sair: volta ao login e o storage fica vazio.
  await menu.click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expectSemSessao(page);
  expect(api.requests).toHaveLength(3);
});

// ---------------------------------------------------------------------------
// FN-02 rota protegida
// ---------------------------------------------------------------------------

test("FN-02 TEST-03 rota protegida sem sessão não mostra conteúdo e alcança o login", async ({
  page,
  api,
}) => {
  await page.goto("/meus-lembretes");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meus lembretes" })).toHaveCount(0);
  await expectSemSessao(page);
  expect(api.requests).toEqual([]);
});

test("FN-02 TEST-03 rota protegida com sessão sintética preparada exibe o conteúdo", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  await seedSession(page);

  await page.goto("/meus-lembretes");

  await expect(page.getByRole("heading", { name: "Meus lembretes" })).toBeVisible();
  await expect(page).toHaveURL(/\/meus-lembretes$/);
  // Leitura autenticada: lista de remédios e doses (provider + página).
  await expect.poll(() => api.calls("GET", "/remedio/me").length).toBe(1);
  await expect.poll(() => api.calls("GET", "/dose/me").length).toBeGreaterThanOrEqual(1);
  const remedios = api.calls("GET", "/remedio/me");
  expect(remedios).toHaveLength(1);
  expect(remedios[0].headers["authorization"]).toBe(AUTH_HEADER);
  const doses = api.calls("GET", "/dose/me");
  expect(doses.length).toBeGreaterThanOrEqual(1);
  for (const call of doses) expect(call.headers["authorization"]).toBe(AUTH_HEADER);
});

test("FN-02 TEST-03 [BLOQUEADO FE-03] /meus-medicamentos sem sessão leva ao login", async ({
  page,
  api,
}) => {
  // Classificação nossa: /meus-medicamentos lista dados do usuário mas não usa
  // ProtectedRoute (MeusMedicamentosContent/page.tsx), então hoje renderiza a
  // página com erro de carregamento em vez de levar ao login. Passa enquanto o
  // defeito existir (test.fail).
  test.fail();
  await page.goto("/meus-medicamentos");
  await expect(page).toHaveURL(/\/login$/);
  expect(api.requests).toEqual([]);
});

// ---------------------------------------------------------------------------
// FN-03 busca, seleção e cadastro de tratamento
// ---------------------------------------------------------------------------

test("FN-03 TEST-03 busca na home: inexistente, conhecido, seleção e navegação para o cadastro", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const campo = page.getByPlaceholder("Buscar medicamento...");
  await expect(campo).toBeVisible();

  await campo.click();
  await expect(page.getByText("Digite para buscar um medicamento")).toBeVisible();

  // Inexistente no catálogo real servido pelo app.
  await campo.fill("zzxqk-inexistente");
  await expect(page.getByText("Nenhum resultado encontrado")).toBeVisible();

  // Conhecido, sem diferenciar maiúsculas/minúsculas.
  await campo.fill("funed lor");
  const linha = page.getByText("FUNED LORATADINA", { exact: true });
  await expect(linha).toBeVisible();
  await expect(page.getByText("ANTI-HISTAMINICOS SISTEMICOS")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cadastrar" })).toHaveCount(0);

  // Selecionar o resultado preenche a busca e oferece "Cadastrar".
  await linha.click();
  await expect(campo).toHaveValue("FUNED LORATADINA");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page).toHaveURL(/\/novo-medicamento\?medicamento=FUNED%20LORATADINA$/);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  // Nome e tipo selecionados chegam ao formulário.
  await expect(page.getByPlaceholder("Dipirona")).toHaveValue("FUNED LORATADINA");
  await expect(page.getByPlaceholder("Analgésico")).toHaveValue("ANTI-HISTAMINICOS SISTEMICOS");
  expect(api.requests).toEqual([]);
});

/** Preenche o formulário de tratamento (nome/tipo já vêm da seleção). */
async function preencherTratamento(
  page: Page,
  opcoes: { horaInicial: string; intervalo: string; duracao: string },
): Promise<void> {
  await page.getByPlaceholder("30").fill("30");
  await page.locator("select").nth(0).selectOption("comp"); // unidade da caixa
  await page.locator('input[type="date"]').nth(0).fill("2027-01-31"); // validade
  await page.locator('[style*="rgb(75, 0, 255)"]').click(); // cor Azul (#4B00FF)
  await page.getByPlaceholder("Dor de cabeça").fill("Rinite sintética");
  await page.locator('input[type="time"]').fill(opcoes.horaInicial);
  await page.getByPlaceholder("500").fill("500");
  await page.locator("select").nth(1).selectOption("ml"); // unidade da dosagem
  await page.getByPlaceholder("6 (horas)").fill(opcoes.intervalo);
  await page.getByPlaceholder("7", { exact: true }).fill(opcoes.duracao);
  await page.getByPlaceholder("Tomar após as refeições").fill("Tomar após as refeições");
}

function respostaTratamento(call: ApiCall, id = 777): Reply {
  const body = call.body as { remedio: object; doses: string[] };
  return { json: { data: { remedio: { ...body.remedio, id }, doses: body.doses.map((data_dose, index) => ({ id: index + 1, data_dose })) } } };
}

const URL_NOVO_TRATAMENTO = "/novo-medicamento?medicamento=FUNED%20LORATADINA";

test("FN-03 TEST-03 cadastro de tratamento válido envia os payloads esperados e atualiza os lembretes", async ({
  page,
  api,
  dialogs,
}) => {
  usarListaVazia(api);
  api.on("POST", "/tratamento", call => respostaTratamento(call, 777));
  await seedSession(page);

  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });
  await page.getByRole("button", { name: "Salvar lembrete" }).click();

  await expect.poll(() => dialogs.messages).toEqual(["alert: Lembrete e doses salvos com sucesso!"]);

  // Medicamento: método, URL, headers e body.
  const [criarRemedio] = api.calls("POST", "/tratamento");
  expect(criarRemedio.headers["authorization"]).toBe(AUTH_HEADER);
  expect(criarRemedio.headers["content-type"]).toContain("application/json");
  expect((criarRemedio.body as { remedio: object }).remedio).toEqual({
    nome: "FUNED LORATADINA",
    quantidadeCaixa: 30,
    dataValidade: "2027-01-31",
    quantidadeDiaria: 8, // recebe o INTERVALO em horas (ver achado cardCadastrar.tsx:225)
    foto: "https://example.com/image.jpg",
    classificacao: "ANTI-HISTAMINICOS SISTEMICOS",
    horaInicio: "2026-11-04T11:00:00.000Z",
    cor: "Azul",
    unidadeMedida: "comp",
    motivo: "Rinite sintética",
    quantidadeDias: 1,
    quantidadeDose: "500 ml",
    observacao: "Tomar após as refeições",
  });

  // Doses: ID criado e horários locais 04/11 08:00, 16:00 e 05/11 00:00 (08:00 final exclusivo).
  const [criarDoses] = api.calls("POST", "/tratamento");
  expect(criarDoses.headers["authorization"]).toBe(AUTH_HEADER);
  expect(criarDoses.headers["content-type"]).toContain("application/json");
  expect((criarDoses.body as { doses: string[] }).doses).toEqual([
      "2026-11-04T11:00:00.000Z",
      "2026-11-04T19:00:00.000Z",
      "2026-11-05T03:00:00.000Z",
  ]);

  // Perfil confirmado, tratamento atômico e depois recarga; formulário limpo.
  expect(api.sequence()).toEqual([
    "GET /usuario/me", // restored profile
    "GET /dose/me", // provider no carregamento
    "POST /tratamento",
    "GET /dose/me", // atualização após gravar
  ]);
  await expect(page.getByPlaceholder("Dipirona")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled();
});

test("FN-03 TEST-03 formulário vazio mostra as validações e não envia mutação", async ({
  page,
  api,
  dialogs,
}) => {
  usarListaVazia(api);
  await seedSession(page);

  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await page.getByRole("button", { name: "Salvar lembrete" }).click();

  await expect.poll(() => dialogs.messages).toEqual([
    "alert: Por favor, corrija os erros no formulário",
  ]);
  await expect(page.getByText("Dosagem é obrigatória")).toBeVisible();
  await expect(page.getByText("Quantidade é obrigatória")).toBeVisible();
  await expect(page.getByText("Duração é obrigatória")).toBeVisible();
  await expect(page.getByText("Intervalo é obrigatório")).toBeVisible();
  expect(api.calls("POST", "/remedio")).toHaveLength(0);
  expect(api.calls("POST", "/dose/doses")).toHaveLength(0);
});

test("FN-03 TEST-03 BEAPI-08 doses a partir das 21h locais mantêm o dia local correto", async ({
  page,
  api,
  dialogs,
}) => {
  usarListaVazia(api);
  api.on("POST", "/tratamento", call => respostaTratamento(call, 778));
  await seedSession(page);

  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "22:00", intervalo: "8", duracao: "1" });
  await page.getByRole("button", { name: "Salvar lembrete" }).click();
  await expect.poll(() => dialogs.messages.length).toBeGreaterThan(0);

  // Correto: 04/11 22:00, 05/11 06:00 e 05/11 14:00 locais.
  const [criarDoses] = api.calls("POST", "/tratamento");
  expect((criarDoses.body as { doses: string[] }).doses).toEqual([
      "2026-11-05T01:00:00.000Z",
      "2026-11-05T09:00:00.000Z",
      "2026-11-05T17:00:00.000Z",
  ]);
});

test("FN-03 FN-08 BEAPI-07 retry manual preserva chave e conteudo", async ({ page, api, dialogs }) => {
  usarListaVazia(api);
  api.on("POST", "/tratamento", (call, index) => index === 0 ? { abort: true } : respostaTratamento(call, 779));
  await seedSession(page);
  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });
  const salvar = page.getByRole("button", { name: "Salvar lembrete" });
  await salvar.click();
  await expect.poll(() => dialogs.messages.length).toBe(1);
  await expect(salvar).toBeEnabled();
  await salvar.click();
  await expect.poll(() => dialogs.messages.at(-1)).toBe("alert: Lembrete e doses salvos com sucesso!");
  const calls = api.calls("POST", "/tratamento");
  expect(calls).toHaveLength(2);
  expect(calls[0].headers["idempotency-key"]).toMatch(/^[a-zA-Z0-9._:-]{1,128}$/);
  expect(calls[1].headers["idempotency-key"]).toBe(calls[0].headers["idempotency-key"]);
  expect(calls[1].body).toEqual(calls[0].body);
  expect(api.calls("POST", "/remedio")).toHaveLength(0);
  expect(api.calls("POST", "/dose/doses")).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// FN-04 lembretes: filtro e dose tomada
// ---------------------------------------------------------------------------

/** Selo de status de uma linha (exclui as <option> dos filtros). */
function selo(page: Page, estado: "Tomado" | "Pendente") {
  return page.locator("span.rounded-full", { hasText: new RegExp(`^${estado}$`) });
}

function linhaDeLembrete(page: Page, nome: string, estado: "Tomado" | "Pendente") {
  return page.locator("div.p-4", {
    has: page.getByRole("heading", { name: nome }),
    hasText: estado,
  });
}

test("FN-04 TEST-03 lembretes: filtros de período, status e medicamento mostram só os registros esperados", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  await seedSession(page);
  await page.goto("/meus-lembretes");

  const titulos = page.locator("h3").filter({ hasText: "Teste" });
  const medicamento = page.locator("select").nth(0);
  const status = page.locator("select").nth(1);
  const periodo = page.locator("select").nth(2);
  await expect(titulos).toHaveCount(4); // "Hoje": 101, 102, 103, 104

  // Status.
  await status.selectOption({ label: "Pendente" });
  await expect(titulos).toHaveCount(3);
  await expect(selo(page, "Tomado")).toHaveCount(0);
  await status.selectOption({ label: "Tomado" });
  await expect(titulos).toHaveCount(1);
  await expect(titulos).toHaveText("Dipirona Teste");
  await status.selectOption({ label: "Todos os status" });

  // Medicamento.
  await medicamento.selectOption({ label: "Amoxicilina Teste" });
  await expect(titulos).toHaveCount(2);
  await expect(titulos.filter({ hasText: "Amoxicilina Teste" })).toHaveCount(2);

  // Período: a dose de ontem (Losartana) só entra com "Últimos 7 dias".
  await medicamento.selectOption({ label: "Losartana Teste" });
  await expect(titulos).toHaveCount(0);
  await expect(page.getByText("Tente ajustar os filtros para ver mais resultados.")).toBeVisible();
  await periodo.selectOption({ label: "Últimos 7 dias" });
  await expect(titulos).toHaveCount(1);
  await expect(titulos).toHaveText("Losartana Teste");
  await expect(page.getByText("03/11/2026")).toBeVisible();

  // Filtros são locais: nenhuma consulta nova além das de carregamento (somente GET).
  expect(api.requests.every((call) => call.method === "GET")).toBe(true);
});

test("FN-04 TEST-03 marcar dose como tomada envia PUT {tomado:true} e reflete o estado após a nova consulta", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  await seedSession(page);
  await page.goto("/meus-lembretes");

  // Só doses pendentes cujo horário já passou têm botão (102 e 103; 104 é às 20h).
  const botoes = page.getByRole("button", { name: /Marcar como tomado/ });
  await expect(botoes).toHaveCount(2);
  await expect.poll(() => api.calls("GET", "/dose/me").length).toBe(2); // provider + página
  const carregamentos = api.calls("GET", "/dose/me").length;

  await linhaDeLembrete(page, "Dipirona Teste", "Pendente")
    .getByRole("button", { name: /Marcar como tomado/ })
    .click();

  // O item muda de estado e o botão dele some.
  await expect(botoes).toHaveCount(1);
  await expect(linhaDeLembrete(page, "Dipirona Teste", "Pendente")).toHaveCount(0);
  await expect(page.locator("h3", { hasText: "Dipirona Teste" })).toHaveCount(2);
  await expect(selo(page, "Tomado")).toHaveCount(2);

  const puts = api.calls("PUT", "/dose/102");
  expect(puts).toHaveLength(1);
  expect(puts[0].body).toEqual({ tomado: true });
  expect(puts[0].headers["authorization"]).toBe(AUTH_HEADER);
  expect(puts[0].headers["content-type"]).toContain("application/json");
  // A confirmação é seguida de uma nova consulta de lembretes.
  const sequencia = api.sequence();
  expect(sequencia.slice(sequencia.indexOf("PUT /dose/102"))).toEqual([
    "PUT /dose/102",
    "GET /dose/me",
  ]);
  expect(api.calls("GET", "/dose/me")).toHaveLength(carregamentos + 1);
});

// ---------------------------------------------------------------------------
// FN-05 medicamentos: listar e excluir
// ---------------------------------------------------------------------------

function cartaoDeMedicamento(page: Page, nome: string) {
  return page.locator("div.p-5", { has: page.getByRole("heading", { name: nome }) });
}

test("FN-05 TEST-03 lista medicamentos e exclui com confirmação; cancelar não envia DELETE", async ({
  page,
  api,
  dialogs,
}) => {
  usarAgenda(api, criarAgenda());
  await seedSession(page);
  await page.goto("/meus-medicamentos");

  const titulos = page.locator("h3").filter({ hasText: "Teste" });
  await expect(titulos).toHaveText(["Dipirona Teste", "Amoxicilina Teste", "Losartana Teste"]);
  await expect(cartaoDeMedicamento(page, "Dipirona Teste")).toContainText("30 mg");
  const [lista] = api.calls("GET", "/remedio/me");
  expect(lista.headers["authorization"]).toBe(AUTH_HEADER);

  // Cancelar a confirmação: nada é enviado e a lista permanece.
  dialogs.confirmResult = false;
  await cartaoDeMedicamento(page, "Amoxicilina Teste").getByTitle("Excluir medicamento").click();
  await expect.poll(() => dialogs.messages).toEqual([
    "confirm: Tem certeza que deseja excluir este medicamento?",
  ]);
  expect(api.calls("DELETE", /^\/remedio\//)).toHaveLength(0);
  await expect(titulos).toHaveCount(3);

  // Confirmar: DELETE /remedio/2 e só esse cartão sai da lista.
  dialogs.confirmResult = true;
  await cartaoDeMedicamento(page, "Amoxicilina Teste").getByTitle("Excluir medicamento").click();
  await expect(titulos).toHaveText(["Dipirona Teste", "Losartana Teste"]);
  const deletes = api.calls("DELETE", /^\/remedio\//);
  expect(deletes).toHaveLength(1);
  expect(deletes[0].path).toBe("/remedio/2");
  expect(deletes[0].headers["authorization"]).toBe(AUTH_HEADER);
  expect(deletes[0].body).toBeUndefined();
  expect(dialogs.messages).toHaveLength(2);
});

test("FN-05 TEST-03 falha ao excluir mostra a mensagem e mantém o medicamento na lista", async ({
  page,
  api,
  dialogs,
}) => {
  usarAgenda(api, criarAgenda());
  api.on("DELETE", "/remedio/1", { status: 500, json: { message: "Falha sintética no servidor" } });
  await seedSession(page);
  await page.goto("/meus-medicamentos");

  const titulos = page.locator("h3").filter({ hasText: "Teste" });
  await expect(titulos).toHaveCount(3);
  await cartaoDeMedicamento(page, "Dipirona Teste").getByTitle("Excluir medicamento").click();

  await expect.poll(() => dialogs.messages).toEqual([
    "confirm: Tem certeza que deseja excluir este medicamento?",
    "alert: Não foi possível excluir o medicamento. Tente novamente mais tarde.",
  ]);
  await expect(titulos).toHaveCount(3);
  expect(api.calls("DELETE", "/remedio/1")).toHaveLength(1);
});

test("FN-05 TEST-03 sem medicamentos mostra o estado vazio com o atalho de cadastro", async ({
  page,
  api,
}) => {
  api.on("GET", "/remedio/me", { json: { message: "ok", data: [] } });
  usarListaVazia(api);
  await seedSession(page);
  await page.goto("/meus-medicamentos");

  await expect(page.getByRole("heading", { name: "Nenhum medicamento encontrado" })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar medicamento" }).click();
  await expect(page).toHaveURL(/\/novo-medicamento$/);
});

// ---------------------------------------------------------------------------
// FN-07 falhas de API e rede nas ações cobertas
// ---------------------------------------------------------------------------

type CasoLogin = { nome: string; reply: Reply; mensagem: string };
const CASOS_LOGIN: CasoLogin[] = [
  { nome: "401 Invalid credentials", reply: { status: 401, json: { message: "Invalid credentials" } }, mensagem: "E-mail ou senha inválidos" },
  { nome: "401 sem corpo", reply: { status: 401 }, mensagem: "Não autorizado" },
  { nome: "403", reply: { status: 403 }, mensagem: "Acesso negado" },
  { nome: "429", reply: { status: 429 }, mensagem: "Muitas requisições. Tente novamente mais tarde" },
  { nome: "500", reply: { status: 500 }, mensagem: "Erro interno do servidor" },
  { nome: "rede interrompida", reply: { abort: true }, mensagem: "Failed to fetch" },
];

for (const caso of CASOS_LOGIN) {
  test(`FN-07 FN-01 TEST-03 login com ${caso.nome} mostra "${caso.mensagem}", encerra o loading e não grava sessão`, async ({
    page,
    api,
  }) => {
    api.on("POST", "/auth/login", caso.reply);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(USER.email);
    await page.getByLabel("Senha", { exact: true }).fill(USER_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(caso.mensagem, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled(); // loading encerrado
    await expect(page).toHaveURL(/\/login$/);
    await expectSemSessao(page);
    expect(api.sequence()).toEqual(["POST /auth/login"]); // perfil nunca é consultado
  });
}

test("FN-07 FN-01 TEST-03 login com token mas perfil 500 mostra a falha do perfil e limpa a sessão", async ({
  page,
  api,
}) => {
  api.on("POST", "/auth/login", { json: { access_token: TOKEN, message: "Login realizado" } });
  api.on("GET", "/usuario/me", { status: 500 });

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(USER.email);
  await page.getByLabel("Senha", { exact: true }).fill(USER_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText(/Não foi possível carregar seu perfil/)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  await expectSemSessao(page);
});

test("FN-07 FN-04 TEST-03 401 na consulta protegida inicial remove a sessão e leva ao login", async ({
  page,
  api,
}) => {
  api.on("GET", "/remedio/me", { json: { message: "ok", data: [] } });
  api.on("GET", "/dose/me", { status: 401, json: { message: "Token expirado" } });
  await seedSession(page);

  await page.goto("/meus-lembretes");

  await expect(page).toHaveURL(/\/login$/);
  await expectSemSessao(page);
  expect(api.calls("GET", "/dose/me").length).toBeGreaterThanOrEqual(1);
});

for (const status of STATUS_DE_ERRO) {
  test(`FN-07 FN-04 TEST-03 marcar dose tomada com ${status} mostra a mensagem, não confirma e não reconsulta`, async ({
    page,
    api,
  }) => {
    const agenda = criarAgenda();
    usarAgenda(api, agenda);
    api.on("PUT", "/dose/102", { status });
    await seedSession(page);
    await page.goto("/meus-lembretes");
    await expect(page.getByRole("button", { name: /Marcar como tomado/ })).toHaveCount(2);
    await expect.poll(() => api.calls("GET", "/dose/me").length).toBe(2); // provider + página
    const carregamentos = api.calls("GET", "/dose/me").length;

    await linhaDeLembrete(page, "Dipirona Teste", "Pendente")
      .getByRole("button", { name: /Marcar como tomado/ })
      .click();

    await expect(
      page.getByText("Não foi possível marcar o lembrete como tomado. Tente novamente."),
    ).toBeVisible();
    await expect(page.locator(".animate-spin")).toHaveCount(0);
    await expect(selo(page, "Tomado")).toHaveCount(0); // sem sucesso falso
    expect(api.calls("PUT", "/dose/102")).toHaveLength(1);
    expect(api.calls("GET", "/dose/me")).toHaveLength(carregamentos); // sem reconsulta
    expect(agenda.doses.find((d) => d.id === 102)?.tomado).toBe(false);
  });
}

test("FN-07 FN-04 TEST-03 marcar dose tomada com rede interrompida mostra a mensagem e não confirma", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  api.on("PUT", "/dose/102", { abort: true });
  await seedSession(page);
  await page.goto("/meus-lembretes");

  await linhaDeLembrete(page, "Dipirona Teste", "Pendente")
    .getByRole("button", { name: /Marcar como tomado/ })
    .click();

  await expect(
    page.getByText("Não foi possível marcar o lembrete como tomado. Tente novamente."),
  ).toBeVisible();
  await expect(selo(page, "Tomado")).toHaveCount(0);
});

test("FN-07 FN-04 TEST-03 marcar dose tomada com 401 remove a sessão e leva ao login", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  api.on("PUT", "/dose/102", { status: 401, json: { message: "Token expirado" } });
  await seedSession(page);
  await page.goto("/meus-lembretes");

  await linhaDeLembrete(page, "Dipirona Teste", "Pendente")
    .getByRole("button", { name: /Marcar como tomado/ })
    .click();

  await expect(page).toHaveURL(/\/login$/);
  await expectSemSessao(page);
});

for (const status of STATUS_DE_ERRO) {
  test(`FN-07 FN-05 TEST-03 excluir medicamento com ${status} avisa a falha e mantém o item`, async ({
    page,
    api,
    dialogs,
  }) => {
    usarAgenda(api, criarAgenda());
    api.on("DELETE", "/remedio/1", { status });
    await seedSession(page);
    await page.goto("/meus-medicamentos");

    const titulos = page.locator("h3").filter({ hasText: "Teste" });
    await expect(titulos).toHaveCount(3);
    await cartaoDeMedicamento(page, "Dipirona Teste").getByTitle("Excluir medicamento").click();

    await expect.poll(() => dialogs.messages).toEqual([
      "confirm: Tem certeza que deseja excluir este medicamento?",
      "alert: Não foi possível excluir o medicamento. Tente novamente mais tarde.",
    ]);
    await expect(titulos).toHaveCount(3);
    expect(api.calls("DELETE", "/remedio/1")).toHaveLength(1);
  });
}

test("FN-07 FN-05 TEST-03 excluir medicamento com rede interrompida avisa a falha e mantém o item", async ({
  page,
  api,
  dialogs,
}) => {
  usarAgenda(api, criarAgenda());
  api.on("DELETE", "/remedio/1", { abort: true });
  await seedSession(page);
  await page.goto("/meus-medicamentos");

  const titulos = page.locator("h3").filter({ hasText: "Teste" });
  await expect(titulos).toHaveCount(3);
  await cartaoDeMedicamento(page, "Dipirona Teste").getByTitle("Excluir medicamento").click();

  await expect.poll(() => dialogs.messages).toContain(
    "alert: Não foi possível excluir o medicamento. Tente novamente mais tarde.",
  );
  await expect(titulos).toHaveCount(3);
});

test("FN-07 FN-05 TEST-03 excluir medicamento com 401 remove a sessão e leva ao login", async ({
  page,
  api,
}) => {
  usarAgenda(api, criarAgenda());
  api.on("DELETE", "/remedio/1", { status: 401, json: { message: "Token expirado" } });
  await seedSession(page);
  await page.goto("/meus-medicamentos");
  await expect(page.locator("h3").filter({ hasText: "Teste" })).toHaveCount(3);
  page.on("dialog", (dialog) => void dialog.accept().catch(ignorarCorridaDeNavegacao));

  await cartaoDeMedicamento(page, "Dipirona Teste").getByTitle("Excluir medicamento").click();

  await expect(page).toHaveURL(/\/login$/);
  await expectSemSessao(page);
});

test("FN-07 FN-05 TEST-03 falha ao carregar medicamentos e lembretes mostra a mensagem e encerra o loading", async ({
  page,
  api,
}) => {
  usarListaVazia(api);
  api.on("GET", "/remedio/me", { status: 500 });
  await seedSession(page);

  await page.goto("/meus-medicamentos");
  await expect(
    page.getByText("Não foi possível carregar seus medicamentos. Tente novamente mais tarde."),
  ).toBeVisible();
  await expect(page.locator(".animate-spin")).toHaveCount(0);

  await page.goto("/meus-lembretes");
  await expect(
    page.getByText("Não foi possível carregar seus lembretes. Tente novamente mais tarde."),
  ).toBeVisible();
  await expect(page.locator(".animate-spin")).toHaveCount(0);
});

for (const status of STATUS_DE_ERRO) {
  test(`FN-07 FN-03 TEST-03 criar medicamento com ${status} avisa a falha, não cria doses e libera o botão`, async ({
    page,
    api,
    dialogs,
  }) => {
    usarListaVazia(api);
    api.on("POST", "/tratamento", { status });
    await seedSession(page);
    await page.goto(URL_NOVO_TRATAMENTO);
    await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
    await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });

    await page.getByRole("button", { name: "Salvar lembrete" }).click();

    const mensagem = MENSAGEM_POR_STATUS[status];
    // Uma falha da operação atômica produz um aviso.
    await expect.poll(() => dialogs.messages).toEqual([
      `alert: ${mensagem}`,
    ]);
    await expect(page.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled();
    expect(api.calls("POST", "/dose/doses")).toHaveLength(0);
    expect(dialogs.messages.join("\n")).not.toContain("sucesso");
    // Formulário preservado para nova tentativa.
    await expect(page.getByPlaceholder("500")).toHaveValue("500");
  });
}

test("FN-07 FN-03 TEST-03 criar medicamento com rede interrompida não cria doses nem anuncia sucesso", async ({
  page,
  api,
  dialogs,
}) => {
  usarListaVazia(api);
  api.on("POST", "/tratamento", { abort: true });
  await seedSession(page);
  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });

  await page.getByRole("button", { name: "Salvar lembrete" }).click();

  await expect.poll(() => dialogs.messages.length).toBe(1);
  await expect(page.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled();
  expect(api.calls("POST", "/dose/doses")).toHaveLength(0);
  expect(dialogs.messages.join("\n")).not.toContain("sucesso");
});

test("FN-07 FN-03 TEST-03 criar medicamento com 401 avisa a falha de autenticação e não cria doses", async ({
  page,
  api,
  dialogs,
}) => {
  usarListaVazia(api);
  api.on("POST", "/tratamento", { status: 401, json: { message: "Token expirado" } });
  await seedSession(page);
  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });

  await page.getByRole("button", { name: "Salvar lembrete" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expectSemSessao(page);
  expect(api.calls("POST", "/dose/doses")).toHaveLength(0);
  expect(dialogs.messages.join(" | ")).not.toContain("sucesso");
});

test("FN-07 FN-03 TEST-03 BEAPI-07 tratamento 500 não anuncia sucesso", async ({
  page,
  api,
  dialogs,
}) => {
  // Resposta 500 da operação única: sem sucesso ou recarga.
  usarListaVazia(api);
  api.on("POST", "/tratamento", { status: 500 });
  await seedSession(page);
  await page.goto(URL_NOVO_TRATAMENTO);
  await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
  await preencherTratamento(page, { horaInicial: "08:00", intervalo: "8", duracao: "1" });

  await page.getByRole("button", { name: "Salvar lembrete" }).click();

  await expect.poll(() => dialogs.messages).toEqual([
    "alert: Erro interno do servidor",
  ]);
  await expect(page.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled();
  expect(dialogs.messages.join("\n")).not.toContain("sucesso");
  // Sem sucesso: nenhuma reconsulta de lembretes além da carga inicial.
  expect(api.calls("GET", "/dose/me")).toHaveLength(1);
});

// ---------------------------------------------------------------------------
// FN-06 snapshots determinísticos (relógio, fuso, dados e animações congelados)
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`FN-06 TEST-03 snapshots ${viewport.width}px`, () => {
    test.use({ viewport });

    async function capturar(page: Page, nome: string): Promise<void> {
      await page.mouse.move(0, 0); // evita estado de hover
      await expect(page).toHaveScreenshot(`${nome}-${viewport.width}.png`, {
        fullPage: true,
        animations: "disabled",
      });
    }

    test(`FN-06 TEST-03 login ${viewport.width}px`, async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
      await capturar(page, "login");
    });

    test(`FN-06 TEST-03 home com busca e resultados ${viewport.width}px`, async ({ page }) => {
      await page.goto("/");
      const campo = page.getByPlaceholder("Buscar medicamento...");
      await campo.fill("funed lor");
      await expect(page.getByText("FUNED LORATADINA", { exact: true })).toBeVisible();
      await capturar(page, "home-busca");
    });

    test(`FN-06 TEST-03 novo-medicamento ${viewport.width}px`, async ({ page }) => {
      await page.goto(URL_NOVO_TRATAMENTO);
      await expect(page.getByText("Selecionado: FUNED LORATADINA")).toBeVisible();
      await expect(page.getByPlaceholder("Dipirona")).toHaveValue("FUNED LORATADINA");
      await capturar(page, "novo-medicamento");
    });

    test(`FN-06 TEST-03 meus-lembretes ${viewport.width}px`, async ({ page, api }) => {
      usarAgenda(api, criarAgenda());
      await seedSession(page);
      await page.goto("/meus-lembretes");
      await expect(page.locator("h3").filter({ hasText: "Teste" })).toHaveCount(4);
      await capturar(page, "meus-lembretes");
    });
  });
}
