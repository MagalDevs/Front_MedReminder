import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BuscaMedicamento from '@/app/components/CardBusca/cardBusca';

describe('NET-19 CardBusca catálogo', () => {
  it.each(['0', '7', 'invalid'])('ERR-01 NET-19 ERR-09 HTTP429 respeita Retry-After %s', async retryAfter => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('private', { status: 429, headers: { 'Retry-After': retryAfter } }));
    const onSelect = vi.fn();
    render(<BuscaMedicamento onSelect={onSelect} />);
    const suffix = retryAfter === 'invalid' ? '' : ` Aguarde ${retryAfter} segundos.`;
    expect(await screen.findByRole('alert')).toHaveTextContent(`Ao carregar catálogo de medicamentos: Muitas tentativas. Tente novamente mais tarde.${suffix}`);
    expect(screen.getByRole('alert').textContent).toBe(`Ao carregar catálogo de medicamentos: Muitas tentativas. Tente novamente mais tarde.${suffix}`);
    expect(screen.getByRole('status', { name: 'Medicamento selecionado' })).toBeEmptyDOMElement();
    expect(onSelect).not.toHaveBeenCalled();
  });
  it.each([
    [503, 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'],
    ['network', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
    ['header', 'Não foi possível interpretar a resposta do serviço. Tente novamente.'],
    ['parser', 'Não foi possível interpretar a resposta do serviço. Tente novamente.'],
    ['body', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
  ] as const)('ERR-01 NET-19 falha %s produz alerta e não falso vazio/seleção', async (failure, message) => {
    if (failure === 'network') vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private'));
    else if (failure === 'body') vi.mocked(fetch).mockResolvedValueOnce({ ok: true, text: () => Promise.reject(new TypeError('private')) } as unknown as Response);
    else vi.mocked(fetch).mockResolvedValueOnce(new Response(failure === 'header' ? 'nome,detalhe\nTeste,privado' : failure === 'parser' ? 'NOME_PRODUTO,DESCRIÇÃO\n"sem fechar,erro' : 'private', { status: typeof failure === 'number' ? failure : 200 }));
    const onSelect = vi.fn();
    render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Teste" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(`Ao carregar catálogo de medicamentos: ${message}`);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.queryByText('Nenhum resultado encontrado')).not.toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).not.toHaveTextContent('private');
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'Medicamento selecionado' })).toBeEmptyDOMElement();
  });
  it('ERR-14 loading distinto de vazio; descrição vazia permite seleção real', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const onSelect = vi.fn();
    render(<BuscaMedicamento onSelect={onSelect} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Teste' } });
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Carregando catálogo');
    expect(screen.queryByText('Nenhum resultado encontrado')).not.toBeInTheDocument();
    await act(async () => resolve(new Response('NOME_PRODUTO,DESCRIÇÃO\nTeste,\n')));
    fireEvent.click(screen.getByText('Teste'));
    await screen.findByText('Selecionado: Teste');
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ NOME_PRODUTO: 'Teste', DESCRIÇÃO: '' });
    expect(screen.queryByRole('status', { name: '' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Medicamento selecionado' })).toHaveTextContent('Selecionado: Teste');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-19 desmontagem aborta sem erro tardio nem seleção inicial', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const onSelect = vi.fn();
    const view = render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Teste" />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    await act(async () => resolve(new Response('NOME_PRODUTO,DESCRIÇÃO\nTeste,\n')));
    expect(signal?.aborted).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ERR-18 nova carga bem sucedida limpa erro e seleciona valor inicial', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    const onSelect = vi.fn();
    const view = render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Teste" />);
    await screen.findByRole('alert');
    view.unmount();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('NOME_PRODUTO,DESCRIÇÃO\nTeste,descrição\n'));
    render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Teste" />);
    await screen.findByText('Selecionado: Teste');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ NOME_PRODUTO: 'Teste', DESCRIÇÃO: 'descrição' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
