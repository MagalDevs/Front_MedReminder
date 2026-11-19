const daysInPeriod = { hoje: 1, semana: 7, mes: 30 } as const;

export type Periodo = 'todos' | keyof typeof daysInPeriod;

export function filtroDePeriodo(periodo: Periodo, agora: Date, modo: 'lembretes' | 'historico') {
  const inicio = new Date(agora);
  if (periodo !== 'todos') inicio.setDate(inicio.getDate() - (daysInPeriod[periodo] - 1));
  inicio.setHours(0, 0, 0, 0);

  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(0, 0, 0, 0);

  return (data: Date | string) => {
    const instante = new Date(data).getTime();
    if (!Number.isFinite(instante) || (periodo !== 'todos' && instante < inicio.getTime())) return false;
    if (modo === 'historico') return instante <= agora.getTime();
    return periodo === 'todos' || instante < amanha.getTime();
  };
}

export function dataDeValidade(valor: string | null | undefined) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(valor) || !Number.isFinite(Date.parse(valor))) return null;

  // A validade é uma data de calendário. O campo também pode vir como ISO.
  const dia = valor.slice(0, 10);
  const data = new Date(`${dia}T00:00:00Z`);
  return data.toISOString().slice(0, 10) === dia ? data : null;
}

export function diasAteValidade(validade: Date, hoje: Date) {
  const diaAtual = new Date(0);
  diaAtual.setUTCFullYear(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return (validade.getTime() - diaAtual.getTime()) / 86_400_000;
}
