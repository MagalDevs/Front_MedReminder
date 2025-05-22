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
    <>
      <div className=" flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <div className="flex-1">
          <BuscaMedicamento onSelect={handleMedicamentoSelecionado}/>
          {medicamentoSelecionado && (
        <ConfigurarLembrete medicamentoSelecionado={{
          nome: medicamentoSelecionado.NOME_PRODUTO,
          tipo: medicamentoSelecionado.DESCRIÇÃO,
        }} />
      )}
        </div>
      </div>
    </>
  )
}