import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfiguracoesContent from '@/app/Configuracoes/ConfiguracoesContent';
const state = vi.hoisted(() => ({
  user: { id: 7, nome: 'Ana', email: 'ana@example.test', cep: '01001000' },
}));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => state }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() => localStorage.setItem('access_token', 'a'));
describe('NET-07 perfil carregado', () => {
  it('ERR-01 NET-07 falha de leitura mantém cache identificado e alerta persistente', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json({ message: 'SQLITE_ERROR private' }, 503),
    );
    render(<ConfiguracoesContent />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ao carregar perfil: O serviço está temporariamente indisponível. Tente novamente mais tarde. Alguns dados podem estar desatualizados.',
    );
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent('SQLITE');
    vi.useFakeTimers();
    await act(async () => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  it.each([{}, { data: null }, { data: { id: 7, nome: {} } }])(
    'ERR-12 NET-07 resposta inválida %j não confirma perfil',
    async (body) => {
      vi.mocked(fetch).mockResolvedValueOnce(json(body));
      render(<ConfiguracoesContent />);
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Não foi possível interpretar a resposta do serviço. Tente novamente.',
      );
      expect(
        screen.queryByText('Dados atualizados com sucesso!'),
      ).not.toBeInTheDocument();
    },
  );
  it('ERR-19 NET-07 unmount aborta e ignora falha atrasada', async () => {
    let reject!: (e: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((_r, j) => (reject = j)));
    const view = render(<ConfiguracoesContent />);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new TypeError('private')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

async function mountProfile() {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
  render(<ConfiguracoesContent />);
  await screen.findByDisplayValue('Ana');
}

function submitProfile(password = false) {
  if (password) {
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha atual'), {
      target: { value: 'SenhaAntiga1!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite sua nova senha'), {
      target: { value: 'NovaSenha2!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirme sua nova senha'), {
      target: { value: 'NovaSenha2!' },
    });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
}

describe('NET-08 NET-09 NET-10 salvar perfil e senha', () => {
  it('ERR-19 troca de conta não herda erro de salvamento da conta anterior', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
    const view = render(<ConfiguracoesContent />);
    await screen.findByDisplayValue('Ana');
    vi.mocked(fetch).mockResolvedValueOnce(json({}, 503));
    submitProfile();
    await screen.findByRole('alert');
    const originalUser = state.user;
    state.user = { ...originalUser, id: 8, nome: 'Conta B', email: 'b@example.test' };
    localStorage.setItem('access_token', 'b');
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
    try {
      view.rerender(<ConfiguracoesContent />);
      await screen.findByDisplayValue('Conta B');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Ana')).not.toBeInTheDocument();
    } finally {
      state.user = originalUser;
    }
  });

  it.each([400, 409, 429, 503])(
    'ERR-01 NET-08 falha HTTP%s é segura e restaura controle',
    async (status) => {
      await mountProfile();
      vi.mocked(fetch).mockResolvedValueOnce(
        json({ message: 'SQLITE_ERROR SELECT senha' }, status),
      );
      submitProfile();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ao salvar perfil:',
      );
      expect(screen.getByRole('alert')).not.toHaveTextContent('SQLITE');
      expect(
        screen.getByRole('button', { name: 'Salvar Alterações' }),
      ).toBeEnabled();
      expect(
        screen.queryByText('Dados atualizados com sucesso!'),
      ).not.toBeInTheDocument();
    },
  );

  it('ERR-12 NET-08 envelope de PATCH inválido não anuncia sucesso', async () => {
    await mountProfile();
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: {} }));
    submitProfile();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível interpretar a resposta do serviço. Tente novamente.',
    );
    expect(
      screen.queryByText('Dados atualizados com sucesso!'),
    ).not.toBeInTheDocument();
  });

  it('ERR-01 NET-09 falha da senha mantém perfil confirmado e recuperação limpa só erro próprio', async () => {
    await mountProfile();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        json({ data: { ...state.user, nome: 'Confirmado' } }),
      )
      .mockResolvedValueOnce(json({}, 503));
    submitProfile(true);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Perfil atualizado. Senha não atualizada: O serviço está temporariamente indisponível. Tente novamente mais tarde.',
    );
    expect(screen.getByDisplayValue('Confirmado')).toBeInTheDocument();
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ data: state.user }))
      .mockResolvedValueOnce(json({ message: 'Senha atualizada' }));
    submitProfile(true);
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Perfil e senha atualizados com sucesso!',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite sua nova senha')).toHaveValue(
      '',
    );
  });

  it.each([200, 401, 503])(
    'ERR-01 NET-10 ERR-05 senha401 revalida uma vez, resultado%s',
    async (status) => {
      await mountProfile();
      vi.mocked(fetch)
        .mockResolvedValueOnce(json({ data: state.user }))
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({ data: state.user }, status));
      submitProfile(true);
      const expected =
        status === 200
          ? 'Senha atual incorreta. Sua sessão continua válida.'
          : status === 401
            ? 'Sessão expirada. Entre novamente.'
            : 'Não foi possível verificar a sessão. A alteração da senha não foi confirmada.';
      expect(await screen.findByRole('alert')).toHaveTextContent(expected);
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(localStorage.getItem('access_token')).toBe(
        status === 401 ? null : 'a',
      );
    },
  );

  it('ERR-01 NET-10 falha de revalidação não reflete erro técnico nem confirma senha', async () => {
    await mountProfile();
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ data: state.user }))
      .mockResolvedValueOnce(json({}, 401))
      .mockRejectedValueOnce(new TypeError('http://private/token'));
    submitProfile(true);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível verificar a sessão. A alteração da senha não foi confirmada.',
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('private');
    expect(
      screen.queryByText('Perfil e senha atualizados com sucesso!'),
    ).not.toBeInTheDocument();
  });

  it('ERR-18 sucesso de perfil sem tentar senha preserva o erro anterior da senha', async () => {
    await mountProfile();
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ data: state.user }))
      .mockResolvedValueOnce(json({}, 503));
    submitProfile(true);
    await screen.findByRole('alert');
    for (const placeholder of [
      'Digite sua senha atual',
      'Digite sua nova senha',
      'Confirme sua nova senha',
    ]) {
      fireEvent.change(screen.getByPlaceholderText(placeholder), {
        target: { value: '' },
      });
    }
    vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
    submitProfile();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Dados atualizados com sucesso!',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ao alterar senha: Perfil atualizado. Senha não atualizada:',
    );
  });
});
