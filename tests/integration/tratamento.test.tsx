// BEAPI-07/BEAPI-08: formulário e providers reais; transporte sintético atômico.
// Tabelas literais de instantes preservam os horários locais e o fim exclusivo.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import ConfigurarLembrete from "@/app/components/CardCadastrar/cardCadastrar";
import { AuthProvider, useAuth } from "@/app/contexts/AuthContext";
import { LembreteContext, LembreteProvider } from "@/app/contexts/lembreteContext";
import Pagina from "@/app/novo-medicamento/page";
import { API_URL } from "@/app/utils/api";
import { treatmentResponseFixture, getProfileFixture, type TreatmentRequest } from "../fixtures/backend-contracts";

// O fuso também é definido em vitest.config.mts; repetir aqui garante o fuso
// se o arquivo for executado com outra configuração.
process.env.TZ = "America/Sao_Paulo";

const { parametrosBusca } = vi.hoisted(() => ({
  parametrosBusca: { atual: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/novo-medicamento",
  useSearchParams: () => parametrosBusca.atual,
}));

// A barra lateral não participa do cadastro; evita next/image e SidebarContext.
vi.mock("@/app/components/Sidebar/sidebar", () => ({ default: () => null }));

const RELOGIO_FIXO = "2026-11-04T12:00:00-03:00";
const MSG_SUCESSO = "Lembrete e doses salvos com sucesso!";
const MSG_CORRIJA = "Por favor, corrija os erros no formulário";

// ---------------------------------------------------------------------------
// Fake da API (contrato derivado dos payloads reais enviados pelo formulário)
// ---------------------------------------------------------------------------

type Chamada = {
  metodo: string;
  caminho: string;
  corpo: unknown;
  cabecalhos: Headers;
};

type Config = {
  remedio?: "ok" | "erro500" | "semId" | "incerta";
  doses?: "ok" | "erro500";
  idsRemedio?: number[];
};

type DoseFake = {
  id: number;
  tomado: boolean;
  data_dose: string;
  remedioId: number;
  remedio: Record<string, unknown>;
};

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function criarApi(config: Config = {}) {
  const chamadas: Chamada[] = [];
  const remedios: Record<string, unknown>[] = [];
  const doses: DoseFake[] = [];
  const idsRemedio = [...(config.idsRemedio ?? [77, 78, 79])];
  let proximaDose = 100;
  const operacoes = new Map<string, { remedio: Record<string, unknown>; doses: DoseFake[] }>();
  let primeiraResposta = true;

  const fetchFake = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const metodo = init?.method ?? "GET";
      const cabecalhos = new Headers(init?.headers);
      const corpo =
        typeof init?.body === "string" ? JSON.parse(init.body) : undefined;

      if (url.endsWith(".csv")) {
        return new Response("NOME_PRODUTO,DESCRIÇÃO\nDIPIRONA,Analgésico\n");
      }
      if (!url.startsWith(API_URL)) {
        throw new Error(`Fetch fora da API simulada: ${metodo} ${url}`);
      }
      const caminho = url.slice(API_URL.length);
      chamadas.push({ metodo, caminho, corpo, cabecalhos });

      if (metodo === "GET" && caminho === "/dose/me") {
        return json({ message: "ok", data: doses });
      }
      if (metodo === "GET" && caminho === "/usuario/me") return json(getProfileFixture);
      if (metodo === "POST" && caminho === "/tratamento") {
        if (config.remedio === "erro500" || config.doses === "erro500") {
          return json({ message: "Falha simulada no tratamento" }, 500);
        }
        if (config.remedio === "semId") return json({ message: "criado", data: { doses: [] } });
        const chave = cabecalhos.get("Idempotency-Key")!;
        const payload = corpo as TreatmentRequest<Record<string, unknown>>;
        if (!operacoes.has(chave)) {
          const id = idsRemedio.shift() ?? 999;
          const remedio = { ...payload.remedio, id };
          const novasDoses = payload.doses.map((data) => ({
            id: proximaDose++, tomado: false, data_dose: data, remedioId: id, remedio,
          }));
          remedios.push(remedio);
          doses.push(...novasDoses);
          operacoes.set(chave, { remedio, doses: novasDoses });
        }
        if (config.remedio === "incerta" && primeiraResposta) {
          primeiraResposta = false;
          throw new TypeError("Failed to fetch");
        }
        return json({ ...treatmentResponseFixture, data: operacoes.get(chave) });
      }
      throw new Error(`Rota não simulada: ${metodo} ${caminho}`);
    },
  );
  vi.stubGlobal("fetch", fetchFake);

  // Session restoration is independently covered by BEAPI-03; preserve the
  // exact treatment mutation/reload sequence after it has completed.
  const rotulos = () => chamadas.filter((c) => c.caminho !== "/usuario/me").map((c) => `${c.metodo} ${c.caminho}`);
  const posts = (caminho: string) =>
    chamadas.filter((c) => c.metodo === "POST" && c.caminho === caminho);
  return { chamadas, remedios, doses, rotulos, posts };
}

