import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import ProfileScreen from '@/app/features/web-ux/screens/ProfileScreen';
const { push } = vi.hoisted(() => ({ push: vi.fn() })); vi.mock('next/navigation', () => ({ usePathname: () => '/Configuracoes', useRouter: () => ({ push }) }));
const user = { id: 7, nome: 'Ana Silva', email: 'ana@example.test', cep: '12345678', dataNasc: '1990-01-01', cpf: '12345678901', cuidador: true };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => { push.mockReset(); localStorage.setItem('access_token', 'token-A'); vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} })); vi.mocked(fetch).mockImplementation(async () => json({ data: user })); });
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function Draft() { const { draft, updateDraft } = useTreatmentDraft(); return <><button onClick={() => updateDraft({ medicationName: 'Rascunho A' })}>Preencher rascunho</button><output aria-label="Rascunho">{draft.medicationName}</output></>; }
function Harness() {
  const auth = useAuth(); return <><output aria-label="Identidade">{auth.identityKey}</output><button onClick={() => auth.login('token-B', { id: 8, nome: 'B', email: 'b@example.test' })}>Conta B</button><button onClick={() => auth.login('token-A', user)}>Conta A</button><button onClick={() => auth.updateProfile({ id: 8, nome: 'Outro', email: 'other@example.test' }, auth.identityKey)}>Resposta errada</button><TreatmentDraftProvider identity={auth.identityKey}><Draft /><ProfileScreen /></TreatmentDraftProvider></>;
}
async function mount() { render(<AuthProvider><Harness /></AuthProvider>); await screen.findByDisplayValue('Ana Silva'); }
function password() { change('Senha atual', 'Old12345!'); change('Nova senha', 'New12345!'); change('Confirmar nova senha', 'New12345!'); }
it('WUX_ACCOUNT_06', async () => {
  await mount(); fireEvent.click(screen.getByText('Preencher rascunho')); password(); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Senha atualizada.');
  const writes = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PATCH'); expect(writes).toHaveLength(1); expect(String(writes[0][0])).toMatch(/usuario\/senha$/); expect(JSON.parse(String(writes[0][1]?.body))).toEqual({ senhaAtual: 'Old12345!', novaSenha: 'New12345!' });
  expect(screen.getByLabelText('Senha atual')).toHaveValue(''); expect(screen.getByLabelText('Nova senha')).toHaveValue(''); expect(screen.getByLabelText('Rascunho')).toHaveTextContent('Rascunho A'); expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toMatch(/Old12345|New12345/);
});
it('WUX_ACCOUNT_07', async () => {
  await mount(); change('Nome', 'Ana Atualizada'); password();
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: { ...user, nome: 'Ana Atualizada' } })).mockResolvedValueOnce(json({ message: 'Senha incorreta' }, 401)).mockResolvedValueOnce(json({ data: user }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Senha não atualizada: Senha atual incorreta. Sua sessão continua válida.');
  expect(screen.getByText('Perfil atualizado.')).toBeVisible(); expect(screen.queryByText('Senha atualizada.')).not.toBeInTheDocument(); expect(localStorage.getItem('access_token')).toBe('token-A'); expect(push).not.toHaveBeenCalled();
  expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method)).toEqual(['GET', 'PATCH', 'PATCH', 'GET']);
  vi.mocked(fetch).mockResolvedValueOnce(json({})); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Senha atualizada.'); expect(vi.mocked(fetch).mock.calls.filter(([input, init]) => String(input).endsWith('usuario/me') && init?.method === 'PATCH')).toHaveLength(1);
});
it('WUX_SYSTEM_09', async () => {
  await mount(); const headings = screen.getAllByRole('heading').map(node => node.textContent); expect(headings).toEqual(['Perfil', 'Dados pessoais', 'Segurança']); expect(screen.getByLabelText('Iniciais do nome')).toHaveTextContent('AS'); expect(screen.queryByRole('button', { name: /foto|recuperar/i })).not.toBeInTheDocument(); expect(document.querySelector('input[type=file]')).toBeNull(); expect(vi.mocked(fetch).mock.calls.map(([input]) => String(input))).toHaveLength(1);
});
it('T31 profile metadata update preserves draft, generation, token and immutable data, rejects another ID', async () => {
  await mount(); const identity = screen.getByLabelText('Identidade').textContent; fireEvent.click(screen.getByText('Preencher rascunho')); change('Nome', 'Ana Nova'); change('CEP', '');
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: { ...user, nome: 'Ana Nova', cpf: 'malicious', cuidador: false, senha: 'server-secret' } }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Perfil atualizado.');
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual({ nome: 'Ana Nova' }); expect(screen.getByLabelText('Identidade')).toHaveTextContent(identity!); expect(screen.getByLabelText('Rascunho')).toHaveTextContent('Rascunho A'); expect(localStorage.getItem('access_token')).toBe('token-A');
  expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual({ ...user, nome: 'Ana Nova' }); fireEvent.click(screen.getByText('Resposta errada')); expect(screen.getByLabelText('Nome')).toHaveValue('Ana Nova'); expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual({ ...user, nome: 'Ana Nova' });
});
it('T31 failed profile never attempts password and validation focuses the first invalid input', async () => {
  await mount(); change('Nome', ''); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveFocus()); expect(fetch).toHaveBeenCalledTimes(1);
  change('Nome', 'Novo'); password(); vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Falha' }, 503)); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByRole('alert'); expect(screen.queryByText('Perfil atualizado.')).not.toBeInTheDocument(); expect(screen.getByLabelText('Nome')).toHaveValue('Novo'); expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).endsWith('/senha'))).toHaveLength(0);
});
it('T31 password 401 with unavailable revalidation keeps session without claiming password success', async () => {
  await mount(); password(); vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Senha incorreta' }, 401)).mockRejectedValueOnce(new TypeError('offline')); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText(/Senha não atualizada: Não foi possível verificar a sessão/); expect(localStorage.getItem('access_token')).toBe('token-A'); expect(fetch).toHaveBeenCalledTimes(3); expect(screen.queryByText('Senha atualizada.')).not.toBeInTheDocument();
});
it('T31 confirmed expiration clears the private form after one revalidation', async () => {
  await mount(); password(); vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Incorreta' }, 401)).mockResolvedValueOnce(json({ message: 'Expirada' }, 401)); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await waitFor(() => expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()); expect(localStorage.getItem('access_token')).toBeNull(); expect(push).toHaveBeenCalledWith('/login'); expect(fetch).toHaveBeenCalledTimes(3);
});
it('T31 A to B to A discards an old profile response even when the token and user ID recur', async () => {
  await mount(); let resolve!: (value: Response) => void; vi.mocked(fetch).mockReturnValueOnce(new Promise(done => { resolve = done; })); change('Nome', 'Resposta antiga'); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); const signal = vi.mocked(fetch).mock.calls[1][1]!.signal!;
  fireEvent.click(screen.getByText('Conta B')); expect(screen.getByLabelText('Nome')).toHaveValue('B'); fireEvent.click(screen.getByText('Conta A')); expect(screen.getByLabelText('Nome')).toHaveValue('Ana Silva'); await act(async () => resolve(json({ data: { ...user, nome: 'Resposta antiga' } })));
  expect(signal.aborted).toBe(true); expect(screen.getByLabelText('Nome')).toHaveValue('Ana Silva'); expect(screen.queryByText('Perfil atualizado.')).not.toBeInTheDocument(); expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(user);
});
