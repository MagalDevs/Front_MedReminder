'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../utils/api';
import { getSessionIdentity } from '../utils/session-storage';
import { LembreteContext } from '../contexts/lembreteContext';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { RequestContractError, requestErrorMessage } from '../utils/request-errors';
import { filtroDePeriodo, type Periodo } from '../utils/date-filters';

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
  usuarioId: number;
};

export default function MeusLembretesContent({ medicamentoId, nomeMedicamento }: { medicamentoId?: string; nomeMedicamento?: string } = {}) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<{ session: string | null; ids: Set<number> }>({ session: null, ids: new Set() });
  const mutation = useRef<AbortController | null>(null);
  const session = getSessionIdentity();
  const confirmedIds = confirmedSnapshot.session === session ? confirmedSnapshot.ids : new Set<number>();
  const [medicamentoSelecionado, setFiltroMedicamento] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<Periodo>(medicamentoId || nomeMedicamento ? 'todos' : 'hoje');
  const router = useRouter();
  const lembreteContext = useContext(LembreteContext);
  const getLembretes = lembreteContext?.getLembretes;
  const lembretes = lembreteContext?.lembretes ?? [];

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = () => active && !controller.signal.aborted && getSessionIdentity() === session;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        setConfirmationError(null);
        setConfirmationStatus('');
        setConfirmedSnapshot({ session, ids: new Set() });
        setSavingId(null);
        const medicamentosResponse = await apiRequest<{
          message: string;
          data: Medicamento[];
        }>('remedio/me', {
          method: 'GET',
          signal: controller.signal,
        });

        if (!current()) return;
        if (!medicamentosResponse || !Array.isArray(medicamentosResponse.data) || !medicamentosResponse.data.every(item => item && typeof item.id === 'number' && typeof item.nome === 'string')) throw new RequestContractError();
        setMedicamentos(medicamentosResponse.data);

        if (getLembretes) {
          await getLembretes();
        }
      } catch (err) {
        if (current()) setError(requestErrorMessage(err) || '');
      } finally {
        if (current()) setLoading(false);
      }
    }

    void fetchData();
    return () => { active = false; controller.abort(); mutation.current?.abort(); mutation.current = null; };
  }, [getLembretes, session]);

  const formatarData = (dataString: Date) => {
    if (!dataString) return 'Sem data';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const marcarComoTomado = async (lembreteId: number) => {
    if (mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    const current = () => !controller.signal.aborted && getSessionIdentity() === session;
    setSavingId(lembreteId);
    setConfirmationError(null);
    setConfirmationStatus('');
    try {
      if (!confirmedIds.has(lembreteId)) {
        await apiRequest(`dose/${lembreteId}`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tomado: true,
        }),
        });
        if (!current()) return;
        setConfirmedSnapshot(previous => ({ session, ids: new Set(previous.session === session ? previous.ids : []).add(lembreteId) }));
      }

      if (getLembretes) {
        const refreshed = await getLembretes();
        if (!current()) return;
        if (refreshed === false) setConfirmationStatus('Dose confirmada. A atualização dos lembretes não foi concluída.');
      }
    } catch (err) {
      if (current()) setConfirmationError(requestErrorMessage(err));
    } finally {
      if (mutation.current === controller) mutation.current = null;
      if (current()) setSavingId(null);
    }
  };

  const filtroInicial = medicamentos.find((med) =>
    medicamentoId ? String(med.id) === medicamentoId : med.nome === nomeMedicamento,
  )?.id.toString() ?? '';
  const filtroMedicamento = medicamentoSelecionado ?? filtroInicial;
  const periodoSelecionado = filtroDePeriodo(filtroPeriodo, new Date(), 'lembretes');
  const lembreteFiltrados = lembretes.filter((lembrete) =>
    (!filtroMedicamento || String(lembrete.remedioId ?? lembrete.remedio.id) === filtroMedicamento) &&
    (!filtroStatus || String(lembrete.tomado) === filtroStatus) &&
    periodoSelecionado(lembrete.data_dose),
  );

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
          Meus lembretes
        </h1>
        <p className="text-gray-600 KantumruyRegular">
          Visualize seus lembretes
        </p>
      </header>

      {confirmationError && <RequestFeedback context="Ao confirmar dose" message={confirmationError} />}
      {confirmationStatus && <RequestFeedback kind="success" message={confirmationStatus} />}
      {loading || (lembreteContext?.lembretesLoading && lembretes.length === 0) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#037F8C]"></div>
        </div>
      ) : error ? (
        <RequestFeedback context="Ao carregar medicamentos dos lembretes" message={error} />
      ) : lembreteContext?.lembretesError && lembretes.length === 0 ? (
        <p>Os lembretes não puderam ser carregados.</p>
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
          <div className="@container mb-6 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#037F8C] mb-3">
              Filtros
            </h2>
            <div className="grid max-w-[39rem] grid-cols-1 gap-4 @min-[24rem]:grid-cols-[10rem_11rem] @min-[39rem]:grid-cols-[16rem_10rem_11rem]">
              {/* Filtro por medicamento */}
              <div className="min-w-0 @min-[24rem]:col-span-2 @min-[24rem]:max-w-64 @min-[39rem]:col-span-1">
                <label htmlFor="filtro-medicamento" className="mb-2 block text-sm font-medium text-gray-700">
                  Medicamento
                </label>
                <select
                  id="filtro-medicamento"
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white text-gray-700 KantumruyMedium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]"
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
                <label htmlFor="filtro-status" className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="filtro-status"
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white text-gray-700 KantumruyMedium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="true">Tomado</option>
                  <option value="false">Pendente</option>
                </select>
              </div>

              {/* Filtro por período */}
              <div>
                <label htmlFor="filtro-periodo" className="mb-2 block text-sm font-medium text-gray-700">
                  Período
                </label>
                <select
                  id="filtro-periodo"
                  className="w-full p-2 border border-[#037F8C] rounded-md bg-white text-gray-700 KantumruyMedium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]"
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value as Periodo)}
                >
                  <option value="hoje">Hoje</option>
                  <option value="semana">Últimos 7 dias</option>
                  <option value="mes">Últimos 30 dias</option>
                  <option value="todos">Todos os dias</option>
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
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 @min-[32rem]:grid-cols-[auto_minmax(0,1fr)_auto]">
                  {/* Checkbox e status */}
                  <div className="flex items-center">
                    {lembrete.tomado === true ? (
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
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-lg font-semibold wrap-anywhere text-[#037F8C] KantumruySemiBold">
                        {lembrete.remedio.nome}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lembrete.tomado === true
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {lembrete.tomado === true ? 'Tomado' : 'Pendente'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>{formatarData(lembrete.data_dose)}</span>
                      <span>{lembrete.remedio.quantidadeDose}</span>
                    </div>
                  </div>

                  {/* Botão marcar como tomado */}
                  {lembrete.tomado === false &&
                    new Date(lembrete.data_dose) <= new Date() && (
                      <div className="col-span-2 @min-[32rem]:col-span-1">
                        <button
                          onClick={() => marcarComoTomado(lembrete.id)}
                          disabled={savingId !== null}
                          className="bg-[#037F8C] text-white px-4 py-2 rounded-md hover:bg-[#025e6a] transition-colors text-sm KantumruyMedium"
                        >
                          {savingId === lembrete.id ? 'Carregando...' : confirmedIds.has(lembrete.id) ? 'Atualizar lembretes' : '✓ Marcar como tomado'}
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
    </>
  );
}