// ---------------------------------------------------------------------------
// Montagem e preenchimento
// ---------------------------------------------------------------------------

function EstadoSessao() {
  const { loading } = useAuth();
  return <output data-testid="sessao-pronta">{loading ? "carregando" : "pronta"}</output>;
}

function ListaLembretes() {
  const contexto = useContext(LembreteContext);
  return (
    <ul aria-label="lembretes-recarregados">
      {contexto?.lembretes.map((l) => (
        <li key={l.id}>{`${l.remedio.nome}|${String(l.data_dose)}`}</li>
      ))}
    </ul>
  );
}

function instalarRelogio(iso = RELOGIO_FIXO) {
  // Só Date: promises, waitFor e setTimeout continuam reais.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

function sessao(logado = true) {
  if (!logado) return;
  window.localStorage.setItem("access_token", "token-sintetico");
  window.localStorage.setItem(
    "user_data",
    JSON.stringify({ id: 1, nome: "Ana Teste", email: "ana@example.test" }),
  );
}

function montar(
  medicamento = { nome: "Dipirona", tipo: "Analgésico" },
  { comProvider = true } = {},
) {
  const formulario = <ConfigurarLembrete medicamentoSelecionado={medicamento} />;
  return render(
    <AuthProvider>
      <EstadoSessao />
      {comProvider ? (
        <LembreteProvider>
          {formulario}
          <ListaLembretes />
        </LembreteProvider>
      ) : (
        formulario
      )}
    </AuthProvider>,
  );
}

type Campos = {
  nome?: string;
  dosagem?: string;
  unidadeDosagem?: string;
  quantidade?: string;
  unidadeCaixa?: string;
  intervalo?: string;
  duracao?: string;
  unidadeDuracao?: string;
  data?: string;
  hora?: string;
  validade?: string;
  motivo?: string;
  observacoes?: string;
  corHex?: string;
};

const VALIDOS: Campos = {
  validade: "2027-12-31",
  dosagem: "500",
  quantidade: "30",
  intervalo: "8",
  duracao: "1",
  data: "2026-11-04",
  hora: "08:00",
};

function preencher(container: HTMLElement, campos: Campos) {
  const mudar = (el: Element, valor: string) =>
    fireEvent.change(el, { target: { value: valor } });
  const datas = container.querySelectorAll('input[type="date"]');
  const selects = screen.getAllByRole("combobox");

  if (campos.nome !== undefined) mudar(screen.getByPlaceholderText("Dipirona"), campos.nome);
  if (campos.dosagem !== undefined) mudar(screen.getByPlaceholderText("500"), campos.dosagem);
  if (campos.quantidade !== undefined) mudar(screen.getByPlaceholderText("30"), campos.quantidade);
  if (campos.intervalo !== undefined) mudar(screen.getByPlaceholderText("6 (horas)"), campos.intervalo);
  if (campos.duracao !== undefined) mudar(screen.getByPlaceholderText("7"), campos.duracao);
  if (campos.unidadeCaixa !== undefined) mudar(selects[0], campos.unidadeCaixa);
  if (campos.unidadeDosagem !== undefined) mudar(selects[1], campos.unidadeDosagem);
  if (campos.unidadeDuracao !== undefined) mudar(selects[2], campos.unidadeDuracao);
  if (campos.validade !== undefined) mudar(datas[0], campos.validade);
  if (campos.data !== undefined) mudar(datas[1], campos.data);
  if (campos.hora !== undefined) mudar(container.querySelector('input[type="time"]')!, campos.hora);
  if (campos.motivo !== undefined) mudar(screen.getByPlaceholderText("Dor de cabeça"), campos.motivo);
  if (campos.observacoes !== undefined) mudar(screen.getByPlaceholderText("Tomar após as refeições"), campos.observacoes);
  if (campos.corHex !== undefined) {
    const rgb = hexParaRgb(campos.corHex);
    const alvo = Array.from(container.querySelectorAll<HTMLElement>("div[style]")).find(
      (d) => d.style.backgroundColor === rgb,
    );
    if (!alvo) throw new Error(`Cor não encontrada: ${campos.corHex}`);
    fireEvent.click(alvo);
  }
}

function hexParaRgb(hex: string) {
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `rgb(${n(1)}, ${n(3)}, ${n(5)})`;
}

const aguardarSessao = () => waitFor(() => expect(screen.getByTestId("sessao-pronta")).toHaveTextContent("pronta"));
const salvar = async () => {
  await aguardarSessao();
  fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));
};

