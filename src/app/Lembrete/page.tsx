"use client"

import { useState } from "react";
import Sidebar from "../components/Sidebar/sidebar"
import BuscaMedicamento from "../components/CardBusca/cardBusca"
import ConfigurarLembrete from "../components/CardCadastrar/cardCadastrar";

type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

export default function TelaCadastro() {

  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<Medicamento | null>(null);

  const handleMedicamentoSelecionado = (medicamento: Medicamento) => {
    setMedicamentoSelecionado(medicamento);
  };

  return (
    <div className="min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      
      {/* Conteúdo principal - sempre ocupa tela toda */}
      <div className="p-4 pt-16">
        <BuscaMedicamento onSelect={handleMedicamentoSelecionado}/>
        {medicamentoSelecionado && (
          <ConfigurarLembrete medicamentoSelecionado={{
            nome: medicamentoSelecionado.NOME_PRODUTO,
            tipo: medicamentoSelecionado.DESCRIÇÃO,
          }} />
        )}
      </div>
    </div>
  )
}