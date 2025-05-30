'use client';

import { useState, useEffect } from 'react';

const Cores = [
  '#FF0000',
  '#4B00FF',
  '#FFFF00',
  '#FFA500',
  '#00CFFF',
  '#FFFFFF',
  '#00FF7F',
  '#006400',
  '#000000',
  '#DA70D6',
];

type Props = {
  medicamentoSelecionado: {
    nome: string;
    tipo: string;
    dosagem?: string;
  };
};

type Horario = {
  hora: string;
  dose: string;
};

export default function ConfigurarLembrete({ medicamentoSelecionado }: Props) {
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || '');
  const [dosagem, setDosagem] = useState(medicamentoSelecionado?.dosagem || '');
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || '');
  const [corSelecionada, setCorSelecionada] = useState('#FF0000');
  const [horarios, setHorarios] = useState<Horario[]>([
    { hora: '10:00', dose: '1 comp.' },
  ]);
  const [motivo, setMotivo] = useState('');
  const [duracao, setDuracao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState<Date | null>(null);
  const [dataValidade, setDataValidade] = useState('');
  const [quantDiaria, setQuantDiaria] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    setNome(medicamentoSelecionado?.nome || '');
    setTipo(medicamentoSelecionado?.tipo || '');
  }, [medicamentoSelecionado]);

  const adicionarHorario = () => {
    setHorarios([...horarios, { hora: '', dose: '' }]);
  };

  const removerHorario = (index: number) => {
    setHorarios(horarios.filter((_, i) => i !== index));
  };

  const atualizarHorario = (
    index: number,
    campo: keyof Horario,
    valor: string,
  ) => {
    const novosHorarios = [...horarios];
    novosHorarios[index][campo] = valor;
    setHorarios(novosHorarios);
  };

  const salvarLembrete = async () => {
    try {
      const horaInicio = new Date();
      horaInicio.setHours(parseInt(horarios[0].hora.split(':')[0]));
      horaInicio.setMinutes(parseInt(horarios[0].hora.split(':')[1]));

      const dadosLembrete = {
        nome: nome,
        quantidadeCaixa: parseInt(quantidade),
        dataValidade: validade,
        quantidadeDiaria: parseInt(quantDiaria),
        foto: 'https://example.com/image.jpg', // Você pode adicionar um campo para foto depois
        classificacao: tipo,
        horaInicio: horaInicio.toISOString(),
        cor: corSelecionada,
        unidadeMedida: dosagem,
        motivo: observacoes,
        quantidadeDias: parseInt(duracao),
      };

      const response = await fetch(
        'https://medreminder-backend.onrender.com/remedio',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosLembrete),
        },
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar o lembrete');
      }

      const data = await response.json();
      console.log('Lembrete salvo com sucesso:', data);
      alert('Lembrete salvo com sucesso!');

      // Limpar formulário ou redirecionar
      limparFormulario();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar o lembrete');
    }
  };

  const limparFormulario = () => {
    setNome('');
    setDosagem('');
    setTipo('');
    setCorSelecionada('#FF0000');
    setHorarios([{ hora: '10:00', dose: '1 comp.' }]);
    setMotivo('');
    setDuracao('');
    setQuantidade('');
    setValidade(null);
    setQuantDiaria('');
    setObservacoes('');
  };

  return (
    <div className="bg-[#D9D9D9] p-6 rounded-xl shadow-lg m-6">
      <h2 className="text-xl font-bold text-[#0B6E71] mb-4">
        Configurar lembrete
      </h2>{' '}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
          placeholder="Nome do medicamento"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
          placeholder="Dosagem"
          value={dosagem}
          onChange={(e) => setDosagem(e.target.value)}
        />
        <input
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
          placeholder="Tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
      </div>
      <label className="font-medium text-[#0B6E71]">Cor identificadora</label>
      <div className="flex flex-wrap gap-2 my-2">
        {Cores.map((cor, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded cursor-pointer border hover:border-black ${
              corSelecionada === cor ? 'border-black' : 'border-transparent'
            }`}
            style={{ backgroundColor: cor }}
            onClick={() => setCorSelecionada(cor)}
          ></div>
        ))}
      </div>{' '}
      <label className="font-medium text-[#0B6E71] block mt-4">
        Horários para tomar
      </label>
      {horarios.map((h, index) => (
        <div key={index} className="flex gap-2 items-center mb-2">
          <input
            type="time"
            value={h.hora}
            onChange={(e) => atualizarHorario(index, 'hora', e.target.value)}
            className="p-2 rounded border border-[#037F8C] bg-white outline-none text-gray-700 KantumruyMedium w-28"
          />
          <input
            type="text"
            placeholder="Dose"
            value={h.dose}
            onChange={(e) => atualizarHorario(index, 'dose', e.target.value)}
            className="p-2 rounded border border-[#037F8C] bg-white outline-none text-gray-700 KantumruyMedium w-24"
          />
          <button
            onClick={() => removerHorario(index)}
            className="text-red-600 font-bold"
          >
            X
          </button>
        </div>
      ))}
      <button
        onClick={adicionarHorario}
        className="border-dashed border-2 border-[#0B6E71] px-4 py-2 rounded text-[#0B6E71] mb-4"
      >
        + Adicionar Horário
      </button>{' '}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Motivo pelo qual vai tomar o remédio"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
        />

        <input
          type="number"
          placeholder="Duração (dias)"
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
        />

        <input
          type="number"
          placeholder="Quantidade do remédio"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
        />

        <div className="flex flex-col">
          <label className="text-sm text-[#0B6E71] mb-1">
            Data de validade
          </label>
          <input
            type="text"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={dataValidade}
            onChange={(e) => {
              let valor = e.target.value.replace(/[^\d/]/g, '');

              if (
                valor.length === 2 &&
                !valor.includes('/') &&
                dataValidade.length !== 3
              ) {
                valor += '/';
              }

              if (
                valor.length === 5 &&
                valor.split('/').length === 2 &&
                dataValidade.length !== 6
              ) {
                valor += '/';
              }

              if (valor.length <= 10) {
                setDataValidade(valor);

                if (valor.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                  const [dia, mes, ano] = valor.split('/');
                  const dataObj = new Date(
                    parseInt(ano),
                    parseInt(mes) - 1,
                    parseInt(dia),
                  );

                  if (!isNaN(dataObj.getTime())) {
                    setValidade(dataObj);
                  } else {
                    setValidade(null);
                  }
                } else {
                  setValidade(null);
                }
              }
            }}
            className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium w-full"
          />
        </div>
      </div>{' '}
      <input
        type="number"
        placeholder="Quantidade diária"
        value={quantDiaria}
        onChange={(e) => setQuantDiaria(e.target.value)}
        className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4"
      />
      <textarea
        placeholder="Observações"
        className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4"
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