const formatarLocal = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(iso));

let alerta: MockInstance<(mensagem?: unknown) => void>;

beforeEach(() => {
  // Isolamento: relógio, fuso, sessão, alert e logs de erro esperados.
  instalarRelogio();
  expect(new Date().getTimezoneOffset()).toBe(180);
  sessao();
  alerta = vi.spyOn(window, "alert").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  parametrosBusca.atual = new URLSearchParams();
});

// ---------------------------------------------------------------------------
// UT-12 - validações
// ---------------------------------------------------------------------------

describe("UT-12 TEST-01 validação do formulário de tratamento", () => {
  it("UT-12 TEST-01 campos vazios mostram as mensagens e não enviam mutação", async () => {
    const api = criarApi();
    montar();
    await waitFor(() => expect(api.rotulos()).toEqual(["GET /dose/me"]));

    await salvar();

    expect(await screen.findByText("Dosagem é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Quantidade é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Duração é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Intervalo é obrigatório")).toBeInTheDocument();
    expect(alerta).toHaveBeenCalledWith(MSG_CORRIJA);
    expect(api.posts("/tratamento")).toHaveLength(0);
  });

  it("UT-12 TEST-01 valores zero mostram 'maior que zero' e não enviam mutação", async () => {
    const api = criarApi();
    const { container } = montar();
    preencher(container, { ...VALIDOS, dosagem: "0", quantidade: "0", duracao: "0", intervalo: "0" });

    await salvar();

    expect(await screen.findByText("Dosagem deve ser maior que zero")).toBeInTheDocument();
    expect(screen.getByText("Quantidade deve ser maior que zero")).toBeInTheDocument();
    expect(screen.getByText("Duração deve ser maior que zero")).toBeInTheDocument();
    expect(screen.getByText("Intervalo deve ser maior que zero")).toBeInTheDocument();
    expect(alerta).toHaveBeenCalledWith(MSG_CORRIJA);
    expect(api.posts("/tratamento")).toHaveLength(0);
  });

  it("UT-12 TEST-01 horário inicial ausente mostra a mensagem e não envia mutação", async () => {
    const api = criarApi();
    const { container } = montar();
    preencher(container, { ...VALIDOS, hora: "" });

    await salvar();

    expect(
      await screen.findByText("Horário da primeira dose é obrigatório"),
    ).toBeInTheDocument();
    expect(alerta).toHaveBeenCalledWith(MSG_CORRIJA);
    expect(api.posts("/tratamento")).toHaveLength(0);
  });

  it("UT-12 TEST-01 nome em branco mostra a mensagem e não envia mutação", async () => {
    const api = criarApi();
    const { container } = montar({ nome: "", tipo: "" });
    preencher(container, VALIDOS);

    await salvar();

    expect(await screen.findByText("Nome do medicamento é obrigatório")).toBeInTheDocument();
    expect(api.posts("/tratamento")).toHaveLength(0);
  });

  it("UT-12 TEST-01 fixture válida prossegue e limpa as mensagens de erro", async () => {
    const api = criarApi();
    const { container } = montar();
    await salvar(); // primeiro com erros
    expect(await screen.findByText("Dosagem é obrigatória")).toBeInTheDocument();

    preencher(container, VALIDOS);
    await salvar();

    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));
    expect(screen.queryByText("Dosagem é obrigatória")).not.toBeInTheDocument();
    expect(api.posts("/tratamento")).toHaveLength(1);
  });

  it("UT-12 TEST-01 sem token não envia mutação e pede login", async () => {
    window.localStorage.clear();
    const api = criarApi();
    // Sem LembreteProvider: sem token, o GET inicial do provider rejeita sem catch
    // (achado A-01, lembreteContext.tsx:54-56) e geraria erro não tratado.
    const { container } = montar(undefined, { comProvider: false });
    preencher(container, VALIDOS);

    await salvar();

    await waitFor(() =>
      expect(alerta).toHaveBeenCalledWith("Você precisa estar logado para salvar um lembrete"),
    );
    expect(api.posts("/tratamento")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UT-13 - horários e serialização ISO
// ---------------------------------------------------------------------------

describe("UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo)", () => {
  it("UT-13 TEST-01 início 04/11 08:00, intervalo 8h, duração 1 dia: doses 04/11 08:00, 04/11 16:00 e 05/11 00:00; 05/11 08:00 exclusivo", async () => {
    const api = criarApi();
    const { container } = montar();
    preencher(container, VALIDOS);

    await salvar();
    await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

    // Tabela literal: horário local (-03:00) -> ISO UTC esperado.
    const tabela = [
      { local: "04/11/2026, 08:00", iso: "2026-11-04T11:00:00.000Z" },
      { local: "04/11/2026, 16:00", iso: "2026-11-04T19:00:00.000Z" },
      { local: "05/11/2026, 00:00", iso: "2026-11-05T03:00:00.000Z" },
    ];
    const enviado = (api.posts("/tratamento")[0].corpo as { doses: string[] }).doses;
    expect(enviado).toEqual(tabela.map((l) => l.iso));
    // Offset correto: cada ISO enviado, lido em America/Sao_Paulo, é o horário local da tabela.
    expect(enviado.map(formatarLocal)).toEqual(tabela.map((l) => l.local));
    // Limite final exclusivo: 05/11 08:00 local = 2026-11-05T11:00:00.000Z.
    expect(enviado).not.toContain("2026-11-05T11:00:00.000Z");
    // horaInicio do medicamento = primeira dose.
    expect((api.posts("/tratamento")[0].corpo as { remedio: { horaInicio: string } }).remedio.horaInicio).toBe(
      "2026-11-04T11:00:00.000Z",
    );
  });

  const casos: {
    nome: string;
    campos: Campos;
    esperado: string[];
  }[] = [
    {
      nome: "08:00, a cada 12h, 1 dia -> 08:00 e 20:00 (08:00 do dia seguinte exclusivo)",
      campos: { ...VALIDOS, intervalo: "12" },
      esperado: ["2026-11-04T11:00:00.000Z", "2026-11-04T23:00:00.000Z"],
    },
    {
      nome: "08:00, a cada 24h, 1 semana -> 7 doses diárias às 08:00 (04/11 a 10/11)",
      campos: { ...VALIDOS, intervalo: "24", duracao: "1", unidadeDuracao: "7" },
      esperado: [
        "2026-11-04T11:00:00.000Z",
        "2026-11-05T11:00:00.000Z",
        "2026-11-06T11:00:00.000Z",
        "2026-11-07T11:00:00.000Z",
        "2026-11-08T11:00:00.000Z",
        "2026-11-09T11:00:00.000Z",
        "2026-11-10T11:00:00.000Z",
      ],
    },
  ];

  it.each(casos)(
    "UT-13 TEST-01 $nome",
    async ({ campos, esperado }) => {
      const api = criarApi();
      const { container } = montar();
      preencher(container, campos);

      await salvar();
      await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

      expect((api.posts("/tratamento")[0].corpo as { doses: string[] }).doses).toEqual(esperado);
    },
  );

  // Regressão D-01: serializar instantes diretamente conserva o dia local após 21h.
  it(
    "UT-13 TEST-01 BEAPI-08 [regressão D-01] doses locais >= 21:00 mantêm o dia local: 10:30, a cada 6h, 1 dia",
    async () => {
      const api = criarApi();
      const { container } = montar();
      preencher(container, { ...VALIDOS, hora: "10:30", intervalo: "6" });

      await salvar();
      await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

      expect((api.posts("/tratamento")[0].corpo as { doses: string[] }).doses).toEqual([
        "2026-11-04T13:30:00.000Z", // 04/11 10:30 local
        "2026-11-04T19:30:00.000Z", // 04/11 16:30 local
        "2026-11-05T01:30:00.000Z", // 04/11 22:30 local
        "2026-11-05T07:30:00.000Z", // 05/11 04:30 local
      ]);
    },
  );

  // Regressão D-02: construir a data completa evita transbordo do mês do relógio.
  it(
    "UT-13 TEST-01 BEAPI-08 [regressão D-02] horaInicio de 30/11/2026 08:00 enviada com relógio em 31/10/2026",
    async () => {
      instalarRelogio("2026-10-31T12:00:00-03:00");
      const api = criarApi();
      const { container } = montar();
      preencher(container, { ...VALIDOS, data: "2026-11-30" });

      await salvar();
      await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

      expect((api.posts("/tratamento")[0].corpo as { remedio: { horaInicio: string } }).remedio.horaInicio).toBe(
        "2026-11-30T11:00:00.000Z",
      );
    },
  );
});

// ---------------------------------------------------------------------------
// IT-05 - fluxo completo
// ---------------------------------------------------------------------------

describe("IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real)", () => {
  it("IT-05 TEST-02 BEAPI-07 ordem POST tratamento -> GET lista; cada dose usa o ID criado e o horário esperado; recarga exibe os dados persistidos", async () => {
    const api = criarApi({ idsRemedio: [77] });
    const { container } = montar();
    preencher(container, VALIDOS);
    await waitFor(() => expect(api.rotulos()).toEqual(["GET /dose/me"]));

    await salvar();

    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));
    expect(api.rotulos()).toEqual([
      "GET /dose/me", // carga inicial do provider
      "POST /tratamento",
      "GET /dose/me", // recarga depois da gravação
    ]);
    expect(api.posts("/tratamento")[0].corpo).toEqual({
      remedio: expect.objectContaining({ nome: "Dipirona", horaInicio: "2026-11-04T11:00:00.000Z" }),
      doses: [
        "2026-11-04T11:00:00.000Z",
        "2026-11-04T19:00:00.000Z",
        "2026-11-05T03:00:00.000Z",
      ],
    });
    // A lista recarregada reflete o que o fake persistiu a partir dos payloads reais.
    const lista = await screen.findByRole("list", { name: "lembretes-recarregados" });
    await waitFor(() => expect(within(lista).getAllByRole("listitem")).toHaveLength(3));
    expect(within(lista).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Dipirona|2026-11-04T11:00:00.000Z",
      "Dipirona|2026-11-04T19:00:00.000Z",
      "Dipirona|2026-11-05T03:00:00.000Z",
    ]);
    expect(api.doses.every((d) => d.remedioId === 77)).toBe(true);
  });

  it("IT-05 TEST-02 payload do medicamento preserva unidades, cor, validade e valores do formulário", async () => {
    const api = criarApi();
    const { container } = montar({ nome: "Dipirona", tipo: "Analgésico" });
    preencher(container, {
      ...VALIDOS,
      dosagem: "1.5",
      unidadeDosagem: "ml",
      quantidade: "30",
      unidadeCaixa: "gotas",
      validade: "2027-03-15",
      corHex: "#4B00FF",
      motivo: "Dor de cabeça",
      observacoes: "Tomar após as refeições",
    });

    await salvar();
    await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

    expect((api.posts("/tratamento")[0].corpo as TreatmentRequest).remedio).toEqual({
      nome: "Dipirona",
      quantidadeCaixa: 30,
      dataValidade: "2027-03-15",
      quantidadeDiaria: 8, // o formulário envia o intervalo (8) neste campo
      foto: "https://example.com/image.jpg",
      classificacao: "Analgésico",
      horaInicio: "2026-11-04T11:00:00.000Z",
      cor: "Azul",
      unidadeMedida: "gotas",
      motivo: "Dor de cabeça",
      quantidadeDias: 1,
      quantidadeDose: "1.5 ml",
      observacao: "Tomar após as refeições",
    });
    const req = api.posts("/tratamento")[0];
    expect(req.cabecalhos.get("Authorization")).toBe("Bearer token-sintetico");
    expect(req.cabecalhos.get("Content-Type")).toBe("application/json");
  });

  it.each([
    ["#FF0000", "Vermelho"],
    ["#4B00FF", "Azul"],
    ["#FFFF00", "Amarelo"],
    ["#FFA500", "Laranja"],
    ["#00CFFF", "Azul claro"],
    ["#FFFFFF", "Branco"],
    ["#00FF7F", "Verde claro"],
    ["#006400", "Verde escuro"],
    ["#000000", "Preto"],
    ["#DA70D6", "Orquídea"],
  ])("IT-05 TEST-02 cor %s é enviada como '%s'", async (hex, nomeCor) => {
    const api = criarApi();
    const { container } = montar();
    preencher(container, { ...VALIDOS, corHex: hex });

    await salvar();
    await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

    expect((api.posts("/tratamento")[0].corpo as { remedio: { cor: string } }).remedio.cor).toBe(nomeCor);
  });

  it("IT-05 TEST-02 campos opcionais vazios usam os padrões atuais (motivo, classificação, observação)", async () => {
    const api = criarApi();
    const { container } = montar({ nome: "Dipirona", tipo: "" });
    preencher(container, VALIDOS);

    await salvar();
    await waitFor(() => expect(api.posts("/tratamento")).toHaveLength(1));

    expect((api.posts("/tratamento")[0].corpo as TreatmentRequest).remedio).toMatchObject({
      motivo: "Não especificado",
      classificacao: "Não classificado",
      dataValidade: "2027-12-31",
      observacao: "",
      unidadeMedida: "mg",
      quantidadeDose: "500 mg",
      cor: "Vermelho",
    });
  });

  it("IT-05 TEST-02 após o sucesso o formulário volta aos valores iniciais", async () => {
    const api = criarApi();
    const { container } = montar();
    preencher(container, { ...VALIDOS, motivo: "Dor de cabeça" });

    await salvar();
    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));

    expect(screen.getByPlaceholderText("Dipirona")).toHaveValue("");
    expect(screen.getByPlaceholderText("500")).toHaveValue(null);
    expect(screen.getByPlaceholderText("Dor de cabeça")).toHaveValue("");
    expect(container.querySelector('input[type="time"]')).toHaveValue("10:00");
    expect(api.posts("/tratamento")).toHaveLength(1);
  });

  it("IT-05 TEST-02 enquanto grava, o botão mostra 'Salvando...' e fica desabilitado; duplo clique envia um único cadastro", async () => {
    const api = criarApi();
    const original = (globalThis.fetch as unknown as MockInstance<typeof fetch>).getMockImplementation()!;
    let liberar!: () => void;
    const portao = new Promise<void>((resolve) => (liberar = resolve));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "POST" && String(input).endsWith("/tratamento")) await portao;
        return original(input, init);
      }),
    );
    const { container } = montar();
    preencher(container, VALIDOS);

    await aguardarSessao();
    const botaoSalvar = screen.getByRole("button", { name: "Salvar lembrete" });
    fireEvent.click(botaoSalvar);
    fireEvent.click(botaoSalvar); // segundo clique no mesmo botão, já desabilitado

    const botao = await screen.findByRole("button", { name: /Salvando/ });
    expect(botao).toBeDisabled();
    expect(screen.getByRole("button", { name: "Limpar formulário" })).toBeDisabled();
    liberar();
    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));
    expect(api.posts("/tratamento")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled();
  });

  it("IT-05 TEST-02 fluxo pela página: medicamento vindo da busca (?medicamento=) preenche nome e tipo e vai no payload", async () => {
    parametrosBusca.atual = new URLSearchParams("medicamento=Dipirona");
    const api = criarApi();
    const { container } = render(
      <AuthProvider>
      <EstadoSessao />
        <LembreteProvider>
          <Pagina />
        </LembreteProvider>
      </AuthProvider>,
    );

    // CSV simulado: o item "DIPIRONA" é selecionado e o formulário recebe nome e tipo.
    await waitFor(() => expect(screen.getByPlaceholderText("Dipirona")).toHaveValue("DIPIRONA"));
    expect(screen.getByPlaceholderText("Analgésico")).toHaveValue("Analgésico");

    preencher(container, { ...VALIDOS, nome: undefined });
    await salvar();

    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));
    expect((api.posts("/tratamento")[0].corpo as TreatmentRequest).remedio).toMatchObject({
      nome: "DIPIRONA",
      classificacao: "Analgésico",
    });
  });
});

