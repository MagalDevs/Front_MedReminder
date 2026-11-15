import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LembreteProvider } from '@/app/contexts/lembreteContext';
import MeusLembretesContent from '@/app/meus-lembretes/MeusLembretesContent';

const logout = vi.hoisted(() => vi.fn());
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1 },
    isAuthenticated: true,
    loading: false,
    logout,
  }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const dose = {
  id: 7,
  tomado: false,
  data_dose: new Date(Date.now() - 1000).toISOString(),
  remedioId: 1,
  remedio: { nome: 'Sintético', quantidadeDose: '1', cor: 'Branco' },
};
function mount() {
  return render(
    <LembreteProvider>
      <MeusLembretesContent />
    </LembreteProvider>,
  );
}
function install() {
  const api = {
    readFailure: false,
    putFailure: false,
    confirmed: false,
    failRefresh: false,
  };
  vi.mocked(fetch).mockImplementation(async (url, init) => {
    if (String(url).endsWith('/remedio/me'))
      return api.readFailure
        ? json({}, 503)
        : json({ data: [{ id: 1, nome: 'Sintético' }] });
    if (init?.method === 'PUT') {
      if (api.putFailure) return json({}, 503);
      api.confirmed = true;
      return json({});
    }
    if (api.confirmed && api.failRefresh) return json({}, 503);
    return json({ data: [{ ...dose, tomado: api.confirmed }] });
  });
  return api;
}
beforeEach(() => localStorage.setItem('access_token', 'a'));

describe('NET-15 NET-16 lembretes', () => {
  it.each([
    { tomado: 'false' }, { tomado: null }, { tomado: undefined },
    { data_dose: null }, { data_dose: undefined }, { data_dose: 'invalid' },
    { id: null }, { remedio: { ...dose.remedio, nome: null } },
    ...['quantidadeDose', 'cor'].flatMap(field => [null, undefined, {}].map(value => ({ remedio: { ...dose.remedio, [field]: value } }))),
  ])('ERR-01 ERR-12 dose inválida %j não publica linha nem controle', async (invalid) => {
    vi.mocked(fetch).mockImplementation(async url => String(url).endsWith('/remedio/me')
      ? json({ data: [{ id: 1, nome: 'Sintético' }] })
      : json({ data: [{ ...dose, ...invalid }] }));
    const view = mount();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Ao carregar lembretes: Não foi possível interpretar a resposta do serviço. Tente novamente.');
    await screen.findByText('Os lembretes não puderam ser carregados.');
    expect(view.container.querySelector('.animate-spin')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Sintético' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como tomado/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum lembrete encontrado')).not.toBeInTheDocument();
  });
  it.each([false, true])('ERR-12 booleano válido %s mantém status controle e filtros', async (tomado) => {
    vi.mocked(fetch).mockImplementation(async url => String(url).endsWith('/remedio/me')
      ? json({ data: [{ id: 1, nome: 'Sintético' }] })
      : json({ data: [{ ...dose, tomado }] }));
    mount();
    await screen.findByRole('heading', { name: 'Sintético' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(tomado ? 'Tomado' : 'Pendente', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como tomado/ }) !== null).toBe(!tomado);
    const status = screen.getAllByRole('combobox')[1];
    fireEvent.change(status, { target: { value: String(!tomado) } });
    expect(screen.queryByRole('heading', { name: 'Sintético' })).not.toBeInTheDocument();
    fireEvent.change(status, { target: { value: String(tomado) } });
    expect(screen.getByRole('heading', { name: 'Sintético' })).toBeInTheDocument();
  });
  it('ERR-01 NET-15 ERR-15 leitura de medicamentos falha sem falso vazio', async () => {
    const api = install();
    api.readFailure = true;
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ao carregar medicamentos dos lembretes: O serviço está temporariamente indisponível.',
    );
    expect(
      screen.queryByText('Nenhum lembrete encontrado'),
    ).not.toBeInTheDocument();
  });

  it('ERR-12 NET-15 envelope inválido não confirma consulta', async () => {
    vi.mocked(fetch).mockImplementation(async (url) =>
      json({ data: String(url).endsWith('/remedio/me') ? {} : [] }),
    );
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível interpretar a resposta do serviço. Tente novamente.',
    );
  });

  it('ERR-01 NET-15 ERR-20 falha de doses fica só no provider e não mostra vazio', async () => {
    vi.mocked(fetch).mockImplementation(async (url) =>
      new URL(String(url)).pathname === '/dose/me' ? json({}, 503) : json({ data: [] }),
    );
    mount();
    await screen.findByRole('alert');
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(
      screen.queryByText('Nenhum lembrete encontrado'),
    ).not.toBeInTheDocument();
  });

  it('ERR-01 NET-16 PUT falho mantém dose pendente e recupera botão', async () => {
    const api = install();
    api.putFailure = true;
    mount();
    fireEvent.click(
      await screen.findByRole('button', { name: /Marcar como tomado/ }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ao confirmar dose: O serviço está temporariamente indisponível.',
    );
    expect(
      screen.getByText('Pendente', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Marcar como tomado/ }),
    ).toBeEnabled();
    expect(api.confirmed).toBe(false);
  });

  it('ERR-18 retry explícito confirmado remove erro e mostra Tomado', async () => {
    const api = install();
    api.putFailure = true;
    mount();
    fireEvent.click(
      await screen.findByRole('button', { name: /Marcar como tomado/ }),
    );
    await screen.findByRole('alert');
    api.putFailure = false;
    fireEvent.click(screen.getByRole('button', { name: /Marcar como tomado/ }));
    await screen.findByText('Tomado');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Marcar como tomado/ }),
    ).not.toBeInTheDocument();
  });

  it('ERR-01 NET-16 refresh falho após confirmação oferece refresh sem novo PUT', async () => {
    const api = install();
    api.failRefresh = true;
    mount();
    fireEvent.click(
      await screen.findByRole('button', { name: /Marcar como tomado/ }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Dose confirmada. A atualização dos lembretes não foi concluída.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    api.failRefresh = false;
    fireEvent.click(
      screen.getByRole('button', { name: 'Atualizar lembretes' }),
    );
    await screen.findByText('Tomado');
    expect(
      vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT'),
    ).toHaveLength(1);
  });

  it('ERR-19 desmontagem cancela leitura e ignora resposta tardia', async () => {
    let reject!: (e: unknown) => void;
    vi.mocked(fetch).mockImplementation((url) =>
      String(url).endsWith('/remedio/me')
        ? new Promise((_r, j) => {
            reject = j;
          })
        : Promise.resolve(json({ data: [] })),
    );
    const view = mount();
    const options = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/remedio/me'))?.[1];
    view.unmount();
    expect(options?.signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
