import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Cadastro from '@/app/cadastro/page';
import { clearNavigationFeedback, consumeNavigationFeedback } from '@/app/utils/navigation-feedback';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const json = (body: unknown, status = 201, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
function setup() {
  const view = render(<Cadastro />);
  fireEvent.change(screen.getByPlaceholderText('Nome e sobrenome'), { target: { value: 'Pessoa Sintética' } });
  fireEvent.change(screen.getByPlaceholderText('exemplo@email.com'), { target: { value: 'feedback@example.test' } });
  fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '98765432109' } });
  fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '87654321' } });
  fireEvent.change(view.container.querySelector('input[type="date"]')!, { target: { value: '1999-02-03' } });
  screen.getAllByPlaceholderText('********').forEach((input) => fireEvent.change(input, { target: { value: 'Senha-Sintetica123!' } }));
  return { ...view, submit: () => fireEvent.submit(view.container.querySelector('form')!) };
}
describe('NET-01 cadastro feedback', () => {
  beforeEach(() => { router.push.mockReset(); clearNavigationFeedback(); vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'); });
  it.each(['', 'origem inválida'])('REG-02 origem isolada ausente ou inválida: %s', async (origin) => {
    vi.stubEnv('NEXT_PUBLIC_API_ENV', 'isolated'); vi.stubEnv('NEXT_PUBLIC_API_URL', origin); setup().submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Verifique a configuração do serviço.'); expect(fetch).not.toHaveBeenCalled(); expect(router.push).not.toHaveBeenCalled();
  });
  it('REG-04 mostra loading e desabilita imediatamente', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); const view = setup(); view.submit();
    expect(screen.getByRole('button', { name: /carregando/i })).toBeDisabled();
  });
  it('REG-06 clique e Enter simultâneos enviam apenas uma requisição', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); const view = setup(); view.submit(); view.submit(); view.submit(); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('REG-06 gestos reais de clique e Enter preservam um único envio pendente', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    setup();
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByRole('button', { name: 'Carregando...' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Carregando...' }));
    await user.click(screen.getAllByPlaceholderText('********')[1]);
    await user.keyboard('{Enter}{Enter}');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Carregando...' })).toBeDisabled();
  });
  it.each(['headers', 'body'] as const)('REG-10 prazo exato e mensagem integral com %s pendente', async (phase) => {
    vi.useFakeTimers();
    if (phase === 'headers') vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    else {
      const response = json({});
      vi.spyOn(response, 'json').mockReturnValue(new Promise(() => {}));
      vi.mocked(fetch).mockResolvedValue(response);
    }
    setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(14999));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carregando...' })).toBeDisabled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole('alert').textContent).toBe('O servidor demorou para responder e não foi possível confirmar o cadastro. Tente entrar com seu e-mail e senha antes de cadastrar novamente.');
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });
  it.each([400, 409, 500, 'network', 'timeout'] as const)('REG-11 recupera botão e preserva campos após %s', async (failure) => {
    vi.useFakeTimers();
    if (failure === 'network') vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
    else if (failure === 'timeout') vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    else vi.mocked(fetch).mockResolvedValue(json({ message: 'CPF inválido' }, failure));
    setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(15000));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
    expect(screen.getByPlaceholderText('exemplo@email.com')).toHaveValue('feedback@example.test');
    expect(screen.getAllByPlaceholderText('********')[0]).toHaveValue('Senha-Sintetica123!');
    expect(router.push).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('REG-12 conclusão antiga durante nova tentativa não navega nem altera loading', async () => {
    vi.useFakeTimers();
    let finishOld!: (response: Response) => void;
    let finishNew!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }))
      .mockReturnValueOnce(new Promise(resolve => { finishNew = resolve; }));
    const view = setup(); view.submit();
    await act(() => vi.advanceTimersByTimeAsync(15000));
    view.submit();
    await act(async () => { finishOld(json({})); });
    expect(screen.getByRole('button', { name: 'Carregando...' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(consumeNavigationFeedback()).toBeNull();
    await act(async () => { finishNew(json({})); });
    expect(router.push).toHaveBeenCalledExactlyOnceWith('/login');
    expect(consumeNavigationFeedback()).toBe('registered');
  });
  it('REG-07 HTTP201 publica registered e navega sem login automático', async () => {
    vi.mocked(fetch).mockResolvedValue(json({})); setup().submit(); await waitFor(() => expect(router.push).toHaveBeenCalledExactlyOnceWith('/login'));
    expect(consumeNavigationFeedback()).toBe('registered'); expect(localStorage.length).toBe(0); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([200, 202, 204])('REG-07 status %s não confirma cadastro', async (status) => {
    vi.mocked(fetch).mockResolvedValue(status === 204 ? new Response(null, { status }) : json({}, status)); setup().submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível interpretar'); expect(router.push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull();
  });
  it('REG-10 deadline termina exatamente em15000ms e aborta', async () => {
    vi.useFakeTimers(); vi.mocked(fetch).mockReturnValue(new Promise(() => {})); setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(14999)); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1)); expect(screen.getByRole('alert')).toHaveTextContent('não foi possível confirmar o cadastro');
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true); expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });
  it('REG-10 deadline inclui leitura do corpo', async () => {
    vi.useFakeTimers(); const response = json({}); vi.spyOn(response, 'json').mockReturnValue(new Promise(() => {})); vi.mocked(fetch).mockResolvedValue(response); setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(15000)); expect(screen.getByRole('alert')).toHaveTextContent('não foi possível confirmar o cadastro'); expect(router.push).not.toHaveBeenCalled();
  });
  it('REG-10 abort do fetch provocado pelo deadline mantém mensagem de timeout', async () => {
    vi.useFakeTimers(); vi.mocked(fetch).mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')));
    })); setup().submit(); await act(() => vi.advanceTimersByTimeAsync(15000));
    expect(screen.getByRole('alert')).toHaveTextContent('não foi possível confirmar o cadastro');
  });
  it('REG-12 ignora sucesso tardio mesmo se fetch ignorar abort', async () => {
    vi.useFakeTimers(); let finish!: (response: Response) => void; vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { finish = resolve; })); setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(15000)); await act(async () => { finish(json({})); });
    expect(router.push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull(); expect(screen.getByRole('alert')).toHaveTextContent('não foi possível confirmar');
  });
  it('REG-12 unmount aborta sem publicar erro ou aviso', async () => {
    let finish!: (response: Response) => void; vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { finish = resolve; })); const view = setup(); view.submit(); view.unmount();
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true); await act(async () => { finish(json({})); }); expect(router.push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull();
  });
  it('REG-13 validação local não deixa botão bloqueado', () => {
    const view = setup(); fireEvent.change(screen.getAllByPlaceholderText('********')[1], { target: { value: 'outra' } }); view.submit(); expect(fetch).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });
  it.each([400, 409, 422])('REG-14 HTTP%s apresenta mensagens públicas', async (status) => {
    vi.mocked(fetch).mockResolvedValue(json({ message: ['CPF inválido', 'CEP inválido'] }, status)); setup().submit(); expect(await screen.findByRole('alert')).toHaveTextContent('CPF inválido'); expect(screen.getByRole('alert')).toHaveTextContent('CEP inválido');
  });
  it('REG-15 HTTP429 respeita Retry-After zero', async () => {
    vi.mocked(fetch).mockResolvedValue(json({}, 429, { 'Retry-After': '0' })); setup().submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente em 0 segundos.');
  });
  it.each([500, 503])('REG-16 HTTP%s recupera botão sem conteúdo técnico', async (status) => {
    vi.mocked(fetch).mockResolvedValue(json({ message: 'SQLITE_ERROR secret' }, status)); setup().submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao conectar com o servidor.'); expect(screen.getByRole('alert').textContent).toBe('Erro ao conectar com o servidor. Tente novamente mais tarde.'); expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });
  it('ERR-01 REG-16 falha de rede permite nova tentativa e limpa erro anterior', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('http://interno/secret')).mockResolvedValueOnce(json({})); const view = setup(); view.submit(); await screen.findByRole('alert'); expect(screen.getByRole('alert').textContent).toBe('Erro ao conectar com o servidor. Tente novamente mais tarde.'); view.submit(); await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login')); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('REG-13 timeout não reenvia automaticamente depois de restaurar botão', async () => {
    vi.useFakeTimers(); vi.mocked(fetch).mockReturnValue(new Promise(() => {})); setup().submit();
    await act(() => vi.advanceTimersByTimeAsync(75000)); expect(fetch).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });
  it('REG-17 JSON inválido201 não navega nem expõe diagnóstico', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('<html>secret</html>', { status: 201, headers: { 'Content-Type': 'application/json' } })); setup().submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível interpretar'); expect(router.push).not.toHaveBeenCalled();
  });
});
