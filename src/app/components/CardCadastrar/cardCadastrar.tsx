'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';

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
  };
};

type Horario = {
  data: string;
  hora: string;
  dose: string;
};

type ErrosForm = {
  dosagem?: string;
  nome?: string;
  quantidade?: string;
  duracao?: string;
  [key: string]: string | undefined;
};

export default function ConfigurarLembrete({ medicamentoSelecionado }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [erros, setErros] = useState<ErrosForm>({});
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || '');
  const [dosagem, setDosagem] = useState('');
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || '');
  const [corSelecionada, setCorSelecionada] = useState('#FF0000');
  const [horarios, setHorarios] = useState<Horario[]>([
    {
      data: new Date().toISOString().split('T')[0],
      hora: '10:00',
      dose: '1 comp.',
    },
  ]);
  const [motivo, setMotivo] = useState('');
  const [duracao, setDuracao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState<string | null>(null);
  const [intervalo, setIntervalo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [unidade, setUnidade] = useState('mg');
  const [unidadeDuracao, setUnidadeDuracao] = useState(1);

  useEffect(() => {
    setNome(medicamentoSelecionado?.nome || '');
    setTipo(medicamentoSelecionado?.tipo || '');
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

    if (!nome.trim()) novosErros.nome = 'Nome do medicamento é obrigatório';

    if (!dosagem.trim()) {
      novosErros.dosagem = 'Dosagem é obrigatória';
    } else if (parseFloat(dosagem) <= 0) {
      novosErros.dosagem = 'Dosagem deve ser maior que zero';
    }

    if (!quantidade.trim()) {
      novosErros.quantidade = 'Quantidade é obrigatória';
    } else if (parseInt(quantidade) <= 0) {
      novosErros.quantidade = 'Quantidade deve ser maior que zero';
    }

    if (!duracao.trim()) {
      novosErros.duracao = 'Duração é obrigatória';
    } else if (parseInt(duracao) <= 0) {
      novosErros.duracao = 'Duração deve ser maior que zero';
    }

    if (!intervalo.trim()) {
      novosErros.intervalo = 'Intervalo é obrigatório';
    } else if (parseInt(intervalo) <= 0) {
      novosErros.intervalo = 'Intervalo deve ser maior que zero';
    }

    if (horarios.length === 0 || !horarios[0].hora) {
      novosErros.horario = 'Horário da primeira dose é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const calcularHorariosMedicamento = (
    horaInicial: string,
    intervaloHoras: number,
    duracaoDias: number,
    dataInicial: string = new Date().toISOString().split('T')[0],
  ): { data: string; hora: string }[] => {
    const horarios: { data: string; hora: string }[] = [];
    const [horasIniciais, minutosIniciais] = horaInicial.split(':').map(Number);
    const [anoInicial, mesInicial, diaInicial] = dataInicial
      .split('-')
      .map(Number);
    const dataHoraInicio = new Date();
    dataHoraInicio.setFullYear(anoInicial);
    dataHoraInicio.setMonth(mesInicial - 1);
    dataHoraInicio.setDate(diaInicial);
    dataHoraInicio.setHours(horasIniciais, minutosIniciais, 0, 0);
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;
    const dataHoraFim = new Date(dataHoraInicio);
    dataHoraFim.setDate(dataHoraFim.getDate() + duracaoDias);

    let dataHoraAtual = new Date(dataHoraInicio);
    while (dataHoraAtual < dataHoraFim) {
      const dataFormatada = dataHoraAtual.toISOString().split('T')[0];
      const horarioFormatado = `${dataHoraAtual
        .getHours()
        .toString()
        .padStart(2, '0')}:${dataHoraAtual
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      horarios.push({
        data: dataFormatada,
        hora: horarioFormatado,
      });
      dataHoraAtual = new Date(dataHoraAtual.getTime() + intervaloMs);
    }
    return horarios;
  };

  const salvarLembrete = async () => {
    if (!validarFormulario()) {
      alert('Por favor, corrija os erros no formulário');
      return;
    }
    const token = localStorage.getItem('access_token');
    if (!isAuthenticated || !token) {
      alert('Você precisa estar logado para salvar um lembrete');
      return;
    }
    if (!user || !user.id) {
      alert(
        'Não foi possível identificar seu usuário. Por favor, faça login novamente.',
      );
      return;
    }

    const usuarioId = user.id;
    try {
      const horaInicio = new Date();
      let horaInicialString = '10:00';
      let dataInicial = new Date().toISOString().split('T')[0];

      if (horarios[0]?.hora) {
        horaInicialString = horarios[0].hora;
        dataInicial = horarios[0].data;
        const [ano, mes, dia] = dataInicial.split('-').map(Number);
        const [horas, minutos] = horaInicialString.split(':').map(Number);
        horaInicio.setFullYear(ano);
        horaInicio.setMonth(mes - 1);
        horaInicio.setDate(dia);
        horaInicio.setHours(horas);
        horaInicio.setMinutes(minutos);
        horaInicio.setSeconds(0);
        horaInicio.setMilliseconds(0);
      }

      const duracaoEmDias = parseInt(duracao) * unidadeDuracao;
      const horariosCalculados = calcularHorariosMedicamento(
        horaInicialString,
        parseInt(intervalo) || 8,
        duracaoEmDias || 7,
        dataInicial,
      );

      const nomeCores: Record<string, string> = {
        '#FF0000': 'Vermelho',
        '#4B00FF': 'Azul',
        '#FFFF00': 'Amarelo',
        '#FFA500': 'Laranja',
        '#00CFFF': 'Azul claro',
        '#FFFFFF': 'Branco',
        '#00FF7F': 'Verde claro',
        '#006400': 'Verde escuro',
        '#000000': 'Preto',
        '#DA70D6': 'Orquídea',
      };

      let dataValidadeFormatada = null;
      if (validade) {
        dataValidadeFormatada = validade.toString().split('T')[0];
      }
      const dadosLembrete = {
        nome: nome,
        quantidadeCaixa: parseInt(quantidade) || 0,
        dataValidade: dataValidadeFormatada,
        quantidadeDiaria: parseInt(intervalo) || 0,
        foto: 'https://example.com/image.jpg',
        classificacao: tipo || 'Não classificado',
        horaInicio: horaInicio.toISOString(),
        cor: nomeCores[corSelecionada] || 'Vermelho',
        unidadeMedida: unidade,
        motivo: motivo || 'Não especificado',
        quantidadeDias: parseInt(duracao) || 0,
        quantidadeDose:
          parseFloat(dosagem) > 0 ? `${dosagem} ${unidade}` : `1 ${unidade}`,
        observacao: observacoes || '',
        usuarioId: usuarioId,
      };

      let remedioId: number | string | undefined;
      try {
        const data = await apiRequest<{
          data: { id: number };
        }>('remedio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify(dadosLembrete),
        });
        const responseData = data;
        if (responseData?.data) {
          remedioId = responseData.data.id;
        } else {
          console.error(
            'Resposta da API não contém ID do remédio na estrutura esperada:',
            data,
          );
          throw new Error('Não foi possível obter o ID do remédio criado');
        }
      } catch (error) {
        console.error('Erro ao salvar medicamento:', error);
        const mensagemErro =
          error instanceof Error
            ? `Erro ao salvar o medicamento: ${error.message}`
            : 'Erro ao salvar o medicamento';
        alert(mensagemErro);
        throw error;
      }

      const dosesISO = horariosCalculados.map((horario) => {
        const [ano, mes, dia] = horario.data.split('-').map(Number);
        const [horas, minutos] = horario.hora.split(':').map(Number);
        const dataHora = new Date();
        dataHora.setFullYear(ano);
        dataHora.setMonth(mes - 1);
        dataHora.setDate(dia);
        dataHora.setHours(horas);
        dataHora.setMinutes(minutos);
        dataHora.setSeconds(0);
        dataHora.setMilliseconds(0);

        return dataHora.toISOString();
      });

      dosesISO.sort();
      if (!remedioId) {
        console.error(
          'ID do remédio não disponível, não será possível criar doses',
        );
        throw new Error(
          'Não foi possível obter o ID do remédio para criar as doses',
        );
      }
      const remedioIdNumber =
        typeof remedioId === 'string' ? parseInt(remedioId) : remedioId;

      const dadosDoses = {
        usuarioId: usuarioId,
        remedioId: remedioIdNumber,
        doses: dosesISO.map((dose) => dose.trim()),
      };

      try {
        if (!Array.isArray(dosesISO) || dosesISO.length === 0) {
          throw new Error(
            'Não foi possível calcular as doses. Verifique a duração e o intervalo.',
          );
        }
        if (!remedioId) {
          throw new Error(
            'ID do remédio não disponível. Não é possível criar doses.',
          );
        }

        const dataDoses = await apiRequest<unknown>('dose/doses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify(dadosDoses),
        });
        void dataDoses;
        alert('Lembrete e doses salvos com sucesso!');
        limparFormulario();
      } catch (error) {
        console.error('Erro ao salvar doses:', error);
        const mensagemErro =
          error instanceof Error
            ? `Erro ao salvar as doses: ${error.message}`
            : 'Erro ao salvar as doses';
        alert(mensagemErro);
        throw error;
      }
    } catch (error) {
      console.error('ERRO NA OPERAÇÃO:', error);

      let mensagemErro = 'Erro ao salvar o lembrete. Tente novamente.';
      if (error instanceof Error) {
        mensagemErro = error.message;
      }
      if (
        mensagemErro.includes('Authentication required') ||
        mensagemErro.includes('token') ||
        mensagemErro.includes('401')
      ) {
        mensagemErro = 'Sua sessão expirou. Por favor, faça login novamente.';
      }

      alert(mensagemErro);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setDosagem('');
    setTipo('');
    setCorSelecionada('#FF0000');
    setHorarios([
      {
        data: new Date().toISOString().split('T')[0],
        hora: '10:00',
        dose: '1 comp.',
      },
    ]);
    setMotivo('');
    setDuracao('');
    setQuantidade('');
    setValidade(null);
    setIntervalo('');
    setObservacoes('');
    setUnidade('mg');
    setUnidadeDuracao(1);
    setErros({});
  };

  return (
    <div className="bg-[#D9D9D9] p-6 rounded-xl shadow-lg m-6 ">
      <h2 className="text-xl font-bold text-[#0B6E71] mb-5">
        Sobre o medicamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Nome</label>
          <input
            className={`p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium w-full ${
              erros.nome ? 'border-red-500' : 'border-[#037F8C]'
            }`}
            placeholder="Dipirona"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {erros.nome && (
            <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
          )}
        </div>

        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Tipo</label>
          <input
            className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium"
            placeholder="Analgésico"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Quantidade da caixa
          </label>
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.quantidade ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          >
            <input
              type="number"
              min="0"
              placeholder="30"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className={`w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium`}
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
          {erros.quantidade && (
            <p className="text-red-500 text-sm mt-1">{erros.quantidade}</p>
          )}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Data de validade
          </label>
          <input
            type="date"
            value={validade || ''}
            onChange={(e) => setValidade(e.target.value)}
            className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-full border-[#037F8C]`}
          />
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Cor identificadora
          </label>
          <div className="flex flex-wrap gap-2 my-2">
            {Cores.map((cor, i) => (
              <div
                key={i}
                className={`w-5 h-8 rounded cursor-pointer border hover:border-black ${
                  corSelecionada === cor
                    ? 'border-black border-2'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: cor }}
                onClick={() => setCorSelecionada(cor)}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#0B6E71] mb-5 mt-5">
        Sobre o tratamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Motivo (sintomas)
          </label>
          <input
            type="text"
            placeholder="Dor de cabeça"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="p-2 border border-[#037F8C] rounded bg-white outline-none w-full text-gray-700 KantumruyMedium"
          />
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Primeira dose
          </label>
          {horarios.map((h, index) => (
            <div key={index} className="flex gap-2 items-center mb-2">
              <input
                type="date"
                value={h.data}
                onChange={(e) =>
                  atualizarHorario(index, 'data', e.target.value)
                }
                className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-40 ${
                  erros.horario ? 'border-red-500' : 'border-[#037F8C]'
                }`}
              />
              <input
                type="time"
                value={h.hora}
                onChange={(e) =>
                  atualizarHorario(index, 'hora', e.target.value)
                }
                className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-28 ${
                  erros.horario ? 'border-red-500' : 'border-[#037F8C]'
                }`}
              />
            </div>
          ))}
          {erros.horario && (
            <p className="text-red-500 text-sm mb-2">{erros.horario}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">Dosagem</label>
          {/* Input de dosagem com select de unidade */}
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.dosagem ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          >
            <input
              className="w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium"
              placeholder="500"
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
          <label className="text-m text-[#0B6E71] mb-1 block">
            De quantas em quantas horas?
          </label>
          <input
            type="number"
            min="0"
            placeholder="6 (horas)"
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            className={`w-full p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium mb-1 ${
              erros.intervalo ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          />
          {erros.intervalo && (
            <p className="text-red-500 text-sm mb-2">{erros.intervalo}</p>
          )}
        </div>
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Duração do tratamento
          </label>
          <div
            className={`flex border rounded bg-white overflow-hidden ${
              erros.duracao ? 'border-red-500' : 'border-[#037F8C]'
            }`}
          >
            <input
              type="number"
              placeholder="7"
              value={duracao}
              min="0"
              onChange={(e) => setDuracao(e.target.value)}
              className={`w-full max-w-[calc(100%-64px)] p-2 outline-none text-gray-700 KantumruyMedium`}
            />
            <select
              className="w-30 text-sm p-2 bg-gray-50 border-l border-[#037F8C] outline-none text-gray-700 KantumruyMedium cursor-pointer hover:bg-gray-100 transition-colors"
              value={unidadeDuracao}
              onChange={(e) => setUnidadeDuracao(parseInt(e.target.value))}
            >
              <option value={1}>dias</option>
              <option value={7}>semanas</option>
              <option value={30}>meses</option>
            </select>
          </div>
          {erros.duracao && (
            <p className="text-red-500 text-sm mt-1">{erros.duracao}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 mb-4">
        <div>
          <label className="text-m text-[#0B6E71] mb-1 block">
            Observações
          </label>
          <textarea
            placeholder="Tomar após as refeições"
            className="w-full p-2 border border-[#037F8C] rounded bg-white outline-none text-gray-700 KantumruyMedium mb-4 resize-none"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          ></textarea>
        </div>
      </div>

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