// ---------------------------------------------------------------------------
// Falhas do cadastro atômico e reenvio manual.
describe("IT-05 BEAPI-07 BEAPI-08 falha no tratamento", () => {
  it.each([{ remedio: "erro500" as const }, { doses: "erro500" as const }])(
    "IT-05 BEAPI-07 falha transacional %j não cria nada, não recarrega e preserva o formulário",
    async (config) => {
      const api = criarApi(config);
      const { container } = montar();
      preencher(container, { ...VALIDOS, motivo: "Dor de cabeça" });
      await waitFor(() => expect(api.rotulos()).toEqual(["GET /dose/me"]));
      await salvar();
      await waitFor(() => expect(alerta).toHaveBeenCalledWith("Falha simulada no tratamento"));
      expect(alerta).toHaveBeenCalledTimes(1);
      expect(alerta).not.toHaveBeenCalledWith(MSG_SUCESSO);
      expect(api.rotulos()).toEqual(["GET /dose/me", "POST /tratamento"]);
      expect(api.remedios).toHaveLength(0);
      expect(api.doses).toHaveLength(0);
      expect(screen.getByPlaceholderText("500")).toHaveValue(500);
      expect(screen.getByPlaceholderText("Dor de cabeça")).toHaveValue("Dor de cabeça");
    },
  );

  it("IT-05 BEAPI-07 envelope sem data.remedio não confirma sucesso", async () => {
    const api = criarApi({ remedio: "semId" });
    const { container } = montar();
    preencher(container, VALIDOS);
    await salvar();
    await waitFor(() => expect(alerta).toHaveBeenCalledWith("Não foi possível confirmar o tratamento criado. Tente novamente."));
    expect(alerta).not.toHaveBeenCalledWith(MSG_SUCESSO);
    expect(api.posts("/tratamento")).toHaveLength(1);
  });

  it("IT-13 BEAPI-07 FE-08 reenvio após resposta incerta não duplica o medicamento", async () => {
    const api = criarApi({ remedio: "incerta", idsRemedio: [77, 78] });
    const { container } = montar();
    preencher(container, VALIDOS);
    await salvar();
    await waitFor(() => expect(alerta).toHaveBeenCalledWith("Failed to fetch"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar lembrete" })).toBeEnabled());
    expect(api.posts("/tratamento")).toHaveLength(1);
    await salvar();
    await waitFor(() => expect(alerta).toHaveBeenCalledWith(MSG_SUCESSO));
    const posts = api.posts("/tratamento");
    expect(posts).toHaveLength(2);
    expect(posts[0].cabecalhos.get("Idempotency-Key")).toBe(posts[1].cabecalhos.get("Idempotency-Key"));
    expect(posts[0].corpo).toEqual(posts[1].corpo);
    expect(api.remedios).toHaveLength(1);
    expect(api.doses).toHaveLength(3);
  });
});
