import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeusMedicamentosContent from '@/app/meus-medicamentos/MeusMedicamentosContent';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const medicine = { id: 7, nome: 'Sintético', classificacao: 'Teste' };
async function mountList() {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: [medicine] }));
  const view = render(<MeusMedicamentosContent />);
  await screen.findByRole('heading', { name: 'Sintético' });
  return view;
}

describe('NET-13 NET-14 medicamentos', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'a');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it.each([503, 'network'] as const)(
    'ERR-01 NET-13 ERR-15 falha%s não mostra lista vazia',
    async (status) => {
      if (status === 'network')
        vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
      else vi.mocked(fetch).mockResolvedValueOnce(json({}, status));
      render(<MeusMedicamentosContent />);
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
    render(<MeusMedicamentosContent />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível interpretar a resposta do serviço. Tente novamente.',
    );
  });

  it.each([403, 404, 500])(
    'ERR-01 NET-14 DELETE%s mantém lista e recupera controle',
    async (status) => {
      await mountList();
      vi.mocked(fetch).mockResolvedValueOnce(
        json({ message: 'SQLITE_ERROR private' }, status),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Excluir medicamento' }),
      );
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
      expect(window.confirm).toHaveBeenCalledTimes(1);
    },
  );

  it('ERR-18 exclusão confirmada limpa erro próprio e atualiza lista; cancelamento não envia', async () => {
    await mountList();
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    fireEvent.click(
      screen.getByRole('button', { name: 'Excluir medicamento' }),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Excluir medicamento' }),
    );
    await screen.findByRole('alert');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Excluir medicamento' }),
    );
    await screen.findByText('Nenhum medicamento encontrado');
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
    const view = render(<MeusMedicamentosContent />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
