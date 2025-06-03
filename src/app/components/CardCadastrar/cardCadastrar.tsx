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

// Tipo para os erros
type ErrosForm = {
  dosagem?: string;
  nome?: string;
  quantidade?: string;
  duracao?: string;
  [key: string]: string | undefined;
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
  const [Intervalo, setIntervalo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erros, setErros] = useState<ErrosForm>({}); // Corrigido o tipo
  const [unidade, setUnidade] = useState('mg');

  useEffect(() => {
    setNome(medicamentoSelecionado?.nome || '');
    setTipo(medicamentoSelecionado?.tipo || '');
    setDosagem(medicamentoSelecionado?.dosagem || '');
  }, [medicamentoSelecionado]);

  const atualizarHorario = (
    index: number,
    campo: keyof Horario,
    valor: string,
  ) => {
    const novosHorarios = [...horarios];
    novosHorarios[index][campo] = valor;
    setHorarios(novosHorarios);
  };

  const validarFormulario = (): boolean => {
    const novosErros: ErrosForm = {};
    
    // Validar nome
    if (!nome.trim()) {
      novosErros.nome = 'Nome do medicamento é obrigatório';
    }
    
    // Validar dosagem
    if (!dosagem.trim()) {
      novosErros.dosagem = 'Dosagem é obrigatória';
    } else if (parseFloat(dosagem) <= 0) {
      novosErros.dosagem = 'Dosagem deve ser maior que zero';
    }
    
    // Validar quantidade
    if (!quantidade.trim()) {
      novosErros.quantidade = 'Quantidade é obrigatória';
    } else if (parseInt(quantidade) <= 0) {
      novosErros.quantidade = 'Quantidade deve ser maior que zero';
    }
    
    // Validar duração
    if (!duracao.trim()) {
      novosErros.duracao = 'Duração é obrigatória';
    } else if (parseInt(duracao) <= 0) {
      novosErros.duracao = 'Duração deve ser maior que zero';
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };


const calcularHorariosMedicamento = (
  horaInicial: string, // formato "HH:MM"
  intervaloHoras: number, // intervalo em horas
  duracaoDias: number // duração do tratamento em dias
): string => {
  const horarios: number[] = [];
  
  // Converter hora inicial para minutos desde 00:00
  const [horasIniciais, minutosIniciais] = horaInicial.split(':').map(Number);
  let horaAtualMinutos = horasIniciais * 60 + minutosIniciais;
  
  // Calcular total de doses durante o tratamento
  const intervaloMinutos = intervaloHoras * 60;
  const totalMinutosTratamento = duracaoDias * 24 * 60;
  const totalDoses = Math.ceil(totalMinutosTratamento / intervaloMinutos);
  
  // Gerar todos os horários
  for (let i = 0; i < totalDoses; i++) {
    // Converter minutos para hora do dia (0-23)
    const horaAtual = Math.floor((horaAtualMinutos % (24 * 60)) / 60);
    
    // Adicionar à lista se ainda não existe
    if (!horarios.includes(horaAtual)) {
      horarios.push(horaAtual);
    }
    
    // Avançar para o próximo horário
    horaAtualMinutos += intervaloMinutos;
  }
  
  // Ordenar horários
  horarios.sort((a, b) => a - b);
  
  // Retornar como string separada por vírgulas
  return horarios.join(', ');
};

  const salvarLembrete = async () => {
    // Validar formulário antes de enviar
    if (!validarFormulario()) {
      alert('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const horaInicio = new Date();
      let horaInicialString = '10:00'; // valor padrão
      
      if (horarios[0]?.hora) {
        horaInicialString = horarios[0].hora;
        const [horas, minutos] = horaInicialString.split(':');
        horaInicio.setHours(parseInt(horas));
        horaInicio.setMinutes(parseInt(minutos));
      }
  
      // Calcular os horários que o medicamento deve ser tomado
      const horariosCalculados = calcularHorariosMedicamento(
        horaInicialString,
        parseInt(Intervalo),
        parseInt(duracao)
      );
  
      const dadosLembrete = {
        nome: nome,
        quantidadeCaixa: parseInt(quantidade),
        dataValidade: validade,
        quantidadeDiaria: parseInt(Intervalo),
        foto: 'https://example.com/image.jpg',
        classificacao: tipo,
        horaInicio: horaInicio.toISOString(),
        cor: corSelecionada,
        unidadeMedida: `${dosagem} ${unidade}`,
        motivo: motivo || observacoes,
        quantidadeDias: parseInt(duracao),
        horariosParaTomar: horariosCalculados // Nova propriedade com os horários calculados
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
      console.log('Horários calculados:', horariosCalculados);
      alert('Lembrete salvo com sucesso!');
  
      limparFormulario();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar o lembrete. Tente novamente.');
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
    setDataValidade('');
    setIntervalo('');
    setObservacoes('');
    setErros({});
  };

  return (
    <div className="bg-[#D9D9D9] p-6 rounded-xl shadow-lg m-6 ">
      <h2 className="text-xl font-bold text-[#0B6E71] mb-4">
        Configurar lembrete
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <input
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.nome ? 'border-red-500' : 'border-[#037F8C]'
            }`}
            placeholder="Nome do medicamento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {erros.nome && (
            <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
          )}
        </div>

        <div>
          {/* Input de dosagem com select de unidade */}
          <div className={`flex border rounded bg-white overflow-hidden ${
            erros.dosagem ? 'border-red-500' : 'border-[#037F8C]'
          }`}>
            <input
              className="w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium"
              placeholder="Dosagem"
              value={dosagem}
              onChange={(e) => setDosagem(e.target.value)}
              type="number"
              min="0"
              step="0.1"
            />
            <select
              className="w-20 text-sm p-2 bg-gray-50 border-l border-[#037F8C] outline-none text-gray-700 KantumruyMedium cursor-pointer hover:bg-gray-100 transition-colors"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="comp">comp</option>
              <option value="gotas">gotas</option>
              <option value="sachê">sachê</option>
            </select>
          </div>
          {erros.dosagem && (
            <p className="text-red-500 text-sm mt-1">{erros.dosagem}</p>
          )}
        </div>

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
              corSelecionada === cor ? 'border-black border-2' : 'border-transparent'
            }`}
            style={{ backgroundColor: cor }}
            onClick={() => setCorSelecionada(cor)}
          ></div>
        ))}
      </div>

      <label className="font-medium text-[#0B6E71] block mt-4">
        Qual horário você tomou (vai tomar) o remédio pela 1° vez?
      </label>
      {horarios.map((h, index) => (
        <div key={index} className="flex gap-2 items-center mb-2">
          <input
            type="time"
            value={h.hora}
            onChange={(e) => atualizarHorario(index, 'hora', e.target.value)}
            className="p-2 rounded border border-[#037F8C] bg-white outline-none text-gray-700 KantumruyMedium w-28"
          />
        </div>
          ))}
        

        <div>
          <input
          type="number"
          placeholder="De quanto em quanto tempo vai ser tomado o remédio? (em horas)"
          value={Intervalo}
          onChange={(e) => setIntervalo(e.target.value)}
          className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4"
          />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Motivo pelo qual vai tomar o remédio"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
        />

        

        

        <div>
          <input
            type="number"
            placeholder="Duração do tratamento (dias)"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.duracao ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          />
          {erros.duracao && (
            <p className="text-red-500 text-sm mt-1">{erros.duracao}</p>
          )}
        </div>

        

        <div>
          <input
            type="number"
            placeholder="Quantidade do remédio"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={`p-2 mt-6 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.quantidade ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          />
          {erros.quantidade && (
            <p className="text-red-500 text-sm mt-1">{erros.quantidade}</p>
          )}
        </div>

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
      </div>
      
      <textarea
        placeholder="Observações"
        className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4 resize-none"
        rows={3}
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      ></textarea>
      
      <div className="flex gap-4">
        <button
          onClick={salvarLembrete}
          className="bg-[#0B6E71] text-white py-2 px-6 rounded-lg hover:bg-[#044D55] hover:cursor-pointer transition-colors font-medium"
        >
          Salvar lembrete
        </button>
        
        <button
          onClick={limparFormulario}
          className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors font-medium max-w-[calc(100%-64px)]"
        >
          Limpar formulário
        </button>
      </div>
    </div>
  );
}