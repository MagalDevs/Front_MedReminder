'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar/sidebar';
import BuscaMedicamento from '../components/CardBusca/cardBusca';
import ConfigurarLembrete from '../components/CardCadastrar/cardCadastrar';
type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

export default function Lembrete() {
  const [medicamentoSelecionado, setMedicamentoSelecionado] =
    useState<Medicamento | null>(null);
  const searchParams = useSearchParams();
  useEffect(() => {
    const medicamento = searchParams.get('medicamento');

    if (medicamento) {
      // Se o medicamento foi passado pela URL, podemos buscar a descrição
      // nos dados da aplicação ou simplesmente pré-preencher o nome
      setMedicamentoSelecionado({
        NOME_PRODUTO: medicamento,
        DESCRIÇÃO: '', // A descrição pode ser preenchida pelo componente de busca
      });
    }
  }, [searchParams]);

  const handleMedicamentoSelecionado = (medicamento: Medicamento) => {
    setMedicamentoSelecionado(medicamento);
  };

  return (
    <>
      <div className=" flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
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
      </div>
    </>
  );
}
