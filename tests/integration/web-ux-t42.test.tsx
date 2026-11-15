import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import RegistrationScreen from '@/app/features/web-ux/screens/RegistrationScreen';
import { clearNavigationFeedback, consumeNavigationFeedback } from '@/app/utils/navigation-feedback';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const timeout = 'O servidor demorou para responder e não foi possível confirmar o cadastro. Tente entrar com seu e-mail e senha antes de cadastrar novamente.';
const json = () => new Response('{}', { status: 201, headers: { 'content-type': 'application/json' } });
beforeEach(() => { push.mockReset(); clearNavigationFeedback(); });
function mount() {
  const view = render(<RegistrationScreen />);
  const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fill('E-mail', 'ana@example.test'); fill('Senha', 'Senha123!'); fill('Confirmar senha', 'Senha123!'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fill('Nome completo', 'Ana Sintética'); fill('CPF', '12345678901'); fill('CEP', '12345678'); fill('Data de nascimento', '1990-01-02');
  return { ...view, submit: () => fireEvent.click(screen.getByRole('button', { name: 'Criar conta' })) };
}
it.each(['headers', 'body'])('T42 registration deadline includes pending %s and never retries automatically', async phase => {
  vi.useFakeTimers(); let signal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementation(async (_input, init) => { signal = init?.signal ?? undefined; if (phase === 'headers') return new Promise(() => {}); const response = json(); vi.spyOn(response, 'json').mockReturnValue(new Promise(() => {})); return response; });
  mount().submit(); await act(() => vi.advanceTimersByTimeAsync(14999)); expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Criando conta…' })).toBeDisabled();
  await act(() => vi.advanceTimersByTimeAsync(1)); expect(screen.getByRole('alert')).toHaveTextContent(timeout); expect(signal?.aborted).toBe(true); expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled(); expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Sintética'); expect(push).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(60000)); expect(fetch).toHaveBeenCalledTimes(1); expect(consumeNavigationFeedback()).toBeNull();
});
it('T42 late timed-out completion cannot replace a newer registration attempt', async () => {
  vi.useFakeTimers(); let old!: (response: Response) => void; let current!: (response: Response) => void;
  vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { old = resolve; })).mockReturnValueOnce(new Promise(resolve => { current = resolve; }));
  const view = mount(); view.submit(); await act(() => vi.advanceTimersByTimeAsync(15000)); view.submit(); await act(async () => { old(json()); });
  expect(screen.getByRole('button', { name: 'Criando conta…' })).toBeDisabled(); expect(push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull();
  await act(async () => { current(json()); }); expect(push).toHaveBeenCalledExactlyOnceWith('/login'); expect(consumeNavigationFeedback()).toBe('registered'); expect(fetch).toHaveBeenCalledTimes(2);
});
it('T42 abandoning registration aborts pending work and ignores late success', async () => {
  vi.useFakeTimers(); let finish!: (response: Response) => void; vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const view = mount(); view.submit(); const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!; view.unmount(); expect(signal.aborted).toBe(true); await act(async () => { finish(json()); await vi.advanceTimersByTimeAsync(15000); }); expect(push).not.toHaveBeenCalled(); expect(consumeNavigationFeedback()).toBeNull(); expect(fetch).toHaveBeenCalledTimes(1);
});
