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

// Componente filho que usa o hook useSearchParams
function LembreteContent() {
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
    <div className="flex-1">
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
    <>
      <div className="flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <Suspense fallback={<div className="flex-1 p-6">Carregando...</div>}>
          <LembreteContent />
        </Suspense>
      </div>
    </>
  );
}
