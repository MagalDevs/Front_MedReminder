import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeusMedicamentosContent from '@/app/meus-medicamentos/MeusMedicamentosContent';
import ToastProvider from '@/app/components/Feedback/ToastProvider';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const medicine = { id: 7, nome: 'Sintético', classificacao: 'Teste' };
const renderList = () => render(<MeusMedicamentosContent />, { wrapper: ToastProvider });
const openDeletion = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Excluir medicamento' }));
  return within(screen.getByRole('alertdialog', { name: 'Excluir medicamento?' }));
};

async function mountList() {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: [medicine] }));
  const view = renderList();
  await screen.findByRole('heading', { name: 'Sintético' });
  return view;
}

describe('NET-13 NET-14 medicamentos', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'a');
  });

  it.each([503, 'network'] as const)(
    'ERR-01 NET-13 ERR-15 falha%s não mostra lista vazia',
    async (status) => {
      if (status === 'network')
        vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
      else vi.mocked(fetch).mockResolvedValueOnce(json({}, status));
      renderList();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ao carregar medicamentos:',
      );
      expect(
        screen.queryByText('Nenhum medicamento encontrado'),
      ).not.toBeInTheDocument();
    },
  );

  it('ERR-12 NET-13 envelope inválido produz erro de interpretação', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: [null] }));
    renderList();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível interpretar a resposta do serviço. Tente novamente.',
    );
  });

  it('combina medicamento e validade, incluindo hoje e o 30º dia no período', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00'));
    const data = [
      ['Vence hoje', '2026-11-04'],
      ['Vence em 30 dias', '2026-12-04T00:00:00.000Z'],
      ['Vence em 31 dias', '2026-12-05'],
      ['Já venceu', '2026-11-03'],
      ['Validade ausente', undefined],
      ['Validade inválida', '2026-11-31'],
    ].map(([nome, dataValidade], id) => ({ id: id + 1, nome, dataValidade }));
    vi.mocked(fetch).mockResolvedValueOnce(json({ data }));
    renderList();
    await screen.findByRole('heading', { name: 'Vence hoje' });
    expect(screen.getByText('04/11/2026')).toBeInTheDocument();

    const validade = screen.getByLabelText('Validade');
    const nomes = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    fireEvent.change(validade, { target: { value: 'proximos' } });
    expect(nomes()).toEqual(['Vence hoje', 'Vence em 30 dias']);
    fireEvent.change(validade, { target: { value: 'validos' } });
    expect(nomes()).toEqual(['Vence em 31 dias']);
    fireEvent.change(validade, { target: { value: 'vencidos' } });
    expect(nomes()).toEqual(['Já venceu']);
    fireEvent.change(validade, { target: { value: 'sem-data' } });
    expect(nomes()).toEqual(['Validade ausente', 'Validade inválida']);
    fireEvent.change(screen.getByLabelText('Medicamento'), { target: { value: '2' } });
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum medicamento corresponde aos filtros.');
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(nomes()).toHaveLength(6);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([403, 404, 500])(
    'ERR-01 NET-14 DELETE%s mantém lista e recupera controle',
    async (status) => {
      await mountList();
      vi.mocked(fetch).mockResolvedValueOnce(
        json({ message: 'SQLITE_ERROR private' }, status),
      );
      const dialog = openDeletion();
      expect(dialog.getByText(/Deseja excluir “Sintético”/)).toBeVisible();
      expect(fetch).toHaveBeenCalledTimes(1);
      fireEvent.click(dialog.getByRole('button', { name: 'Excluir' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ao excluir medicamento:',
      );
      expect(
        screen.getByRole('heading', { name: 'Sintético' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Excluir medicamento' }),
      ).toBeEnabled();
      expect(screen.getByRole('alert')).not.toHaveTextContent('private');
      expect(vi.mocked(fetch).mock.calls[1][1]?.method).toBe('DELETE');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    },
  );

  it('ERR-18 exclusão confirmada limpa erro próprio e atualiza lista; cancelamento não envia', async () => {
    await mountList();
    fireEvent.click(openDeletion().getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    fireEvent.click(openDeletion().getByRole('button', { name: 'Excluir' }));
    await screen.findByRole('alert');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    fireEvent.click(openDeletion().getByRole('button', { name: 'Excluir' }));
    await screen.findByText('Nenhum medicamento encontrado');
    expect(screen.getByText('Medicamento excluído com sucesso.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Sintético' }),
    ).not.toBeInTheDocument();
  });

  it('ERR-19 leitura cancelada ignora falha tardia', async () => {
    let reject!: (e: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((_r, j) => {
        reject = j;
      }),
    );
    const view = renderList();
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('descarta a confirmação de exclusão se a sessão mudar com o diálogo aberto', async () => {
    await mountList();
    const dialog = openDeletion();
    localStorage.setItem('access_token', 'b');
    fireEvent.click(dialog.getByRole('button', { name: 'Excluir' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'DELETE')).toBe(true);
  });
});
