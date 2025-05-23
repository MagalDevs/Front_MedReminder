'use client';

import { useState, useEffect } from 'react';

type RegistroHistorico = {
  id: string;
  medicamentoId: string;
  nomeMedicamento: string;
  dataHora: string;
  status: 'tomado' | 'nao_tomado' | 'adiado';
  observacao?: string;
};

type Medicamento = {
  id: string;
  nome: string;
  cor: string;
};

export default function HistoricoContent() {
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroMedicamento, setFiltroMedicamento] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos');

  useEffect(() => {
    async function fetchDados() {
      try {
        setLoading(true);

        // Buscar medicamentos
        const responseMedicamentos = await fetch(
          'https://medreminder-backend.onrender.com/remedio',
        );
        if (!responseMedicamentos.ok) {
          throw new Error('Falha ao carregar medicamentos');
        }
        const medicamentosData = await responseMedicamentos.json();
        setMedicamentos(medicamentosData);

        // Buscar histórico
        // Simulando uma chamada à API de histórico (você precisará implementar essa API no backend)
        // const responseHistorico = await fetch('https://medreminder-backend.onrender.com/historico');

        // Enquanto a API não está implementada, vamos criar dados simulados
        const dataAtual = new Date();
        const historicoDados: RegistroHistorico[] = [];

        // Criar registros simulados para os últimos 30 dias
        for (let i = 0; i < 30; i++) {
          const data = new Date(dataAtual);
          data.setDate(data.getDate() - i);

          // Para cada medicamento, criar alguns registros
          medicamentosData.forEach((med: Medicamento, index: number) => {
            // Criar de 0 a 3 registros por dia para cada medicamento
            const registrosPorDia = Math.floor(Math.random() * 4);

            for (let j = 0; j < registrosPorDia; j++) {
              const hora = Math.floor(Math.random() * 24);
              const minutos = Math.floor(Math.random() * 60);
              const dataHora = new Date(data);
              dataHora.setHours(hora, minutos);

              const status = ['tomado', 'nao_tomado', 'adiado'][
                Math.floor(Math.random() * 3)
              ] as 'tomado' | 'nao_tomado' | 'adiado';

              historicoDados.push({
                id: `hist-${i}-${index}-${j}`,
                medicamentoId: med.id,
                nomeMedicamento: med.nome,
                dataHora: dataHora.toISOString(),
                status,
                observacao:
                  status === 'adiado' ? 'Adiado para mais tarde' : undefined,
              });
            }
          });
        }

        setRegistros(historicoDados);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(
          'Não foi possível carregar o histórico. Tente novamente mais tarde.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDados();
  }, []);

  // Filtrar registros com base nos filtros selecionados
  const registrosFiltrados = registros.filter((registro) => {
    // Filtro por medicamento
    if (filtroMedicamento && registro.medicamentoId !== filtroMedicamento) {
      return false;
    }

    // Filtro por status
    if (filtroStatus && registro.status !== filtroStatus) {
      return false;
    }

    // Filtro por período
    if (filtroPeriodo !== 'todos') {
      const dataRegistro = new Date(registro.dataHora);
      const dataAtual = new Date();

      switch (filtroPeriodo) {
        case 'hoje':
          const hoje = new Date();
          return (
            dataRegistro.getDate() === hoje.getDate() &&
            dataRegistro.getMonth() === hoje.getMonth() &&
            dataRegistro.getFullYear() === hoje.getFullYear()
          );

        case 'semana':
          const umaSemanaAtras = new Date();
          umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
          return dataRegistro >= umaSemanaAtras && dataRegistro <= dataAtual;

        case 'mes':
          const umMesAtras = new Date();
          umMesAtras.setMonth(umMesAtras.getMonth() - 1);
          return dataRegistro >= umMesAtras && dataRegistro <= dataAtual;
      }
    }

    return true;
  });

  // Agrupar registros por data
  const registrosAgrupados = registrosFiltrados.reduce(
    (grupos: Record<string, RegistroHistorico[]>, registro) => {
      const data = new Date(registro.dataHora).toLocaleDateString('pt-BR');

      if (!grupos[data]) {
        grupos[data] = [];
      }

      grupos[data].push(registro);
      return grupos;
    },
    {},
  );

  // Ordenar datas (mais recentes primeiro)
  const datasOrdenadas = Object.keys(registrosAgrupados).sort((a, b) => {
    const dataA = new Date(a.split('/').reverse().join('-'));
    const dataB = new Date(b.split('/').reverse().join('-'));
    return dataB.getTime() - dataA.getTime();
  });
  const formatarHora = (dataString: string) => {
    return new Date(dataString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'tomado':
        return { texto: 'Tomado', classe: 'bg-green-100 text-green-800' };
      case 'nao_tomado':
        return { texto: 'Não tomado', classe: 'bg-red-100 text-red-800' };
      case 'adiado':
        return { texto: 'Adiado', classe: 'bg-yellow-100 text-yellow-800' };
      default:
        return { texto: status, classe: 'bg-gray-100 text-gray-800' };
    }
  };

  // Encontrar a cor correspondente ao medicamento
  const getMedicamentoCor = (medicamentoId: string) => {
    const medicamento = medicamentos.find((med) => med.id === medicamentoId);
    return medicamento?.cor || '#037F8C';
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
            Histórico de Medicamentos
          </h1>
          <p className="text-gray-600 KantumruyRegular">
            Acompanhe os medicamentos que você tomou
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-[#037F8C] mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por medicamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicamento
            </label>{' '}
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
            </label>{' '}
            <select
              className="w-full p-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="tomado">Tomado</option>
              <option value="nao_tomado">Não tomado</option>
              <option value="adiado">Adiado</option>
            </select>
          </div>

          {/* Filtro por período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>{' '}
            <select
              className="w-full p-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >
              <option value="todos">Todo o histórico</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Últimos 30 dias</option>
            </select>
          </div>
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
      ) : registrosFiltrados.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto mt-10">
          <div className="text-6xl mb-6">📅</div>
          <h3 className="text-xl font-semibold mb-3 text-[#037F8C] KantumruySemiBold">
            Nenhum histórico encontrado
          </h3>
          <p className="text-gray-600 mb-6 KantumruyRegular">
            {filtroMedicamento || filtroStatus || filtroPeriodo !== 'todos'
              ? 'Não encontramos registros com os filtros selecionados. Tente ajustar os filtros.'
              : 'Você ainda não tem registros de medicamentos. Comece a usar o MedReminder para acompanhar seu tratamento!'}
          </p>
          <button
            onClick={() => {
              setFiltroMedicamento('');
              setFiltroStatus('');
              setFiltroPeriodo('todos');
            }}
            className="bg-[#037F8C] text-white px-6 py-3 rounded-md hover:bg-[#025e6a] transition-colors flex items-center justify-center w-full KantumruyMedium"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {datasOrdenadas.map((data) => (
            <div
              key={data}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-[#F7F7F7] px-4 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#037F8C] mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h2 className="text-md font-semibold KantumruySemiBold text-gray-800">
                    {data}
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {registrosAgrupados[data]
                  .sort(
                    (a, b) =>
                      new Date(b.dataHora).getTime() -
                      new Date(a.dataHora).getTime(),
                  )
                  .map((registro) => (
                    <div key={registro.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div
                          className="w-2 h-12 rounded-full mr-4 self-center"
                          style={{
                            backgroundColor: getMedicamentoCor(
                              registro.medicamentoId,
                            ),
                          }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium KantumruyMedium text-[#037F8C]">
                              {registro.nomeMedicamento}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                statusLabel(registro.status).classe
                              }`}
                            >
                              {statusLabel(registro.status).texto}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-500 text-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
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
                            <span className="KantumruyRegular">
                              {formatarHora(registro.dataHora)}
                            </span>
                          </div>
                          {registro.observacao && (
                            <p className="mt-2 text-sm text-gray-600 KantumruyRegular">
                              {registro.observacao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
