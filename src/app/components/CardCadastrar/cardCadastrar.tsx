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
  data: string;
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
  const [corSelecionada, setCorSelecionada] = useState('#FF0000');  const [horarios, setHorarios] = useState<Horario[]>([
    { data: new Date().toISOString().split('T')[0], hora: '10:00', dose: '1 comp.' },
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
  duracaoDias: number, // duração do tratamento em dias
  dataInicial: string = new Date().toISOString().split('T')[0] // data inicial no formato YYYY-MM-DD
): { data: string, hora: string }[] => {
  // Armazenar os horários completos (data + hora)
  const horarios: { data: string, hora: string }[] = [];
  
  // Converter hora inicial para horas e minutos
  const [horasIniciais, minutosIniciais] = horaInicial.split(':').map(Number);
  
  // Converter data inicial para ano, mês e dia
  const [anoInicial, mesInicial, diaInicial] = dataInicial.split('-').map(Number);
  
  // Data e hora de início
  const dataHoraInicio = new Date();
  dataHoraInicio.setFullYear(anoInicial);
  dataHoraInicio.setMonth(mesInicial - 1); // Mês em JavaScript começa do 0
  dataHoraInicio.setDate(diaInicial);
  dataHoraInicio.setHours(horasIniciais, minutosIniciais, 0, 0);
  
  // Intervalo em milissegundos
  const intervaloMs = intervaloHoras * 60 * 60 * 1000;
  
  // Calcular data/hora final do tratamento
  const dataHoraFim = new Date(dataHoraInicio);
  dataHoraFim.setDate(dataHoraFim.getDate() + duracaoDias);
  
  // Gerar todos os horários ao longo do tratamento
  let dataHoraAtual = new Date(dataHoraInicio);
  
  while (dataHoraAtual < dataHoraFim) {
    // Formatar a data como "YYYY-MM-DD"
    const dataFormatada = dataHoraAtual.toISOString().split('T')[0];
    
    // Formatar o horário como "HH:MM"
    const horarioFormatado = `${dataHoraAtual.getHours().toString().padStart(2, '0')}:${dataHoraAtual.getMinutes().toString().padStart(2, '0')}`;
    
    // Adicionar à lista
    horarios.push({
      data: dataFormatada,
      hora: horarioFormatado
    });
    
    // Avançar para o próximo horário
    dataHoraAtual = new Date(dataHoraAtual.getTime() + intervaloMs);
  }
  
  return horarios;
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
      let dataInicial = new Date().toISOString().split('T')[0]; // valor padrão para data
      
      if (horarios[0]?.hora) {
        horaInicialString = horarios[0].hora;
        dataInicial = horarios[0].data;
        
        // Criar um objeto Date com a data e hora fornecidas
        const [ano, mes, dia] = dataInicial.split('-').map(Number);
        const [horas, minutos] = horaInicialString.split(':').map(Number);
          horaInicio.setFullYear(ano);
        horaInicio.setMonth(mes - 1); // Mês em JavaScript começa do 0
        horaInicio.setDate(dia);
        horaInicio.setHours(horas);
        horaInicio.setMinutes(minutos);
        horaInicio.setSeconds(0);
        horaInicio.setMilliseconds(0);
      }      // Calcular os horários que o medicamento deve ser tomado
      const horariosCalculados = calcularHorariosMedicamento(
        horaInicialString,
        parseInt(Intervalo),
        parseInt(duracao),
        dataInicial
      );

      // Mapeamento de cores para nomes
      const nomeCores: Record<string, string> = {
        '#FF0000': 'vermelho',
        '#4B00FF': 'azul',
        '#FFFF00': 'amarelo',
        '#FFA500': 'laranja',
        '#00CFFF': 'azul claro',
        '#FFFFFF': 'branco',
        '#00FF7F': 'verde claro',
        '#006400': 'verde escuro',
        '#000000': 'preto',
        '#DA70D6': 'orquídea'
      };      const dadosLembrete = {
        nome: nome,
        classificacao: tipo,
        unid_medida: unidade, // Apenas a unidade
        qnt_dose: parseFloat(dosagem), // Quantidade da dosagem
        motivo: motivo || '',
        inicio: horaInicio.toISOString(), // Data e hora formatadas como ISO string
        qnt_dia: parseInt(duracao),
        qnt_vz_dia: horariosCalculados, // Array com objetos { data, hora }
        data_validade: validade ? validade.toISOString() : null,
        qnt_caixa: parseInt(quantidade),
        foto: 'https://example.com/image.jpg',
        cor: nomeCores[corSelecionada] || 'vermelho', // Nome da cor em vez do hexadecimal
        observacao: observacoes || ''
      };

      console.log('JSON sendo enviado para a API:', JSON.stringify(dadosLembrete, null, 2));
  
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
    setHorarios([{ data: new Date().toISOString().split('T')[0], hora: '10:00', dose: '1 comp.' }]);
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
          <label className="text-sm text-[#0B6E71] mb-1 block">Nome do medicamento</label>
          <input
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.nome ? 'border-red-500' : 'border-[#037F8C]'
            }`}
            placeholder="Ex: Dipirona"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {erros.nome && (
            <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
          )}
        </div>

        <div>
          <label className="text-sm text-[#0B6E71] mb-1 block">Dosagem</label>
          {/* Input de dosagem com select de unidade */}
          <div className={`flex border rounded bg-white overflow-hidden ${
            erros.dosagem ? 'border-red-500' : 'border-[#037F8C]'
          }`}>
            <input
              className="w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium"
              placeholder="Ex: 500"
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

        <div>
          <label className="text-sm text-[#0B6E71] mb-1 block">Tipo</label>
          <input
            className="p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
            placeholder="Ex: Analgésico"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
        </div>
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
      </div>      <label className="font-light text-[#0B6E71] block mt-4">
        Primeira dose (dia e horário)
      </label>
      {horarios.map((h, index) => (
        <div key={index} className="flex gap-2 items-center mb-2">
          <input 
            type="date" 
            value={h.data}
            onChange={(e) => atualizarHorario(index, 'data', e.target.value)}
            className="p-2 rounded border border-[#037F8C] bg-white outline-none text-gray-700 KantumruyMedium w-40"
            placeholder="AAAA-MM-DD"
          />
          <input
            type="time"
            value={h.hora}
            onChange={(e) => atualizarHorario(index, 'hora', e.target.value)}
            className="p-2 rounded border border-[#037F8C] bg-white outline-none text-gray-700 KantumruyMedium w-28"
            placeholder="HH:MM"
          />
        </div>
      ))}
        

        <div>
          <label className="font-light text-[#0B6E71] block mt-4">
            De quanto em quanto tempo vai ser tomado o remédio? (em horas)
          </label>
          <input
          type="number"
          placeholder="Ex: 6 ou 8..."
          value={Intervalo}
          onChange={(e) => setIntervalo(e.target.value)}
          className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4"
          />        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-[#0B6E71] mb-1 block">Motivo pelo qual vai tomar o remédio</label>
          <input
            type="text"
            placeholder="Ex: Dor de cabeça"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="p-2 border border-[#037F8C] rounded bg-white outline-none w-full text-gray-700 KantumruyMedium"
          />
        </div>
         
        <div>
          <label className="text-sm text-[#0B6E71] mb-1 block">Duração do tratamento</label>
          <input
            type="number"
            placeholder="Ex: 7"
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
          <label className="text-sm text-[#0B6E71] mb-1 block">Quantidade do remédio</label>
          <input
            type="number"
            placeholder="Ex: 30"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
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
        </div>      </div>
      
      <label className="text-sm text-[#0B6E71] mb-1 block">Observações</label>
      <textarea
        placeholder="Ex: Tomar após as refeições"
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