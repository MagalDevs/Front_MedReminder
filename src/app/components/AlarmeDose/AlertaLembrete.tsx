'use client';

import { useContext, useEffect, useLayoutEffect, useRef, useState, type ContextType } from 'react';
import Lembrete from './Lembrete';
import { LembreteContext } from '@/app/contexts/lembreteContext';
import { isDoseInstant } from '@/app/features/web-ux/domain/agenda';

type ReminderContext = NonNullable<ContextType<typeof LembreteContext>>;
function AlarmQueue({ context }: { context: ReminderContext }) {
  const [queue, setQueue] = useState<number[]>([]);
  const displayed = useRef(new Set<number>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const latest = useRef(context.lembretes);
  useLayoutEffect(() => { latest.current = context.lembretes; }, [context.lembretes]);
  useEffect(() => {
    const now = new Date();
    const eligible = context.lembretes.filter(dose => !dose.tomado && isDoseInstant(dose.data_dose) && new Date(dose.data_dose).toDateString() === now.toDateString());
    const ids = new Set(eligible.map(dose => dose.id));
    for (const [id, timer] of timers.current) if (!ids.has(id)) { clearTimeout(timer); timers.current.delete(id); }
    for (const dose of eligible) {
      const delay = new Date(dose.data_dose).getTime() - now.getTime();
      if (delay < 0 || displayed.current.has(dose.id) || timers.current.has(dose.id)) continue;
      timers.current.set(dose.id, setTimeout(() => {
        timers.current.delete(dose.id);
        if (displayed.current.has(dose.id) || !latest.current.some(item => item.id === dose.id && !item.tomado)) return;
        displayed.current.add(dose.id); setQueue(previous => [...previous, dose.id]);
      }, delay));
    }
  }, [context.lembretes]);
  useEffect(() => { const activeTimers = timers.current; return () => { for (const timer of activeTimers.values()) clearTimeout(timer); activeTimers.clear(); }; }, []);
  const visible = queue.map(id => context.lembretes.find(dose => dose.id === id && !dose.tomado)).find(Boolean);
  return visible ? <Lembrete key={visible.id} id={visible.id} dataHora={new Date(visible.data_dose).toISOString()} medicamentoNome={visible.remedio.nome} quantidadeDose={visible.remedio.quantidadeDose} cor={visible.remedio.cor} onClose={() => setQueue(previous => previous.filter(id => id !== visible.id))} /> : null;
}
export default function AlertaLembretes() {
  const context = useContext(LembreteContext);
  return context?.identityKey ? <AlarmQueue key={context.identityKey} context={context} /> : null;
}
