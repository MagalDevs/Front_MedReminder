"use client"

import { useState } from "react";

const Cores = [
  "#FF0000", "#4B00FF", "#FFFF00", "#FFA500", "#00CFFF",
  "#FFFFFF", "#00FF7F", "#006400", "#000000", "#DA70D6"
];

type Props = {
  medicamentoSelecionado: {
    nome: string;
    tipo: string;
    dosagem?: string;
  }
}

export default function ConfigurarLembrete({ medicamentoSelecionado }) {
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || "");
  const [dosagem, setDosagem] = useState(medicamentoSelecionado?.dosagem || "");
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || "");
  const [corSelecionada, setCorSelecionada] = useState("#FF0000");
  const [horarios, setHorarios] = useState([{ hora: "10:00", dose: "1 comp." }]);
  const [repetir, setRepetir] = useState("");
  const [duracao, setDuracao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [validade, setValidade] = useState("");
  const [quantDiaria, setQuantDiaria] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const adicionarHorario = () => {
    setHorarios([...horarios, { hora: "", dose: "" }]);
  };

  const removerHorario = (index) => {
    setHorarios(horarios.filter((_, i) => i !== index));
  };

  const atualizarHorario = (index, campo, valor) => {
    const novosHorarios = [...horarios];
    novosHorarios[index][campo] = valor;
    setHorarios(novosHorarios);
  };

  const salvarLembrete = () => {
    const lembrete = {
      nome,
      dosagem,
      tipo,
      cor: corSelecionada,
      horarios,
      repetir,
      duracao,
      observacoes,
    };
    console.log("Lembrete salvo:", lembrete);
    // Aqui você pode fazer uma requisição para salvar no banco
  };

  return (
    <div className="bg-[#D9D9D9] p-6 rounded-xl shadow-lg m-6">
      <h2 className="text-xl font-bold text-[#0B6E71] mb-4">Configurar lembrete</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input className="p-2 border rounded outline-none" placeholder="Nome do medicamento" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className="p-2 border rounded outline-none" placeholder="Dosagem" value={dosagem} onChange={(e) => setDosagem(e.target.value)} />
        <input className="p-2 border rounded outline-none" placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} />
      </div>

      <label className="font-medium text-[#0B6E71]">Cor identificadora</label>
      <div className="flex flex-wrap gap-2 my-2">
        {Cores.map((cor, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded cursor-pointer border hover:border-black ${corSelecionada === cor ? "border-black" : "border-transparent"}`}
            style={{ backgroundColor: cor }}
            onClick={() => setCorSelecionada(cor)}
          ></div>
        ))}
      </div>

      <label className="font-medium text-[#0B6E71] block mt-4">Horários para tomar</label>
      {horarios.map((h, index) => (
        <div key={index} className="flex gap-2 items-center mb-2">
          <input type="time" value={h.hora} onChange={(e) => atualizarHorario(index, "hora", e.target.value)} className="p-2 rounded border w-28" />
          <input type="text" placeholder="Dose" value={h.dose} onChange={(e) => atualizarHorario(index, "dose", e.target.value)} className="p-2 rounded border w-24" />
          <button onClick={() => removerHorario(index)} className="text-red-600 font-bold">X</button>
        </div>
      ))}
      <button onClick={adicionarHorario} className="border-dashed border-2 border-[#0B6E71] px-4 py-2 rounded text-[#0B6E71] mb-4">+ Adicionar Horário</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <select className="p-2 border rounded outline-none" value={repetir} onChange={(e) => setRepetir(e.target.value)}>
          <option value="">Repetir</option>
          <option value="Diariamente">Diariamente</option>
          <option value="Semanalmente">Semanalmente</option>
          <option value="Mensalmente">Mensalmente</option>
        </select>
        <input type="text" placeholder="Duração do tratamento" value={duracao} onChange={(e) => setDuracao(e.target.value)} className="p-2 border rounded outline-none" />
        <input type="text" placeholder="Quantidade do remédio" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="p-2 border rounded outline-none" />
        <input type="text" placeholder="Data de validade" value={validade} onChange={(e) => setValidade(e.target.value)} className="p-2 border rounded outline-none" />
      </div>

      <input type="text" placeholder="Quantidade diária" value={quantDiaria} onChange={(e) => setQuantDiaria(e.target.value)} className="w-full p-2 border rounded outline-none mb-4" />

      <textarea
        placeholder="Observações"
        className="w-full p-2 border rounded outline-none mb-4"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      ></textarea>

      <button
        onClick={salvarLembrete}
        className="bg-[#0B6E71] text-white py-2 px-6 rounded-lg hover:opacity-90"
      >
        Salvar lembrete
      </button>
    </div>
  );
}
