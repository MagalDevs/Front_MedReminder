import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigurarLembrete from '@/app/components/CardCadastrar/cardCadastrar';
import ToastProvider from "@/app/components/Feedback/ToastProvider";
import { LembreteContext } from '@/app/contexts/lembreteContext';

vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 7 }, isAuthenticated: true }),
}));
const json = (data: unknown, status = 201) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const refresh = vi.fn<() => Promise<boolean | void>>();
function mount() {
  const view = render(
    <LembreteContext.Provider
      value={{ lembretes: [], lembretesHoje: [], getLembretes: refresh }}
    >
      <ConfigurarLembrete
        medicamentoSelecionado={{ nome: 'Sintético', tipo: 'Teste' }}
      />
    </LembreteContext.Provider>,
    { wrapper: ToastProvider },
  );
  for (const [placeholder, value] of [
    ['500', '500'],
    ['30', '30'],
    ['6 (horas)', '24'],
    ['7', '1'],
  ]) {
    fireEvent.change(screen.getByPlaceholderText(placeholder), {
      target: { value },
    });
  }
  const dates = view.container.querySelectorAll('input[type="date"]');
  fireEvent.change(dates[0], { target: { value: '2027-12-31' } });
  fireEvent.change(dates[1], { target: { value: '2026-11-12' } });
  return view;
}
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Salvar lembrete' }));
function confirmedResponse(_url: unknown, options?: RequestInit) {
  const body = JSON.parse(String(options?.body));
  return Promise.resolve(
    json({
      data: {
        remedio: { id: 77 },
        doses: body.doses.map((data_dose: string, id: number) => ({
          id,
          data_dose,
        })),
      },
    }),
  );
}

describe('NET-12 tratamento', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'a');
    refresh.mockReset().mockResolvedValue(true);
  });

  it.each([400, 409, 503, 'network'] as const)(
    'ERR-01 NET-12 falha%s é inline, segura e recuperável',
    async (status) => {
      if (status === 'network')
        vi.mocked(fetch).mockRejectedValueOnce(
          new TypeError('http://private/token'),
        );
      else
        vi.mocked(fetch).mockResolvedValueOnce(
          json({ message: 'SQLITE_ERROR private' }, status),
        );
      mount();
      submit();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ao salvar tratamento:',
      );
      expect(screen.getByRole('alert')).not.toHaveTextContent('private');
      expect(
        screen.getByRole('button', { name: 'Salvar lembrete' }),
      ).toBeEnabled();
      expect(screen.getByPlaceholderText('Dipirona')).toHaveValue('Sintético');
      expect(refresh).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Fechar notificação' })).not.toBeInTheDocument();
    },
  );

  it('ERR-12 contrato incompleto não anuncia tratamento salvo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json({ data: { remedio: { id: 7 } } }),
    );
    mount();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível interpretar a resposta do serviço. Tente novamente.',
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Fechar notificação' })).not.toBeInTheDocument();
  });

  it('ERR-18 reenvio explícito mantém chave, limpa erro e confirma resultado', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockImplementationOnce(confirmedResponse);
    mount();
    submit();
    await screen.findByRole('alert');
    const first = vi.mocked(fetch).mock.calls[0][1];
    submit();
    expect(await screen.findByText('Lembrete e doses salvos com sucesso!')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(first?.body);
    expect(
      new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).get(
        'Idempotency-Key',
      ),
    ).toBe(new Headers(first?.headers).get('Idempotency-Key'));
  });

  it('ERR-01 NET-12 confirmação seguida de refresh falho preserva resultado gravado', async () => {
    refresh.mockResolvedValue(false);
    vi.mocked(fetch).mockImplementationOnce(confirmedResponse);
    mount();
    submit();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tratamento salvo. A atualização dos lembretes não foi concluída.',
    );
    expect(screen.getByPlaceholderText('Dipirona')).toHaveValue('');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('ERR-19 desmontagem cancela e ignora resposta tardia', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((_r, j) => {
        reject = j;
      }),
    );
    const view = mount();
    submit();
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Fechar notificação' })).not.toBeInTheDocument();
  });
});
