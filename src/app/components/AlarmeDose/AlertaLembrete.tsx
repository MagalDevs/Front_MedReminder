'use client'

import { useContext, useEffect, useState } from 'react';
import Lembrete from './Lembrete';
import { LembreteContext } from '@/app/contexts/lembreteContext';

interface LembreteVisivel {
  id: number;
  dataHora: string;
  medicamentoNome: string;
  quantidadeDose: string;
  cor: string;
}

export default function AlertaLembretes() {
  const contexto = useContext(LembreteContext);
  const [lembreteVisivel, setLembreteVisivel] = useState<LembreteVisivel | null>(null);
  const [lembretesExibidos, setLembretesExibidos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!contexto) return;

    contexto.lembretesHoje.forEach((lembrete) => {
      const id = lembrete.id;

      if (lembretesExibidos.has(id)) return; // já foi exibido

      const dataAlvo = new Date(lembrete.data_dose); // já vem com hora certa
      const agora = new Date();
      const delay = dataAlvo.getTime() - agora.getTime();

      console.log('horaInicio:', lembrete.remedio.horaInicio);
      console.log('data_dose:', lembrete.data_dose);
      console.log('dataAlvo:', dataAlvo);
      console.log('delay calculado:', delay);

      if (delay > 0) {
        setTimeout(() => {
          setLembreteVisivel({
            id,
            dataHora: dataAlvo.toISOString(),
            medicamentoNome: lembrete.remedio.nome,
            quantidadeDose: lembrete.remedio.quantidadeDose,
            cor: lembrete.remedio.cor,
          });
          setLembretesExibidos(prev => new Set(prev).add(id));
        }, delay);
      }
    });
  }, [contexto, lembretesExibidos]);

  return lembreteVisivel ? (
    <Lembrete
      dataHora={lembreteVisivel.dataHora}
      medicamentoNome={lembreteVisivel.medicamentoNome}
      quantidadeDose={lembreteVisivel.quantidadeDose}
      cor={lembreteVisivel.cor}
      id={lembreteVisivel.id}
      onClose={() => setLembreteVisivel(null)}
    />
  ) : null;
}
