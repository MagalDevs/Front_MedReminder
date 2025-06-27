import { LembreteContext } from '@/app/contexts/lembreteContext';
import { apiRequest } from '@/app/utils/api';
import { Bell, Pill, X } from 'lucide-react';
import React, { useContext } from 'react'

interface alarmeDoseProps {
  dataHora: string;
  medicamentoNome: string;
  quantidadeDose: string;
  cor: string;
  id: number;
  onClose: () => void;
}

const Lembrete = (props: alarmeDoseProps) => {
  const { dataHora, medicamentoNome, quantidadeDose, cor, id, onClose } = props;
  const context = useContext(LembreteContext);

  const dataDose = new Date(dataHora);

  const dia = String(dataDose.getDate()).padStart(2, '0');
  const mes = String(dataDose.getMonth() + 1).padStart(2, '0');
  const ano = dataDose.getFullYear().toString();

  const hora = String(dataDose.getHours()).padStart(2, '0');
  const minuto = String(dataDose.getMinutes()).padStart(2, '0');
  const horario = `${hora}:${minuto}`;


  const hashCor: Record<string, string> = {
    'Vermelho': '#FF0000',
    'Azul': '#4B00FF',
    'Amarelo': '#FFFF00',
    'Laranja': '#FFA500',
    'Azul claro': '#00CFFF',
    'Branco': '#FFFFFF',
    'Verde claro': '#00FF7F',
    'Verde escuro': '#006400',
    'Preto': '#000000',
    'Orquídea': '#DA70D6'
  };

  const corFundo = hashCor[cor] || '#FF0000';

  const medicamentoTomado = async () => {
    await apiRequest(`dose/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        tomado: true,
      }),
    });

    await context?.getLembretes(); // Atualiza os lembretes no contexto
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 min-h-screen w-full ${
        cor === 'Branco' ? 'text-gray-800' : 'text-white'
      }`}
      style={{
        backgroundColor: corFundo,
        ...(cor === 'Branco' && {
          border: '1px solid #e5e7eb',
          boxShadow: '0 0 12px rgba(0,0,0,0.08)',
        }),
      }}
    >
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              cor === 'Branco' ? 'bg-gray-200' : 'bg-white/20'
            }`}>
              <Bell className="w-8 h-8 animate-bounce" color={cor === 'Branco' ? '#808080' : '#FFFFFF'} />
            </div>
            <h2 className="text-2xl font-bold">Hora do Medicamento!</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 h-auto rounded-full transition ${
              cor === 'Branco' ? 'bg-gray-100 hover:bg-gray-300' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <X className="w-6 h-6" color={cor === 'Branco' ? '#4B5563' : '#FFFFFF'} />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-4">
            <Pill className="w-6 h-6" color={cor === 'Branco' ? '#808080' : '#FFFFFF'} />
            <div>
              <p className="text-lg opacity-90">Medicamento</p>
              <p className="text-3xl font-bold">{medicamentoNome}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-lg opacity-90">Data</p>
              <p className="text-2xl font-semibold">{dia}/{mes}/{ano}</p>
            </div>
            <div>
              <p className="text-lg opacity-90">Horário</p>
              <p className="text-2xl font-semibold">{horario}</p>
            </div>
          </div>

          <div
            className={`rounded-lg p-6 text-center ${
              cor === 'Branco' ? 'bg-gray-100 shadow-inner' : 'bg-white/20'
            }`}
          >
            <p className="text-lg opacity-90">Dosagem</p>
            <p className="text-4xl font-bold">{quantidadeDose}</p>
          </div>
        </div>

        <button
          onClick={medicamentoTomado}
          className={`w-full transition ${
            cor === 'Branco'
              ? 'bg-gray-100 hover:bg-gray-300 text-gray-900'
              : 'bg-white hover:bg-gray-100 text-black'
          } font-bold py-4 text-lg rounded-md`}
        >
          Medicamento Tomado
        </button>
      </div>
    </div>
  )
}

export default Lembrete;
