import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlertaLembretes from '@/app/components/AlarmeDose/AlertaLembrete';
import { LembreteProvider } from '@/app/contexts/lembreteContext';
import { API_URL } from '@/app/utils/api';

const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
const now = new Date('2026-11-04T12:00:00-03:00');

async function advance(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe('IT-08 SEC-03 — alerta real sem logs de tratamento', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    for (const method of methods) vi.spyOn(console, method).mockImplementation(() => {});
    localStorage.setItem('access_token', 'token-sintetico');
  });

  it.each([
    { horario: '12:01:01', delay: 61_000, id: 801 },
    { horario: '12:30:00', delay: 1_800_000, id: 802 },
  ])('IT-08 SEC-03 agenda exatamente às $horario e confirma dose $id sem expor dados', async ({ horario, delay, id }) => {
    const data_dose = `2026-11-04T${horario}-03:00`;
    const dose = {
      id, tomado: false, data_dose, usuarioId: 901, remedioId: 701,
      remedio: { nome: `Remédio-Sentinela-${id}`, quantidadeDose: `Dose-Sentinela-${id}`, cor: 'Azul', horaInicio: '07:43' },
    };
    const events: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const path = new URL(String(input)).pathname;
      const method = init?.method ?? 'GET';
      events.push(`${method} ${path}`);
      if (method === 'GET' && path === '/dose/me') {
        return new Response(JSON.stringify({ success: true, data: [dose] }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'PUT' && path === `/dose/${id}`) {
        await gate;
        dose.tomado = true;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Chamada não simulada: ${method} ${path}`);
    });
    const timer = vi.spyOn(globalThis, 'setTimeout');
    const view = render(<LembreteProvider><AlertaLembretes /></LembreteProvider>);
    const sentinels = [dose.remedio.nome, dose.remedio.quantidadeDose, dose.remedio.horaInicio,
      data_dose, new Date(data_dose).toISOString(), String(delay)];
    function expectPrivateConsole() {
      for (const method of methods) {
        const output = JSON.stringify(vi.mocked(console[method]).mock.calls);
        for (const sentinel of sentinels) expect(output).not.toContain(sentinel);
      }
    }

    try {
      await advance(0);
      expect(events).toEqual(['GET /dose/me']);
      expect(timer).toHaveBeenCalledWith(expect.any(Function), delay);
      expect(vi.getTimerCount()).toBe(1);
      expectPrivateConsole();
      await advance(delay - 1);
      expect(screen.queryByText('Hora do Medicamento!')).not.toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(Date.now()).toBe(new Date(data_dose).getTime());
      expect(screen.getByText('Hora do Medicamento!')).toBeInTheDocument();
      expect(screen.getByText(dose.remedio.nome)).toBeInTheDocument();
      expect(screen.getByText(dose.remedio.quantidadeDose)).toBeInTheDocument();
      expect(screen.getByText(horario.slice(0, 5))).toBeInTheDocument();
      expect(screen.getByText('04/11/2026')).toBeInTheDocument();
      expectPrivateConsole();

      fireEvent.click(screen.getByRole('button', { name: 'Medicamento Tomado' }));
      await advance(0);
      expect(fetch).toHaveBeenNthCalledWith(2, `${API_URL}/dose/${id}`, expect.objectContaining({
        method: 'PUT', body: '{"tomado":true}',
      }));
      const headers = new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers);
      expect(headers.get('Authorization')).toBe('Bearer token-sintetico');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(events).toEqual(['GET /dose/me', `PUT /dose/${id}`]);
      expect(screen.getByText('Hora do Medicamento!')).toBeInTheDocument();
      await act(async () => { release(); });
      await advance(0);
      expect(events).toEqual(['GET /dose/me', `PUT /dose/${id}`, 'GET /dose/me']);
      expect(screen.queryByText('Hora do Medicamento!')).not.toBeInTheDocument();
      expectPrivateConsole();
      // The existing token storage contract remains; this task only minimizes logs.
      expect(localStorage.getItem('access_token')).toBe('token-sintetico');
    } finally {
      view.unmount();
      vi.clearAllTimers();
    }
  });
});
