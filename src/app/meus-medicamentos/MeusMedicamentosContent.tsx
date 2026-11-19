'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../utils/api';
import { getSessionIdentity } from '../utils/session-storage';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import ConfirmDialog from '../components/Feedback/ConfirmDialog';
import { useToast } from '../components/Feedback/ToastProvider';
import { RequestContractError, requestErrorMessage } from '../utils/request-errors';
import { dataDeValidade, diasAteValidade } from '../utils/date-filters';

type FiltroValidade = '' | 'vencidos' | 'proximos' | 'validos' | 'sem-data';

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
  }
  usuarioId: number;
};

export default function MeusMedicamentosContent() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<{
    id: number;
    nome: string;
    session: string | null;
  } | null>(null);
  const [medicamentoSelecionado, setFiltroMedicamento] = useState('');
  const [filtroValidade, setFiltroValidade] = useState<FiltroValidade>('');
  const deletion = useRef<AbortController | null>(null);
  const session = getSessionIdentity();
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = () => active && !controller.signal.aborted && getSessionIdentity() === session;
    async function fetchMedicamentos() {
      try {
        setLoading(true);
        setError('');
        setDeleteError(null);
        setDeleting(null);
        setPendingDeletion(null);
        setMedicamentos([]);

        const response = await apiRequest<{
          message: string;
          data: [];
        }>('remedio/me', {
          method: 'GET',
          signal: controller.signal,
        });

        if (!current()) return;
        if (!response || !Array.isArray(response.data) || !response.data.every((item: Medicamento) => item && typeof item.id === 'number' && typeof item.nome === 'string')) throw new RequestContractError();
        setMedicamentos(response.data);
      } catch (err) {
        if (current()) setError(requestErrorMessage(err) || '');
      } finally {
        if (current()) setLoading(false);
      }
    }

    void fetchMedicamentos();
    return () => { active = false; controller.abort(); deletion.current?.abort(); deletion.current = null; };
  }, [session]);

  const formatarClassificacao = (texto: string) => {
    if (!texto || texto !== texto.toLocaleUpperCase('pt-BR')) return texto;
    return texto.charAt(0) + texto.slice(1).toLocaleLowerCase('pt-BR');
  };

  const navegarParaLembrete = (medicamento: Medicamento) => {
    router.push(`/meus-lembretes?medicamentoId=${medicamento.id}`);
  };

  const excluirMedicamento = async (id: number) => {
    setPendingDeletion(null);
    if (deletion.current || getSessionIdentity() !== session) return;
    const controller = new AbortController();
    deletion.current = controller;
    const current = () => !controller.signal.aborted && getSessionIdentity() === session;
    setDeleting(id);
    setDeleteError(null);
    try {
      await apiRequest<{
        message: string;
        data: [];
      }>(`remedio/${id}`, {
        method: 'DELETE',
        signal: controller.signal,
      });
      if (current()) {
        setMedicamentos(previous => previous.filter((med) => med.id !== id));
        setFiltroMedicamento(previous => previous === String(id) ? '' : previous);
        showToast('success', 'Medicamento excluído com sucesso.');
      }
    } catch (err) {
      if (current()) setDeleteError(requestErrorMessage(err));
    } finally {
      if (deletion.current === controller) deletion.current = null;
      if (current()) setDeleting(null);
    }
  };

  const hoje = new Date();
  const medicamentosFiltrados = medicamentos
    .filter((medicamento) => !medicamentoSelecionado || String(medicamento.id) === medicamentoSelecionado)
    .map((medicamento) => {
      const validade = dataDeValidade(medicamento.dataValidade);
      return { medicamento, validade, dias: validade ? diasAteValidade(validade, hoje) : null };
    })
    .filter(({ dias }) => {
      switch (filtroValidade) {
        case 'vencidos': return dias !== null && dias < 0;
        case 'proximos': return dias !== null && dias >= 0 && dias <= 30;
        case 'validos': return dias !== null && dias > 30;
        case 'sem-data': return dias === null;
        default: return true;
      }
    });

  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 pb-6 pt-20 md:p-6">
      {pendingDeletion && pendingDeletion.session === session && (
        <ConfirmDialog
          title="Excluir medicamento?"
          message={`Deseja excluir “${pendingDeletion.nome}” da sua lista de medicamentos?`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDeletion(null)}
          onConfirm={() => void excluirMedicamento(pendingDeletion.id)}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
            Meus medicamentos
          </h1>
          <p className="text-gray-600 KantumruyRegular">
            Visualize seus medicamentos
          </p>
        </div>
        { medicamentos.length != 0 && (
          <button
            onClick={() => router.push('/novo-medicamento')}
            className="med-button med-button--primary mt-4 md:mt-0"
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
        )}
      </div>

      {deleteError && <RequestFeedback context="Ao excluir medicamento" message={deleteError} />}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#037F8C]"></div>
        </div>
      ) : error ? (
        <RequestFeedback context="Ao carregar medicamentos" message={error} />
      ) : medicamentos.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto mt-10">
          <div className="text-6xl mb-6">💊</div>
          <h3 className="text-xl font-semibold mb-3 text-[#037F8C] KantumruySemiBold">
            Nenhum medicamento encontrado
          </h3>
          <p className="text-gray-600 mb-6 KantumruyRegular">
            Você ainda não tem nenhum medicamento cadastrado. Cadastre seus
            medicamentos para receber lembretes e acompanhar seus tratamentos.
          </p>
          <button
            onClick={() => router.push('/novo-medicamento')}
            className="med-button med-button--primary w-full"
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
            <h2 className="text-lg font-semibold text-[#037F8C] mb-3">Filtros</h2>
            <div className="flex flex-wrap gap-4">
              {/* Filtro por medicamento */}
              <div className="w-full sm:w-80 sm:max-w-full">
                <label htmlFor="filtro-medicamento" className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamento
                </label>{' '}
                <select
                  id="filtro-medicamento"
                  className="w-full min-h-11 p-2 border border-[#037F8C] rounded-md bg-white text-gray-700 KantumruyMedium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]"
                  value={medicamentoSelecionado}
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
              <div className="w-full sm:w-60 sm:max-w-full">
                <label htmlFor="filtro-validade" className="block text-sm font-medium text-gray-700 mb-1">
                  Validade
                </label>{' '}
                <select
                  id="filtro-validade"
                  className="w-full min-h-11 p-2 border border-[#037F8C] rounded-md bg-white text-gray-700 KantumruyMedium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]"
                  value={filtroValidade}
                  onChange={(e) => setFiltroValidade(e.target.value as FiltroValidade)}
                >
                  <option value="">Todas as validades</option>
                  <option value="vencidos">Vencidos</option>
                  <option value="proximos">Vencem nos próximos 30 dias</option>
                  <option value="validos">Vencem após 30 dias</option>
                  <option value="sem-data">Sem data</option>
                </select>
              </div>
              {(medicamentoSelecionado || filtroValidade) && (
                <button
                  type="button"
                  className="med-button med-button--ghost self-end"
                  onClick={() => {
                    setFiltroMedicamento('');
                    setFiltroValidade('');
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
          {medicamentosFiltrados.length === 0 && (
            <p role="status" className="py-8 text-center text-gray-600">
              Nenhum medicamento corresponde aos filtros.
            </p>
          )}
          <div className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start gap-6 ${medicamentosFiltrados.length === 1 ? 'mx-auto max-w-xl' : ''}`}>
            {medicamentosFiltrados.map(({ medicamento, validade, dias }) => (
              <div
                key={medicamento.id}
                className="min-w-0 bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="h-3 w-full"
                  style={{ backgroundColor: medicamento.cor || '#037F8C' }}
                ></div>
                <div className="p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div className="min-w-0 flex-1 basis-44">
                      <h3 className="text-xl font-semibold text-[#037F8C] mb-1 KantumruySemiBold break-words">
                        {medicamento.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatarClassificacao(medicamento.classificacao)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => navegarParaLembrete(medicamento)}
                        className="med-button med-button--ghost px-2"
                        title="Editar medicamento"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPendingDeletion({ id: medicamento.id, nome: medicamento.nome, session })}
                        disabled={deleting !== null}
                        className="med-button med-button--danger px-2"
                        title="Excluir medicamento"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Ícone de medicamento e informações de dose */}
                  <div className="flex items-center mb-4">
                    <div className="flex shrink-0 justify-center items-center w-10 h-10 bg-[#f0f9fa] rounded-full mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-[#037F8C]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 KantumruyRegular">
                        Dose diária
                      </p>
                      <p className="text-sm text-gray-700 KantumruyRegular">
                        {medicamento.quantidadeDiaria}x ao dia •{' '}
                        {medicamento.quantidadeDose || 'Não especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Informações sobre quantidade e duração */}
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-col gap-1 bg-gray-50 px-3 py-2 rounded-lg">
                      <dt className="text-xs text-gray-600 KantumruyRegular">
                        Quantidade na caixa
                      </dt>
                      <dd className="text-sm KantumruyMedium">
                        {medicamento.quantidadeCaixa} {medicamento.unidadeMedida}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1 bg-gray-50 px-3 py-2 rounded-lg">
                      <dt className="text-xs text-gray-600 KantumruyRegular">
                        Duração do tratamento
                      </dt>
                      <dd className="text-sm KantumruyMedium">
                        {medicamento.quantidadeDias} dias
                      </dd>
                    </div>
                  </dl>

                  {/* Informações de validade */}
                  {validade && dias !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 KantumruyRegular">
                            Validade
                          </p>
                          <p className="font-medium KantumruyMedium">
                            {validade.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 KantumruyRegular">
                            Dias restantes
                          </p>
                          <p
                            className={`font-medium KantumruyMedium ${
                              dias <= 30
                                ? 'text-red-500'
                                : 'text-green-500'
                            }`}
                          >
                            {Math.max(0, dias)} dias
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Motivo e observações */}
                  {medicamento.motivo && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 KantumruyRegular mb-1">
                          Motivo
                        </p>
                        <p className="text-sm KantumruyRegular">
                          {medicamento.motivo}
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 KantumruyRegular mb-1">
                          Observações
                        </p>
                        <p className="text-sm KantumruyRegular">
                          {medicamento.observacao || '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botão para visualizar horários */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                    <button
                      onClick={() => navegarParaLembrete(medicamento)}
                      className="med-button med-button--primary w-full"
                    >
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
                      Ver horários das doses
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
