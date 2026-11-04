import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfiguracoesContent from '@/app/Configuracoes/ConfiguracoesContent';

const state = vi.hoisted(() => ({ user: { id: 7, nome: 'Ana', email: 'ana@example.test', cep: '01001000' } }));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => state }));
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const profile = () => json({ message: 'ok', data: { ...state.user, nome: 'Ana Atualizada' } });
async function mount() {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
  render(<ConfiguracoesContent />);
  await screen.findByDisplayValue('Ana');
}
function submit(password = false) {
  if (password) {
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha atual'), { target: { value: 'SenhaAntiga1!' } });
    fireEvent.change(screen.getByPlaceholderText('Digite sua nova senha'), { target: { value: 'NovaSenha2!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirme sua nova senha'), { target: { value: 'NovaSenha2!' } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
}

describe('BEAPI-05 BEAPI-06 perfil e senha', () => {
  beforeEach(() => localStorage.setItem('access_token', 'token-sintetico'));
  it('consome envelope PATCH e envia apenas nome email CEP', async () => {
    await mount();
    vi.mocked(fetch).mockResolvedValueOnce(profile());
    submit();
    await screen.findByText('Dados atualizados com sucesso!');
    expect(screen.getByDisplayValue('Ana Atualizada')).toBeInTheDocument();
    const [, options] = vi.mocked(fetch).mock.calls[1];
    expect(JSON.parse(String(options?.body))).toEqual({ nome: 'Ana', email: state.user.email, cep: '01001000' });
  });
  it('CEP vazio permanece no DTO e validação array não anuncia sucesso', async () => {
    await mount();
    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '' } });
    vi.mocked(fetch).mockResolvedValueOnce(json({ message: ['CEP deve ter oito dígitos'] }, 400));
    submit();
    await screen.findByText('CEP deve ter oito dígitos');
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)).cep).toBe('');
    expect(screen.queryByText('Dados atualizados com sucesso!')).not.toBeInTheDocument();
  });
  it('senha válida consome resposta somente message', async () => {
    await mount();
    vi.mocked(fetch).mockResolvedValueOnce(profile()).mockResolvedValueOnce(json({ message: 'Senha atualizada' }));
    submit(true);
    await screen.findByText('Perfil e senha atualizados com sucesso!');
    expect(screen.getByPlaceholderText('Digite sua nova senha')).toHaveValue('');
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body))).toEqual({ senhaAtual: 'SenhaAntiga1!', novaSenha: 'NovaSenha2!' });
  });
  it.each([
    [400, ['Nova senha precisa de símbolo'], 'Nova senha precisa de símbolo'],
    [409, 'conflict', 'Conflito ao atualizar'],
    [429, 'limit', 'Muitas tentativas'],
    [503, 'offline', 'Não foi possível atualizar'],
  ])('perfil salvo antes de falha %s na senha permanece visível', async (status, message, expected) => {
    await mount();
    vi.mocked(fetch).mockResolvedValueOnce(profile()).mockResolvedValueOnce(json({ message }, status));
    submit(true);
    await screen.findByText(new RegExp(`Perfil atualizado. Senha não atualizada: ${expected}`));
    expect(screen.getByDisplayValue('Ana Atualizada')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it.each([200, 401, 503])('senha401 revalida sessão uma vez com perfil%s', async (status) => {
    await mount();
    vi.mocked(fetch).mockResolvedValueOnce(profile()).mockResolvedValueOnce(json({ message: 'senha errada' }, 401))
      .mockResolvedValueOnce(json(status === 200 ? { data: state.user } : { message: 'falha' }, status));
    submit(true);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    const text = status === 200 ? /Sua sessão continua válida/ : status === 401 ? /Sessão expirada/ : /Não foi possível verificar a sessão/;
    await screen.findByText(text);
    expect(localStorage.getItem('access_token')).toBe(status === 401 ? null : 'token-sintetico');
  });
});
