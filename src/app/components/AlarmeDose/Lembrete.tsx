import { Bell, Pill, X } from 'lucide-react';
import React from 'react'

interface alarmeDoseProps {
  dataHora: string;
  medicamentoNome: string;
  quantidadeDose: string;
  cor: string;
  onClose: () => void;
}

const Lembrete = (props: alarmeDoseProps) => {
  const { dataHora, medicamentoNome, quantidadeDose, cor, onClose } = props;

  const dia = dataHora.split('T')[0].split('-')[2];
  const mes = dataHora.split('T')[0].split('-')[1];
  const ano = dataHora.split('T')[0].split('-')[0];
  const horario = dataHora.split('T')[1].slice(0, 5); 

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

  return (
    <div
      className={`bg-[${corFundo}] fixed inset-0 flex flex-col items-center justify-center text-white z-50 min-h-screen w-full`}
    >
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold">Hora do Medicamento!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 h-auto"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-4">
            <Pill className="w-6 h-6" />
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

          <div className="bg-white/20 rounded-lg p-6 text-center">
            <p className="text-lg opacity-90">Dosagem</p>
            <p className="text-4xl font-bold">{quantidadeDose}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-white text-black hover:bg-gray-100 font-bold py-4 text-lg"
        >
          Medicamento Tomado
        </button>
      </div>
    </div>
  )
}

export default Lembrete;