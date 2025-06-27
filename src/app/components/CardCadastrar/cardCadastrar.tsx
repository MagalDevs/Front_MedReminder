'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { LembreteContext } from '@/app/contexts/lembreteContext';

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
  const context = useContext(LembreteContext)
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || '');
  const [dosagem, setDosagem] = useState(medicamentoSelecionado?.dosagem || '');
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || '');
  const [corSelecionada, setCorSelecionada] = useState('#FF0000');
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([
    { data: new Date().toISOString().split('T')[0], hora: '10:00', dose: '1 comp.' },
  ]);
  const [motivo, setMotivo] = useState('');
  const [duracao, setDuracao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState<Date | null>(null);
  const [dataValidade, setDataValidade] = useState('');  const [Intervalo, setIntervalo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erros, setErros] = useState<ErrosForm>({}); // Corrigido o tipo
  const [unidade, setUnidade] = useState('mg');  // Unidade para dosagem
  
  // Define a proper interface for user data
  interface UsuarioAPI {
    id: string | number;
    nome?: string;
    name?: string;
    email?: string;
    [key: string]: unknown; // For additional properties
  }  // Define interface for API responses
  interface ApiResponse {
    id?: string | number;
    data?: {
      id?: string | number;
      [key: string]: unknown; // Allow unknown property in data
    };
    message?: string;
    [key: string]: unknown; // Allow unknown other properties
  }

  const obterDadosUsuario = 
  useCallback(async () => {
    try {
      console.log('Tentando obter dados do usuário da API...');
      const userData = await apiRequest<UsuarioAPI>('usuario', {
        method: 'GET'
      });
      // console.log('Resposta da API de usuário:', userData);
      
      // Verificar se temos um usuário logado com ID para fazer a busca
      const loggedInUserId = user?.id;
      
      // Se for um array, encontrar o usuário correspondente ao usuário logado
      if (Array.isArray(userData) && userData.length > 0) {
        // Se temos um ID de usuário logado, encontrar o usuário específico no array
        if (loggedInUserId) {
          // console.log('Buscando usuário com ID:', loggedInUserId);
          const userFound = userData.find(u => u.id === loggedInUserId);
          
          if (userFound) {
            // console.log('Usuário encontrado no array:', userFound);
            return userFound;
          } else {
            console.warn('Usuário com ID', loggedInUserId, 'não encontrado no array. Verificando outros métodos...');
          }
        }
        
        // Se não temos um ID ou não encontramos o usuário, verificar se temos um email para comparar
        if (user?.email) {
          // ('Buscando usuário com email:', user.email);console.log
          const userByEmail = userData.find(u => u.email === user.email);
          
          if (userByEmail) {
            // console.log('Usuário encontrado por email:', userByEmail);
            return userByEmail;
          }
        }
        
        // Último recurso: pegar o primeiro elemento (comportamento anterior)
        console.warn('Não foi possível encontrar o usuário específico. Usando o primeiro usuário disponível:', userData[0]);
        
        // Verificar se o usuário tem um ID
        if (!userData[0].id) {
          console.error('Objeto de usuário não tem ID:', userData[0]);
          throw new Error('Dados de usuário incompletos. Faça login novamente.');
        }
        
        return userData[0];
      }
      
      // Se não for array, verificar se é um objeto com ID
      if (userData && typeof userData === 'object' && userData.id) {
        return userData;
      }
      
      console.error('Resposta da API não contém dados de usuário válidos:', userData);
      throw new Error('Não foi possível obter os dados de usuário');
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  }, [])

  // Log para debug do estado de autenticação
  useEffect(() => {
    console.log('AuthState:', { 
      user, 
      isLoggedIn: !!user, 
      userId: user?.id,
      hasToken: !!localStorage.getItem('access_token')
    });
    
    // Tentar obter o usuário se estiver logado mas não tiver dados de usuário
    if (localStorage.getItem('access_token') && (!user || !user.id)) {
      console.log('Token encontrado, mas dados de usuário ausentes. Tentando obter dados...');
      obterDadosUsuario().then(userData => {
        // console.log('Dados do usuário recuperados:', userData);
        void userData
      });
    }
  }, [user, obterDadosUsuario]); // Added obterDadosUsuario to dependencies // Added user dependency

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
  };  const validarFormulario = (): boolean => {
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
    
    // Validar intervalo
    if (!Intervalo.trim()) {
      novosErros.intervalo = 'Intervalo é obrigatório';
    } else if (parseInt(Intervalo) <= 0) {
      novosErros.intervalo = 'Intervalo deve ser maior que zero';
    }
    
    // Validar horário
    if (horarios.length === 0 || !horarios[0].hora) {
      novosErros.horario = 'Horário da primeira dose é obrigatório';
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
};    const salvarLembrete = async () => {
    // Validar formulário antes de enviar
    if (!validarFormulario()) {
      alert('Por favor, corrija os erros no formulário');
      return;
    }
      let usuarioId = null;
    
    // Verificar se o usuário está autenticado
    if (!user || !user.id) {
      console.log('Usuário não autenticado ou sem ID:', user);
      
      // Verificar se há token mesmo assim
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Você precisa estar logado para salvar um lembrete');
        return;
      }
      
      console.log('Token encontrado, tentando obter dados do usuário...');
      
      // Tentar obter os dados do usuário
      try {
        const userData = await obterDadosUsuario();
        if (userData && userData.id) {
          // console.log('Dados do usuário recuperados com sucesso, ID:', userData.id);
          usuarioId = userData.id;
        } else {
          console.error('Dados do usuário obtidos, mas sem ID:', userData);
          alert('Não foi possível obter seus dados de usuário. Por favor, faça login novamente.');
          return;
        }
      } catch (e) {
        console.error('Erro ao recuperar dados do usuário:', e);
        
        // Mensagem de erro mais informativa baseada no tipo de erro
        let mensagemErro = 'Você precisa estar logado para salvar um lembrete';
        
        if (e instanceof Error) {
          if (e.message.includes('401') || e.message.includes('unauthorized')) {
            mensagemErro = 'Sua sessão expirou. Por favor, faça login novamente.';
          } else if (e.message.includes('404')) {
            mensagemErro = 'Não foi possível encontrar seu perfil. Por favor, verifique seu cadastro.';
          } else if (e.message.includes('timeout') || e.message.includes('network')) {
            mensagemErro = 'Problema de conexão com o servidor. Verifique sua internet e tente novamente.';
          }
        }
        
        alert(mensagemErro);
        return;
      }
    } else {
      console.log('Usuário autenticado com ID:', user.id);
      usuarioId = user.id;
    }
        // Verificar se temos o ID do usuário antes de continuar
    if (!usuarioId) {
      alert('Não foi possível identificar seu usuário. Por favor, faça login novamente.');
      return;
    }
    
    // console.log('%c USUÁRIO IDENTIFICADO COM ID: ' + usuarioId, 'background: #9C27B0; color: white; font-size: 16px; font-weight: bold;');
    
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
      }
        // Calcular os horários que o medicamento deve ser tomado
      const horariosCalculados = calcularHorariosMedicamento(
        horaInicialString,
        parseInt(Intervalo) || 8, // Valor padrão de 8 horas caso não seja especificado
        parseInt(duracao) || 7,   // Valor padrão de 7 dias caso não seja especificado
        dataInicial
      );

      // Mapeamento de cores para nomes com primeira letra maiúscula
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
        '#DA70D6': 'Orquídea'
      };
      
      // Formatação da data de validade para YYYY-MM-DD
      let dataValidadeFormatada = null;
      if (validade) {
        dataValidadeFormatada = validade.toISOString().split('T')[0];
      }      // Criação do objeto para o lembrete exatamente no formato esperado pela API
      const dadosLembrete = {
        nome: nome,
        quantidadeCaixa: parseInt(quantidade) || 0,
        dataValidade: dataValidadeFormatada,
        quantidadeDiaria: parseInt(Intervalo) || 0,
        foto: 'https://example.com/image.jpg',
        classificacao: tipo || 'Não classificado',
        horaInicio: horaInicio.toISOString(),
        cor: nomeCores[corSelecionada] || 'Vermelho',
        unidadeMedida: unidade,
        motivo: motivo || 'Não especificado',
        quantidadeDias: parseInt(duracao) || 0,
        quantidadeDose: parseFloat(dosagem) > 0 ? `${dosagem} ${unidade}` : `1 ${unidade}`,
        observacao: observacoes || '',
        usuarioId: usuarioId
      };

      // Log do JSON do medicamento
      // console.log('%c DADOS DO MEDICAMENTO SENDO ENVIADOS PARA A API:', 'background: #222; color: #4CAF50; font-size: 16px; font-weight: bold;');
      // console.log('%c' + JSON.stringify(dadosLembrete, null, 2), 'color: #4CAF50; font-size: 14px;');
  
      // Requisição para criar o lembrete usando o apiRequest para lidar com autenticação
      console.log('Enviando requisição para criar medicamento...');
      let data;
      // Declarar remedioId no escopo mais amplo para que ele esteja disponível em todo o bloco try/catch externo
      let remedioId: number | string | undefined;
        try {
        data = await apiRequest<UsuarioAPI>('remedio', {
          method: 'POST',
          body: JSON.stringify(dadosLembrete),
        });
        //   console.log('%c MEDICAMENTO SALVO COM SUCESSO:', 'background: #4CAF50; color: white; font-size: 16px; font-weight: bold;');
        // console.log('%c' + JSON.stringify(data, null, 2), 'color: #4CAF50; font-size: 14px;');
          // Verificar a estrutura da resposta para extrair o ID corretamente
        const responseData = data as ApiResponse;
        if (responseData?.data && 'id' in responseData.data) {
          // Formato: { message: '...', data: { id: ... } }
          remedioId = responseData.data.id;
          // console.log('ID do remédio extraído do campo data.data.id:', remedioId);
        } else if (responseData?.id) {
          // Formato: { id: ... }
          remedioId = responseData.id;
          // console.log('ID do remédio extraído do campo data.id:', remedioId);
        } else {
          console.error('Resposta da API não contém ID do remédio na estrutura esperada:', data);
          throw new Error('Não foi possível obter o ID do remédio criado');
        }
      } catch (error) {
        console.error('Erro ao salvar medicamento:', error);
        
        let mensagemErro = 'Erro ao salvar o medicamento';
        
        if (error instanceof Error) {
          mensagemErro = `${mensagemErro}: ${error.message}`;
          console.error('Detalhes do erro:', error.message);
        }
        
        // Verificar se a mensagem de erro contém informações sobre campos inválidos
        if (typeof mensagemErro === 'string') {
          if (mensagemErro.toLowerCase().includes('usuarioid')) {
            mensagemErro += ". Verifique se você está logado corretamente.";
          } else if (mensagemErro.toLowerCase().includes('horaini')) {
            mensagemErro += ". Verifique se o horário inicial está correto.";
          } else if (mensagemErro.toLowerCase().includes('quantidadediaria')) {
            mensagemErro += ". Verifique o campo de intervalo.";
          }
        }
          alert(mensagemErro);
        throw error;
      }
      
      // ID do remédio já foi definido no bloco try acima
      // console.log('Usando remedioId para criar doses:', remedioId);
      
      // Debug dos horários calculados antes da conversão para ISO
      // console.log('%c HORÁRIOS CALCULADOS (antes da conversão ISO):', 'background: #3f51b5; color: white; font-size: 16px; font-weight: bold;');
      // console.log('%c' + JSON.stringify(horariosCalculados, null, 2), 'color: #3f51b5; font-size: 14px;');
        // Preparar o array de doses para envio
      const dosesISO = horariosCalculados.map(horario => {
        const [ano, mes, dia] = horario.data.split('-').map(Number);
        const [horas, minutos] = horario.hora.split(':').map(Number);
        
        const dataHora = new Date();
        dataHora.setFullYear(ano);
        dataHora.setMonth(mes - 1); // Mês em JavaScript começa do 0
        dataHora.setDate(dia);
        dataHora.setHours(horas);
        dataHora.setMinutes(minutos);
        dataHora.setSeconds(0);
        dataHora.setMilliseconds(0);
        
        // Debug de cada conversão individual
        // console.log(`Convertendo: data=${horario.data}, hora=${horario.hora} => ${dataHora.toISOString()}`);
        
        // Garantir que o formato está correto (ISO 8601)
        return dataHora.toISOString();
      });
      
      // Ordenar as doses cronologicamente para garantir consistência
      dosesISO.sort();
        // Não fazer nada mais se o remedioId não estiver disponível      
      if (!remedioId) {
        console.error('ID do remédio não disponível, não será possível criar doses');
        throw new Error('Não foi possível obter o ID do remédio para criar as doses');
      }      // Dados para a requisição de doses - estrutura exata esperada pela API
      // Converter o remedioId para número e garantir que esteja no formato correto
      const remedioIdNumber = typeof remedioId === 'string' ? parseInt(remedioId) : remedioId;
      
      // Criar o objeto no formato exato esperado pela API
      const dadosDoses = {
        usuarioId: usuarioId, // Incluir usuarioId conforme esperado pela API
        remedioId: remedioIdNumber,
        doses: dosesISO.map(dose => dose.trim()) // Garantir que não há espaços extras
      };
      
      // Log detalhado da identificação do usuário para depuração
      // console.log('%c DETALHES DO USUÁRIO PARA CADASTRO DE DOSES:', 'background: #9C27B0; color: white; font-size: 16px; font-weight: bold;');
      // console.log('ID do usuário sendo usado:', usuarioId);
      // console.log('Objeto user do contexto:', user);
      // console.log('Token presente:', !!localStorage.getItem('access_token'));
      
      // Log exemplar do formato esperado
      // console.log('%c FORMATO ESPERADO DO JSON DE DOSES:', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold;');
      // console.log('%c' + JSON.stringify({
      //   usuarioId: usuarioId,
      //   remedioId: "ID retornado do backend",
      //   doses: [
      //     "2025-06-06T10:00:00.000Z",
      //     "2025-06-06T18:00:00.000Z",
      //     "2025-06-07T02:00:00.000Z"
      //   ]
      // }, null, 2), 'color: #bada55; font-size: 14px;');
        // Log dos dados reais sendo enviados
      // console.log('%c DADOS REAIS SENDO ENVIADOS PARA A API:', 'background: #222; color: #ff9800; font-size: 16px; font-weight: bold;');
      // console.log('%c' + JSON.stringify(dadosDoses, null, 2), 'color: #ff9800; font-size: 14px;');
        // Requisição para criar as doses usando apiRequest para lidar com autenticação
      try {
        console.log('Enviando requisição para criar doses...');
        
        // Verificar se temos pelo menos uma dose calculada
        if (!Array.isArray(dosesISO) || dosesISO.length === 0) {
          console.error('Nenhuma dose calculada para enviar');
          throw new Error('Não foi possível calcular as doses. Verifique a duração e o intervalo.');
        }
        
        // Verificar o ID do remédio antes de enviar
        if (!remedioId) {
          console.error('ID do remédio não disponível para criar doses');
          throw new Error('ID do remédio não disponível. Não é possível criar doses.');
        }
        
        // console.log('ID do remédio usado para criar doses:', remedioId);
        
        // remedioId já foi convertido durante a criação do objeto dadosDoses
        const dataDoses = await apiRequest<ApiResponse>('dose/doses', {
          method: 'POST',
          body: JSON.stringify(dadosDoses),
        });
        
        void dataDoses
        // console.log('%c DOSES SALVAS COM SUCESSO:', 'background: #ff9800; color: white; font-size: 16px; font-weight: bold;');
        // console.log('%c' + JSON.stringify(dataDoses, null, 2), 'color: #ff9800; font-size: 14px;');
        
        alert('Lembrete e doses salvos com sucesso!');
        limparFormulario();
        await context?.getLembretes()
      } catch (error) {
        console.error('Erro ao salvar doses:', error);
        
        let mensagemErro = 'Erro ao salvar as doses';
        if (error instanceof Error) {
          console.error('Detalhes do erro:', error.message);
          mensagemErro = `${mensagemErro}: ${error.message}`;
            // Verificar se o erro contém informações sobre o formato esperado
          if (error.message.toLowerCase().includes('invalid') || 
              error.message.toLowerCase().includes('invalid input') ||
              error.message.toLowerCase().includes('formato') ||
              error.message.toLowerCase().includes('400')) {
            console.error('Possível erro de formato nos dados enviados:', dadosDoses);
            console.error('Tipos de dados - usuarioId:', typeof dadosDoses.usuarioId);
            console.error('Tipos de dados - remedioId:', typeof dadosDoses.remedioId);
            console.error('Tipos de dados - doses[0]:', typeof dadosDoses.doses[0]);
            console.error('Quantidade de doses:', dadosDoses.doses.length);
            mensagemErro += ". Pode haver um problema com o formato dos dados enviados.";
          }
        }
        
        alert(mensagemErro);
        throw error;
      }
    } catch (error) {
      console.error('%c ERRO NA OPERAÇÃO:', 'background: #f44336; color: white; font-size: 16px; font-weight: bold;');
      console.error('%c', 'color: #f44336; font-size: 14px;', error);
      
      let mensagemErro = 'Erro ao salvar o lembrete. Tente novamente.';
      if (error instanceof Error) {
        mensagemErro = error.message;
      }
      
      // Verificar se é um erro de autenticação
      if (mensagemErro.includes('Authentication required') || 
          mensagemErro.includes('token') || 
          mensagemErro.includes('401')) {
        mensagemErro = 'Sua sessão expirou. Por favor, faça login novamente.';
      }
      
      alert(mensagemErro);
    }
  };
  const limparFormulario = () => {
    if (typeof setNome === 'function') setNome('');
    if (typeof setDosagem === 'function') setDosagem('');
    if (typeof setTipo === 'function') setTipo('');
    if (typeof setCorSelecionada === 'function') setCorSelecionada('#FF0000');
    if (typeof setHorarios === 'function') setHorarios([{ data: new Date().toISOString().split('T')[0], hora: '10:00', dose: '1 comp.' }]);
    if (typeof setMotivo === 'function') setMotivo('');
    if (typeof setDuracao === 'function') setDuracao('');
    if (typeof setQuantidade === 'function') setQuantidade('');
    if (typeof setValidade === 'function') setValidade(null);
    if (typeof setDataValidade === 'function') setDataValidade('');
    if (typeof setIntervalo === 'function') setIntervalo('');
    if (typeof setObservacoes === 'function') setObservacoes('');
    if (typeof setErros === 'function') setErros({});
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
            className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-40 ${
              erros.horario ? 'border-red-500' : 'border-[#037F8C]'
            }`}
            placeholder="AAAA-MM-DD"
          />
          <input
            type="time"
            value={h.hora}
            onChange={(e) => atualizarHorario(index, 'hora', e.target.value)}
            className={`p-2 rounded border bg-white outline-none text-gray-700 KantumruyMedium w-28 ${
              erros.horario ? 'border-red-500' : 'border-[#037F8C]'
            }`}
            placeholder="HH:MM"
          />
        </div>
      ))}
      {erros.horario && (
        <p className="text-red-500 text-sm mb-2">{erros.horario}</p>
      )}
            <div>
          <label className="font-light text-[#0B6E71] block mt-4">
            De quanto em quanto tempo vai ser tomado o remédio? (em horas)
          </label>
          <input
          type="number"
          placeholder="Ex: 6 ou 8..."
          value={Intervalo}
          onChange={(e) => setIntervalo(e.target.value)}
          className={`w-full p-2 border rounded bg-white outline-none text-gray-700 KantumruyMedium mb-1 ${
            erros.intervalo ? 'border-red-500' : 'border-[#037F8C]'
          }`}
          />
          {erros.intervalo && (
            <p className="text-red-500 text-sm mb-2">{erros.intervalo}</p>
          )}
        </div>

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
