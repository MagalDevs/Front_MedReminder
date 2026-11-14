import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import RequestFeedback from '@/app/components/RequestFeedback/RequestFeedback';
import { apiRequest, ApiError } from '@/app/utils/api';

function Reading({ notBefore }: { notBefore?: number }) {
  const [message, setMessage] = useState('Não foi possível atualizar a agenda.');
  const [kind, setKind] = useState<'error' | 'success'>('error');
  const [name, setName] = useState('Último conteúdo: Amoxicilina');
  return <><p>{name}</p><RequestFeedback kind={kind} message={message} context="Agenda" retry={{ notBefore,
    onRetry: async () => {
      try {
        const response = await apiRequest<{ data: { nome: string } }>('/dose/me', { requireAuth: false });
        setName(`Agenda atualizada: ${response.data.nome}`); setMessage('Agenda atualizada.'); setKind('success');
      } catch { setMessage('A atualização falhou. O último conteúdo foi mantido.'); }
    },
  }} /></>;
}

it('WUX_STATE_01 retry refreshes only the failed reading and renders the returned data', async () => {
  const requests: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_input, init?: RequestInit) => {
    requests.push(init?.method || 'GET');
    return new Response(JSON.stringify({ data: { nome: 'Paracetamol' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  render(<Reading />);
  expect(requests).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Agenda atualizada: Paracetamol')).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('Agenda: Agenda atualizada.');
  expect(requests).toEqual(['GET']);
});

it('WUX_STATE_02 announces loading while preserving the error and last known content', async () => {
  let resolve!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(done => { resolve = done; })));
  render(<Reading />);
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Agenda: Não foi possível atualizar a agenda.');
  expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  expect(screen.getByText('Último conteúdo: Amoxicilina')).toBeVisible();
  expect(screen.queryByText('Nenhuma dose')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Carregando…' })).toBeDisabled();
  await act(async () => resolve(new Response(JSON.stringify({ data: { nome: 'Paracetamol' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
  expect(await screen.findByText('Agenda atualizada: Paracetamol')).toBeVisible();
});

it('WUX_STATE_08 honors the actual 429 Retry-After deadline with no automatic retry', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const requests: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_input, init?: RequestInit) => {
    requests.push(init?.method || 'GET');
    return requests.length === 1
      ? new Response(JSON.stringify({ message: 'Muitas solicitações.' }), { status: 429, headers: { 'Retry-After': '2', 'Content-Type': 'application/json' } })
      : new Response(JSON.stringify({ data: { nome: 'Paracetamol' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  let error: ApiError | undefined;
  try { await apiRequest('/dose/me', { requireAuth: false }); } catch (caught) { error = caught as ApiError; }
  expect(error?.status).toBe(429);
  expect(error?.retryAfter).toBe(2);
  render(<Reading notBefore={Date.now() + error!.retryAfter! * 1000} />);

  expect(screen.getByRole('status')).toHaveTextContent('Aguarde 2 segundos para tentar novamente.');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); });
  expect(requests).toEqual(['GET']);
  await act(async () => vi.advanceTimersByTime(1999));
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDisabled();
  await act(async () => vi.advanceTimersByTime(1));
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  expect(requests).toEqual(['GET']);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); });
  expect(screen.getByText('Agenda atualizada: Paracetamol')).toBeVisible();
  expect(requests).toEqual(['GET', 'GET']);
});

it('WUX_T05_FAILURE keeps the recoverable error after retry failure and never reports success or emptiness', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  render(<Reading />);
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A atualização falhou. O último conteúdo foi mantido.');
  expect(screen.getByText('Último conteúdo: Amoxicilina')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
});

it('WUX_T05_VOCABULARY supports initial and filtered empty states, progress and confirmed success', () => {
  const { rerender } = render(<RequestFeedback kind="empty" message="Nenhum medicamento cadastrado." />);
  expect(screen.getByRole('status')).toHaveTextContent('Nenhum medicamento cadastrado.');
  rerender(<RequestFeedback kind="filtered" message="Nenhum medicamento corresponde aos filtros." />);
  expect(screen.getByRole('status')).toHaveTextContent('Nenhum medicamento corresponde aos filtros.');
  rerender(<RequestFeedback kind="loading" message="Carregando medicamentos…" />);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando medicamentos…');
  rerender(<RequestFeedback kind="success" message="Tratamento salvo." />);
  expect(screen.getByRole('status')).toHaveTextContent('Tratamento salvo.');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
