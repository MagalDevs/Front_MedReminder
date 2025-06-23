'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../utils/api';

type Medicamento = {
  id: number;
  nome: string;
  classificacao: string;
  quantidadeDiaria: number;
  quantidadeCaixa: number;
  horaInicio: string;
  cor: string;
  unidadeMedida: string;
  motivo: string;
  quantidadeDias: number;
  dataValidade: string;
  foto: Blob;
  observacao: string;
  quantidadeDose: string;
  usuario: {
    id?: string | number;
    nome?: string;
    email?: string;
    cep?: string;
    cpf?: string;
    cuidador?: boolean;
    dataNasc?: Date;
    senha?: string;
  };
  usuarioId: number;
};

type Lembrete = {
  id: number;
  medicamentoNome: string;
  data: string;
  horario: string;
  dosagem: string;
  status: 'tomado' | 'pendente';
  medicamento: {
    id: number;
    nome: string;
    cor: string;
    unidadeMedida: string;
  };
};

export default function MeusLembretesContent() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroMedicamento, setFiltroMedicamento] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const medicamentosResponse = await apiRequest<{
          message: string;
          data: Medicamento[];
        }>('remedio/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        setMedicamentos(medicamentosResponse.data);

        const lembretesSimulados = gerarLembretesSimulados(
          medicamentosResponse.data,
        );
        setLembretes(lembretesSimulados);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(
          'Não foi possível carregar seus lembretes. Tente novamente mais tarde.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const gerarLembretesSimulados = (medicamentos: Medicamento[]): Lembrete[] => {
    const lembretes: Lembrete[] = [];
    const hoje = new Date();

    medicamentos.forEach((medicamento) => {
      const horaInicio = medicamento.horaInicio;
      const quantidadeDiaria = medicamento.quantidadeDiaria;

      for (let i = 0; i < quantidadeDiaria; i++) {
        const [hora, minuto] = horaInicio.split(':').map(Number);
        const intervaloHoras = 24 / quantidadeDiaria;
        const horarioLembrete = new Date(hoje);
        horarioLembrete.setHours(hora + i * intervaloHoras, minuto, 0, 0);

        const agora = new Date();
        const status = horarioLembrete <= agora ? 'tomado' : 'pendente';

        lembretes.push({
          id: lembretes.length + 1,
          medicamentoNome: medicamento.nome,
          data: hoje.toISOString().split('T')[0],
          horario: horarioLembrete.toTimeString().slice(0, 5),
          dosagem: `${medicamento.quantidadeDose} ${medicamento.unidadeMedida}`,
          status,
          medicamento: {
            id: medicamento.id,
            nome: medicamento.nome,
            cor: medicamento.cor,
            unidadeMedida: medicamento.unidadeMedida,
          },
        });
      }
    });

    return lembretes.sort((a, b) => a.horario.localeCompare(b.horario));
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return 'Sem data';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const marcarComoTomado = async (lembreteId: number) => {
    try {
      setLembretes(
        lembretes.map((lembrete) =>
          lembrete.id === lembreteId
            ? { ...lembrete, status: 'tomado' as const }
            : lembrete,
        ),
      );
    } catch (err) {
      console.error('Erro ao marcar lembrete como tomado:', err);
    }
  };

  const lembreteFiltrados = lembretes.filter((lembrete) => {
    if (
      filtroMedicamento &&
      lembrete.medicamento.id.toString() !== filtroMedicamento
    ) {
      return false;
    }
    if (filtroStatus && lembrete.status !== filtroStatus) {
      return false;
    }

    const dataLembrete = new Date(lembrete.data);
    const hoje = new Date();

    switch (filtroPeriodo) {
      case 'hoje':
        return dataLembrete.toDateString() === hoje.toDateString();
      case 'semana':
        const semanaAtras = new Date();
        semanaAtras.setDate(hoje.getDate() - 7);
        return dataLembrete >= semanaAtras;
      case 'mes':
        const mesAtras = new Date();
        mesAtras.setDate(hoje.getDate() - 30);
        return dataLembrete >= mesAtras;
      default:
        return true;
    }
  });

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2 ml-10">
            Meus lembretes
          </h1>
          <p className="text-gray-600 KantumruyRegular">
            Visualize seus lembretes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#037F8C]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      ) : lembretes.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto mt-10">
          <div className="text-6xl mb-6">⏰</div>
          <h3 className="text-xl font-semibold mb-3 text-[#037F8C] KantumruySemiBold">
            Nenhum lembrete encontrado
          </h3>
          <p className="text-gray-600 mb-6 KantumruyRegular">
            Você ainda não tem lembretes para hoje. Cadastre seus medicamentos
            para receber lembretes automáticos.
          </p>
          <button
            onClick={() => router.push('/novo-medicamento')}
            className="cursor-pointer bg-[#037F8C] text-white px-6 py-3 rounded-md hover:bg-[#025e6a] transition-colors flex items-center justify-center w-full KantumruyMedium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Adicionar medicamento
          </button>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-[#037F8C] mb-3">
              Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por medicamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamento
                </label>
                <select
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium"
                  value={filtroMedicamento}
                  onChange={(e) => setFiltroMedicamento(e.target.value)}
                >
                  <option value="">Todos os medicamentos</option>
                  {medicamentos.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="tomado">Tomado</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>

              {/* Filtro por período */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium"
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                >
                  <option value="hoje">Hoje</option>
                  <option value="semana">Últimos 7 dias</option>
                  <option value="mes">Últimos 30 dias</option>
                  <option value="todos">Todo o histórico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de lembretes */}
          <div className="space-y-4">
            {lembreteFiltrados.map((lembrete) => (
              <div
                key={lembrete.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center p-4">
                  {/* Checkbox e status */}
                  <div className="flex items-center mr-4">
                    {lembrete.status === 'tomado' ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-orange-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informações do medicamento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-[#037F8C] KantumruySemiBold mr-2">
                        {lembrete.medicamentoNome}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lembrete.status === 'tomado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {lembrete.status === 'tomado' ? 'Tomado' : 'Pendente'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span>{formatarData(lembrete.data)}</span>
                      <span>{lembrete.horario}</span>
                      <span>{lembrete.dosagem}</span>
                    </div>
                  </div>

                  {/* Botão marcar como tomado */}
                  {lembrete.status === 'pendente' && (
                    <div className="ml-4">
                      <button
                        onClick={() => marcarComoTomado(lembrete.id)}
                        className="bg-[#037F8C] text-white px-4 py-2 rounded-md hover:bg-[#025e6a] transition-colors text-sm KantumruyMedium"
                      >
                        ✓ Marcar como tomado
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lembreteFiltrados.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum lembrete encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros para ver mais resultados.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
