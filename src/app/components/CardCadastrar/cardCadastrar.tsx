"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest, ApiError } from "../../utils/api";
import { LembreteContext } from "@/app/contexts/lembreteContext";
import { Loader2 } from "lucide-react";

const Cores = [
  "#FF0000",
  "#4B00FF",
  "#FFFF00",
  "#FFA500",
  "#00CFFF",
  "#FFFFFF",
  "#00FF7F",
  "#006400",
  "#000000",
  "#DA70D6",
];

type Props = {
  medicamentoSelecionado: {
    nome: string;
    tipo: string;
  };
};

type Horario = {
  data: string;
  hora: string;
  dose: string;
};

type ErrosForm = {
  dosagem?: string;
  nome?: string;
  quantidade?: string;
  duracao?: string;
  [key: string]: string | undefined;
};

// Validate calendar components before Date can silently normalize an impossible day.
function dataValida(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dataHoraLocal(data: string, hora: string): Date | null {
  if (!dataValida(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return null;
  const date = new Date(`${data}T${hora}:00`);
  // Also reject local times normalized across a timezone transition.
  return Number.isFinite(date.getTime()) &&
    date.getHours() === Number(hora.slice(0, 2)) &&
    date.getMinutes() === Number(hora.slice(3, 5)) ? date : null;
}

export function validarLoteTratamento(validade: string | null, doses: string[]): ErrosForm {
  const erros: ErrosForm = {};
  if (!validade) erros.validade = "Data de validade é obrigatória";
  else if (!dataValida(validade)) erros.validade = "Data de validade inválida";

  if (doses.length < 1 || doses.length > 1000) {
    erros.horario = "O tratamento deve conter entre 1 e 1000 doses";
  } else if (doses.some((dose) =>
    !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(dose) ||
    !dataValida(dose.slice(0, 10)) || !Number.isFinite(Date.parse(dose)))) {
    erros.horario = "Data ou horário da dose inválido";
  } else if (new Set(doses.map((dose) => Date.parse(dose))).size !== doses.length) {
    erros.horario = "Os horários das doses não podem se repetir";
  }
  return erros;
}

function calcularDoses(inicio: Date, intervaloHoras: number, duracaoDias: number): string[] {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + duracaoDias);
  if (!Number.isFinite(fim.getTime())) return [];
  const doses: string[] = [];
  // Stop at the first excessive dose; never allocate or submit an unbounded batch.
  for (let instante = inicio.getTime(); instante < fim.getTime() && doses.length <= 1000;
    instante += intervaloHoras * 60 * 60 * 1000) {
    doses.push(new Date(instante).toISOString());
  }
  return doses;
}

export default function ConfigurarLembrete({ medicamentoSelecionado }: Props) {
  const context = useContext(LembreteContext);
  const { user, isAuthenticated } = useAuth();
  const intencao = useRef<{ identidade: string; chave: string } | null>(null);
  const enviando = useRef(false);
  const sessionEpoch = useRef(0);
  useEffect(() => {
    const epoch = sessionEpoch;
    epoch.current++;
    intencao.current = null;
    return () => { epoch.current++; };
  }, [isAuthenticated, user?.id, user?.email]);
  const [erros, setErros] = useState<ErrosForm>({});
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || "");
  const [dosagem, setDosagem] = useState("");
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || "");
  const [isLoading, setIsLoading] = useState(false);
  const [corSelecionada, setCorSelecionada] = useState("#FF0000");
  const [horarios, setHorarios] = useState<Horario[]>([
    {
      data: new Date().toLocaleDateString("sv-SE"),
      hora: "10:00",
      dose: "1 comp.",
    },
  ]);
  const [motivo, setMotivo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [validade, setValidade] = useState<string | null>(null);
  const [intervalo, setIntervalo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [unidade, setUnidade] = useState("mg");
  const [unidadeDosagem, setUnidadeDosagem] = useState("mg");
  const [unidadeDuracao, setUnidadeDuracao] = useState(1);

  useEffect(() => {
    setNome(medicamentoSelecionado?.nome || "");
    setTipo(medicamentoSelecionado?.tipo || "");
  }, [medicamentoSelecionado]);

  const atualizarHorario = (
    index: number,
    campo: keyof Horario,
    valor: string,
  ) => {
    const novosHorarios = [...horarios];
    novosHorarios[index][campo] = valor;
    setHorarios(novosHorarios);
  };
  const validarFormulario = (): boolean => {
    const novosErros: ErrosForm = {};

    if (!nome.trim()) novosErros.nome = "Nome do medicamento é obrigatório";

    if (!dosagem.trim()) {
      novosErros.dosagem = "Dosagem é obrigatória";
    } else if (!Number.isFinite(Number(dosagem)) || Number(dosagem) <= 0) {
      novosErros.dosagem = "Dosagem deve ser maior que zero";
    }

    if (!quantidade.trim()) {
      novosErros.quantidade = "Quantidade é obrigatória";
    } else if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
      novosErros.quantidade = "Quantidade deve ser maior que zero";
    }

    if (!duracao.trim()) {
      novosErros.duracao = "Duração é obrigatória";
    } else if (!Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
      novosErros.duracao = "Duração deve ser maior que zero";
    }

    if (!intervalo.trim()) {
      novosErros.intervalo = "Intervalo é obrigatório";
    } else if (!Number.isInteger(Number(intervalo)) || Number(intervalo) <= 0) {
      novosErros.intervalo = "Intervalo deve ser maior que zero";
    }

    if (horarios.length === 0 || !horarios[0].hora) {
      novosErros.horario = "Horário da primeira dose é obrigatório";
    }

    if (!validade) novosErros.validade = "Data de validade é obrigatória";
    else if (!dataValida(validade)) novosErros.validade = "Data de validade inválida";
    if (horarios[0]?.hora && !dataHoraLocal(horarios[0].data, horarios[0].hora)) {
      novosErros.horario = "Data ou horário da primeira dose inválido";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvarLembrete = async () => {
    if (enviando.current) return;
    if (!validarFormulario()) {
      alert("Por favor, corrija os erros no formulário");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!isAuthenticated || !token) {
      alert("Você precisa estar logado para salvar um lembrete");
      return;
    }
    if (!user || !user.id) {
      alert(
        "Não foi possível identificar seu usuário. Por favor, faça login novamente.",
      );
      return;
    }

    const horaInicio = dataHoraLocal(horarios[0].data, horarios[0].hora)!;
    const dosesISO = calcularDoses(horaInicio, parseInt(intervalo), parseInt(duracao) * unidadeDuracao);
    const errosLote = validarLoteTratamento(validade, dosesISO);
    if (Object.keys(errosLote).length > 0) {
      setErros(errosLote);
      alert("Por favor, corrija os erros no formulário");
      return;
    }

    const submittedEpoch = sessionEpoch.current;
    const currentSession = () => sessionEpoch.current === submittedEpoch && localStorage.getItem("access_token") === token;
    enviando.current = true;
    setIsLoading(true);
    try {
      const nomeCores: Record<string, string> = {
        "#FF0000": "Vermelho",
        "#4B00FF": "Azul",
        "#FFFF00": "Amarelo",
        "#FFA500": "Laranja",
        "#00CFFF": "Azul claro",
        "#FFFFFF": "Branco",
        "#00FF7F": "Verde claro",
        "#006400": "Verde escuro",
        "#000000": "Preto",
        "#DA70D6": "Orquídea",
      };

      const dadosMedicamento = {
        nome: nome,
        quantidadeCaixa: parseInt(quantidade) || 0,
        dataValidade: validade,
        quantidadeDiaria: parseInt(intervalo) || 0,
        foto: "https://example.com/image.jpg",
        classificacao: tipo || "Não classificado",
        horaInicio: horaInicio.toISOString(),
        cor: nomeCores[corSelecionada] || "Vermelho",
        unidadeMedida: unidade,
        motivo: motivo || "Não especificado",
        quantidadeDias: parseInt(duracao) || 0,
        quantidadeDose:
          parseFloat(dosagem) > 0
            ? `${dosagem} ${unidadeDosagem}`
            : `1 ${unidadeDosagem}`,
        observacao: observacoes || "",
      };

      const corpo = JSON.stringify({ remedio: dadosMedicamento, doses: dosesISO });
      const identidade = JSON.stringify([user.id, user.email, corpo]);
      if (intencao.current?.identidade !== identidade) {
        intencao.current = { identidade, chave: crypto.randomUUID() };
      }
      const resposta = await apiRequest<{
        data: { remedio: { id: number }; doses: unknown[] };
      }>("tratamento", {
        method: "POST",
        headers: { "Idempotency-Key": intencao.current.chave },
        body: corpo,
      });
      if (!currentSession()) return;
      if (!Number.isInteger(resposta?.data?.remedio?.id) ||
          resposta.data.remedio.id <= 0 || !Array.isArray(resposta.data.doses) ||
          resposta.data.doses.length !== dosesISO.length) {
        throw new Error("Não foi possível confirmar o tratamento criado. Tente novamente.");
      }
      intencao.current = null;
      alert("Lembrete e doses salvos com sucesso!");
      limparFormulario();
      await context?.getLembretes();
    } catch (error) {
      if (!currentSession()) return;
      let mensagemErro = error instanceof Error ? error.message : "Erro ao salvar o lembrete. Tente novamente.";
      if (error instanceof ApiError) {
        if (error.status === 401) {
          mensagemErro = "Sua sessão expirou. Por favor, faça login novamente.";
        } else if (error.status === 409) {
          mensagemErro = "Conflito ao salvar o tratamento. Verifique os dados antes de tentar novamente.";
        } else if (error.status === 503) {
          mensagemErro = "Serviço indisponível. Tente novamente mais tarde.";
        }
      }
      alert(mensagemErro);
    } finally {
      enviando.current = false;
      setIsLoading(false);
    }
  };

  const limparFormulario = () => {
    intencao.current = null;
    setNome("");
    setDosagem("");
    setTipo("");
    setCorSelecionada("#FF0000");
    setHorarios([
      {
        data: new Date().toLocaleDateString("sv-SE"),
        hora: "10:00",
        dose: "1 comp.",
      },
    ]);
    setMotivo("");
    setDuracao("");
    setQuantidade("");
    setValidade(null);
    setIntervalo("");
    setObservacoes("");
    setUnidade("mg");
    setUnidadeDuracao(1);
    setErros({});
  };

  return (
    <div className="bg-[#D9D9D9] p-6 rounded-xl shadow-lg m-6 ">
      <h2 className="text-xl font-bold text-[#0B6E71] mb-5">
        Sobre o medicamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Nome</label>
          <input
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.nome ? "border-red-500" : "border-[#037F8C]"
            }`}
            placeholder="Dipirona"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {erros.nome && (
            <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
          )}
        </div>

        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Tipo</label>
          <input
            className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
            placeholder="Analgésico"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Quantidade da caixa
          </label>
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.quantidade ? "border-red-500" : "border-[#037F8C]"
            }`}
          >
            <input
              type="number"
              min="0"
              placeholder="30"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className={`w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium`}
            />
            <select
              className="w-20 text-sm p-2 bg-gray-50 border-l border-[#037F8C] outline-none text-gray-700 KantumruyMedium cursor-pointer hover:bg-gray-100 transition-colors"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="comp">comp</option>
              <option value="gotas">gotas</option>
              <option value="sachê">sachê</option>
            </select>
          </div>
          {erros.quantidade && (
            <p className="text-red-500 text-sm mt-1">{erros.quantidade}</p>
          )}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Data de validade
          </label>
          <input
            type="date"
            aria-label="Data de validade"
            value={validade || ""}
            onChange={(e) => setValidade(e.target.value)}
            className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-full border-[#037F8C]`}
          />
          {erros.validade && <p className="text-red-500 text-sm mt-1">{erros.validade}</p>}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Cor identificadora
          </label>
          <div className="flex flex-wrap gap-2 my-2">
            {Cores.map((cor, i) => (
              <div
                key={i}
                className={`w-5 h-8 rounded cursor-pointer border hover:border-black ${
                  corSelecionada === cor
                    ? "border-black border-2"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: cor }}
                onClick={() => setCorSelecionada(cor)}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#0B6E71] mb-5 mt-5">
        Sobre o tratamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Motivo (sintomas)
          </label>
          <input
            type="text"
            placeholder="Dor de cabeça"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="p-2 border border-[#037F8C] rounded bg-white outline-none w-full text-gray-700 KantumruyMedium"
          />
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Primeira dose
          </label>
          {horarios.map((h, index) => (
            <div key={index} className="flex gap-2 items-center mb-2">
              <input
                type="date"
                value={h.data}
                onChange={(e) =>
                  atualizarHorario(index, "data", e.target.value)
                }
                className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-40 ${
                  erros.horario ? "border-red-500" : "border-[#037F8C]"
                }`}
              />
              <input
                type="time"
                value={h.hora}
                onChange={(e) =>
                  atualizarHorario(index, "hora", e.target.value)
                }
                className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-28 ${
                  erros.horario ? "border-red-500" : "border-[#037F8C]"
                }`}
              />
            </div>
          ))}
          {erros.horario && (
            <p className="text-red-500 text-sm mb-2">{erros.horario}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Dosagem</label>
          {/* Input de dosagem com select de unidade */}
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.dosagem ? "border-red-500" : "border-[#037F8C]"
            }`}
          >
            <input
              className="w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium"
              placeholder="500"
              value={dosagem}
              onChange={(e) => setDosagem(e.target.value)}
              type="number"
              min="0"
              step="0.1"
            />
            <select
              className="w-20 text-sm p-2 bg-gray-50 border-l border-[#037F8C] outline-none text-gray-700 KantumruyMedium cursor-pointer hover:bg-gray-100 transition-colors"
              value={unidadeDosagem}
              onChange={(e) => setUnidadeDosagem(e.target.value)}
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="comp">comp</option>
              <option value="gotas">gotas</option>
              <option value="sachê">sachê</option>
            </select>
          </div>
          {erros.dosagem && (
            <p className="text-red-500 text-sm mt-1">{erros.dosagem}</p>
          )}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            De quantas em quantas horas?
          </label>
          <input
            type="number"
            min="0"
            placeholder="6 (horas)"
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            className={`w-full p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium mb-1 ${
              erros.intervalo ? "border-red-500" : "border-[#037F8C]"
            }`}
          />
          {erros.intervalo && (
            <p className="text-red-500 text-sm mb-2">{erros.intervalo}</p>
          )}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Duração do tratamento
          </label>
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.duracao ? "border-red-500" : "border-[#037F8C]"
            }`}
          >
            <input
              type="number"
              placeholder="7"
              value={duracao}
              min="0"
              onChange={(e) => setDuracao(e.target.value)}
              className={`w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium`}
            />
            <select
              className="w-30 text-sm p-2 bg-gray-50 border-l border-[#037F8C] outline-none text-gray-700 KantumruyMedium cursor-pointer hover:bg-gray-100 transition-colors"
              value={unidadeDuracao}
              onChange={(e) => setUnidadeDuracao(parseInt(e.target.value))}
            >
              <option value={1}>dias</option>
              <option value={7}>semanas</option>
              <option value={30}>meses</option>
            </select>
          </div>
          {erros.duracao && (
            <p className="text-red-500 text-sm mt-1">{erros.duracao}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Observações
          </label>
          <textarea
            placeholder="Tomar após as refeições"
            className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4 resize-none"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={salvarLembrete}
          disabled={isLoading}
          className="bg-[#0B6E71] text-white py-2 px-6 rounded-lg hover:bg-[#044D55] hover:cursor-pointer transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </div>
          ) : (
            "Salvar lembrete"
          )}
        </button>

        <button
          onClick={limparFormulario}
          disabled={isLoading}
          className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors font-medium max-w-[calc(100%-64px)]"
        >
          Limpar formulário
        </button>
      </div>
    </div>
  );
}
