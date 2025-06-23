'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar/sidebar';
import BuscaMedicamento from '../components/CardBusca/cardBusca';
import ConfigurarLembrete from '../components/CardCadastrar/cardCadastrar';

type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

function NovoMedicamentoContent() {
  const [medicamentoSelecionado, setMedicamentoSelecionado] =
    useState<Medicamento | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const medicamento = searchParams.get('medicamento');

    if (medicamento) {
      setMedicamentoSelecionado({
        NOME_PRODUTO: medicamento,
        DESCRIÇÃO: '',
      });
    }
  }, [searchParams]);

  const handleMedicamentoSelecionado = (medicamento: Medicamento) => {
    setMedicamentoSelecionado(medicamento);
  };
  
  return (
    <div className="flex-1 p-6 overflow-y-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2 ml-10">
            Adicionar medicamento
          </h1>
          <p className="text-gray-600 KantumruyRegular ml-10">
            Cadastre lembretes para seus medicamentos
          </p>
        </div>
      </div>

      <BuscaMedicamento
        onSelect={handleMedicamentoSelecionado}
        medicamentoInicial={medicamentoSelecionado?.NOME_PRODUTO}
      />
      {medicamentoSelecionado && (
        <ConfigurarLembrete
          medicamentoSelecionado={{
            nome: medicamentoSelecionado.NOME_PRODUTO,
            tipo: medicamentoSelecionado.DESCRIÇÃO,
          }}
        />
      )}
    </div>
  );
}

// Componente principal que usa Suspense
export default function Lembrete() {

  return (
    <div className="flex min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      <div className="flex-1">
        <Suspense fallback={<div className="p-6">Carregando...</div>}>
          <NovoMedicamentoContent />
        </Suspense>
      </div>
    </div>
  );
}
