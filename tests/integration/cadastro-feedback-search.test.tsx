import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '@/app/components/SearchBar/SearchBar';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('NET-20 SearchBar catálogo', () => {
  it.each(['0', '7', 'invalid'])('ERR-01 NET-20 ERR-09 HTTP429 respeita Retry-After %s', async retryAfter => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('private', { status: 429, headers: { 'Retry-After': retryAfter } }));
    render(<SearchBar />);
    const suffix = retryAfter === 'invalid' ? '' : ` Aguarde ${retryAfter} segundos.`;
    expect(await screen.findByRole('alert')).toHaveTextContent(`Ao carregar catálogo de medicamentos: Muitas tentativas. Tente novamente mais tarde.${suffix}`);
    expect(screen.getByRole('alert').textContent).toBe(`Ao carregar catálogo de medicamentos: Muitas tentativas. Tente novamente mais tarde.${suffix}`);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it.each([
    [503, 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'],
    ['network', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
    ['header', 'Não foi possível interpretar a resposta do serviço. Tente novamente.'],
    ['parser', 'Não foi possível interpretar a resposta do serviço. Tente novamente.'],
    ['body', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
  ] as const)('ERR-01 NET-20 falha %s visível antes de buscar e distinta de vazio', async (failure, message) => {
    if (failure === 'network') vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
    else if (failure === 'body') vi.mocked(fetch).mockResolvedValueOnce({ ok: true, text: () => Promise.reject(new TypeError('private')) } as unknown as Response);
    else vi.mocked(fetch).mockResolvedValueOnce(new Response(failure === 'header' ? 'nome,detalhe\nTeste,privado' : failure === 'parser' ? 'NOME_PRODUTO,DESCRIÇÃO\n"sem fechar,erro' : 'private', { status: typeof failure === 'number' ? failure : 200 }));
    render(<SearchBar />);
    expect(await screen.findByRole('alert')).toHaveTextContent(`Ao carregar catálogo de medicamentos: ${message}`);
    expect(screen.getByRole('textbox')).toHaveValue('');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Teste' } });
    expect(screen.queryByText('Nenhum resultado encontrado')).not.toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).not.toHaveTextContent('private');
  });
  it('ERR-14 loading não representa vazio; sucesso permite descrição vazia e navegação codificada', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r; }));
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ácido &' } });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando catálogo');
    expect(screen.queryByText('Nenhum resultado encontrado')).not.toBeInTheDocument();
    await act(async () => resolve(new Response('NOME_PRODUTO,DESCRIÇÃO\nÁcido & Sol,\n')));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ácido & Sol'));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(push).toHaveBeenCalledWith('/novo-medicamento?medicamento=%C3%81cido%20%26%20Sol');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-19 desmontagem aborta e descarta falha tardia', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((_r, j) => { reject = j; }));
    const view = render(<SearchBar />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    await act(async () => reject(new TypeError('private')));
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-18 nova carga bem sucedida não retém erro anterior', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    const view = render(<SearchBar />);
    await screen.findByRole('alert');
    view.unmount();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('NOME_PRODUTO,DESCRIÇÃO\nTeste,descrição\n'));
    await act(async () => { render(<SearchBar />); });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Teste' } });
    expect(screen.getByText('descrição')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
