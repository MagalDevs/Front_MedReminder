'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import Image from 'next/image';

type Medicamento = {
  id: string;
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
};

export default function MedicamentosContent() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchMedicamentos() {
      try {
        setLoading(true);
        const response = await fetch(
          'https://medreminder-backend.onrender.com/remedio',
        );

        if (!response.ok) {
          throw new Error('Falha ao carregar medicamentos');
        }

        const data = await response.json();
        setMedicamentos(data);
      } catch (err) {
        console.error('Erro ao buscar medicamentos:', err);
        setError(
          'Não foi possível carregar seus medicamentos. Tente novamente mais tarde.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMedicamentos();
  }, []);

  const formatarData = (dataString: string) => {
    if (!dataString) return 'Sem data';

    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const calcularDiasRestantes = (dataString: string) => {
    if (!dataString) return 0;

    const data = new Date(dataString);
    const hoje = new Date();
    const diferencaEmMs = data.getTime() - hoje.getTime();
    const diferencaEmDias = Math.ceil(diferencaEmMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diferencaEmDias);
  };

  const navegarParaLembrete = (medicamento: Medicamento) => {
    router.push(
      `/Lembrete?medicamento=${encodeURIComponent(medicamento.nome)}`,
    );
  };

  const excluirMedicamento = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este medicamento?')) {
      try {
        const response = await fetch(
          `https://medreminder-backend.onrender.com/remedio/${id}`,
          {
            method: 'DELETE',
          },
        );

        if (!response.ok) {
          throw new Error('Falha ao excluir medicamento');
        }

        // Atualiza a lista removendo o medicamento excluído
        setMedicamentos(medicamentos.filter((med) => med.id !== id));
      } catch (err) {
        console.error('Erro ao excluir medicamento:', err);
        alert(
          'Não foi possível excluir o medicamento. Tente novamente mais tarde.',
        );
      }
    }
  };
  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
            Meus Medicamentos
          </h1>
          <p className="text-gray-600 KantumruyRegular">
            Gerencie seus medicamentos e lembretes
          </p>
        </div>
        <button
          onClick={() => router.push('/Lembrete')}
          className="mt-4 md:mt-0 bg-[#BE185D] text-white px-4 py-2 rounded-md hover:bg-[#9d1551] transition-colors flex items-center KantumruyMedium"
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
          Adicionar Novo Medicamento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#037F8C]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      ) : medicamentos.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto mt-10">
          <div className="text-6xl mb-6">💊</div>
          <h3 className="text-xl font-semibold mb-3 text-[#037F8C] KantumruySemiBold">
            Nenhum medicamento cadastrado
          </h3>
          <p className="text-gray-600 mb-6 KantumruyRegular">
            Você ainda não tem nenhum medicamento cadastrado. Cadastre seus
            medicamentos para receber lembretes e acompanhar seus tratamentos.
          </p>
          <button
            onClick={() => router.push('/Lembrete')}
            className="bg-[#037F8C] text-white px-6 py-3 rounded-md hover:bg-[#025e6a] transition-colors flex items-center justify-center w-full KantumruyMedium"
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
            Cadastrar Medicamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicamentos.map((medicamento) => (
            <div
              key={medicamento.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div
                className="h-3 w-full"
                style={{ backgroundColor: medicamento.cor || '#037F8C' }}
              ></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[#037F8C] mb-1 KantumruySemiBold">
                      {medicamento.nome}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {medicamento.classificacao}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navegarParaLembrete(medicamento)}
                      className="text-[#037F8C] bg-[#F2F2F2] p-1.5 rounded-full hover:bg-[#E0E0E0] transition-colors"
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
                      onClick={() => excluirMedicamento(medicamento.id)}
                      className="text-red-500 bg-[#F2F2F2] p-1.5 rounded-full hover:bg-[#E0E0E0] transition-colors"
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
                  <div className="flex justify-center items-center w-12 h-12 bg-[#f0f9fa] rounded-full mr-3">
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
                    <p className="font-medium KantumruyMedium text-[#037F8C]">
                      {medicamento.quantidadeDiaria}x ao dia •{' '}
                      {medicamento.unidadeMedida || 'Não especificado'}
                    </p>
                  </div>
                </div>

                {/* Informações sobre quantidade e duração */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 KantumruyRegular">
                      Quantidade na caixa
                    </p>
                    <p className="font-medium KantumruyMedium">
                      {medicamento.quantidadeCaixa} unidades
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 KantumruyRegular">
                      Duração do tratamento
                    </p>
                    <p className="font-medium KantumruyMedium">
                      {medicamento.quantidadeDias} dias
                    </p>
                  </div>
                </div>

                {/* Informações de validade */}
                {medicamento.dataValidade && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 KantumruyRegular">
                          Validade
                        </p>
                        <p className="font-medium KantumruyMedium">
                          {formatarData(medicamento.dataValidade)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 KantumruyRegular">
                          Dias restantes
                        </p>
                        <p
                          className={`font-medium KantumruyMedium ${
                            calcularDiasRestantes(medicamento.dataValidade) < 30
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          {calcularDiasRestantes(medicamento.dataValidade)} dias
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {medicamento.motivo && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 KantumruyRegular mb-1">
                      Observações
                    </p>
                    <p className="text-sm KantumruyRegular">
                      {medicamento.motivo}
                    </p>
                  </div>
                )}

                {/* Botão para visualizar horários */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => navegarParaLembrete(medicamento)}
                    className="text-[#037F8C] text-sm font-medium hover:text-[#025e6a] flex items-center KantumruyMedium"
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
                    Ver horários de administração
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
