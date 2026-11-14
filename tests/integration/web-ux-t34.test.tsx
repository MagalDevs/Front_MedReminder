import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactElement, type ReactNode, useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import RootLayout from '@/app/layout';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { useDoseCollection } from '@/app/features/web-ux/hooks/useDoseCollection';
vi.mock('next/font/google', () => ({ Geist: () => ({ variable: 'font-sans' }), Geist_Mono: () => ({ variable: 'font-mono' }) }));
vi.mock('@/app/globals.css', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const user = { id: 7, nome: 'Ana' }; const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const dose = (name: string) => ({ id: 1, data_dose: '2026-11-14T08:00:00-03:00', tomado: false, remedio: { id: 17, nome: name, quantidadeDose: '1 mg', cor: 'Azul' } });
beforeEach(() => { localStorage.setItem('access_token', 'token-A'); vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('/usuario/me') ? json({ data: user }) : json({ data: [] })); });
/** Render the actual root's provider subtree, excluding document-only html/body tags. */
function providers(children: ReactNode) { const root = RootLayout({ children }); const body = root.props.children as ReactElement<{ children: ReactNode }>; return body.props.children; }
function Editor() { const { draft, updateDraft } = useTreatmentDraft(); return <label>Nome do medicamento<input value={draft.medicationName} onChange={event => updateDraft({ medicationName: event.target.value })} /></label>; }
function SessionActions() {
  const auth = useAuth(); const draft = useTreatmentDraft();
  return <><output aria-label="Identidade">{auth.identityKey}</output><output aria-label="Resumo">{draft.summary?.medicationName ?? ''}</output><button onClick={() => auth.login('token-B', { id: 8, nome: 'B' })}>Conta B</button><button onClick={() => auth.login('token-A', user)}>Conta A</button><button onClick={auth.logout}>Sair da sessão</button><button onClick={() => void auth.revalidateSession()}>Verificar sessão</button><button onClick={() => draft.setSummary({ medicationId: 17, medicationName: 'Resumo A', firstDoseAt: '2026-11-14T08:00:00-03:00' })}>Guardar resumo</button><button onClick={() => auth.updateProfile({ id: 7, nome: 'Ana Nova' }, auth.identityKey)}>Atualizar nome</button></>;
}
function Navigation() { const [route, setRoute] = useState('novo'); return <><SessionActions /><button onClick={() => setRoute('lista')}>Ver medicamentos</button><button onClick={() => setRoute('novo')}>Adicionar medicamento</button>{route === 'novo' ? <Editor /> : <h1>Medicamentos</h1>}</>; }
async function ready() { await waitFor(() => expect(screen.getByLabelText('Identidade')).toHaveTextContent('7:0')); }
it('WUX_STATE_03', async () => {
  render(providers(<Navigation />)); await ready(); fireEvent.change(screen.getByLabelText('Nome do medicamento'), { target: { value: 'Rascunho mantido' } }); fireEvent.click(screen.getByText('Guardar resumo'));
  fireEvent.click(screen.getByText('Ver medicamentos')); expect(screen.getByRole('heading', { name: 'Medicamentos' })).toBeVisible(); fireEvent.click(screen.getByText('Adicionar medicamento')); expect(screen.getByLabelText('Nome do medicamento')).toHaveValue('Rascunho mantido'); expect(screen.getByLabelText('Resumo')).toHaveTextContent('Resumo A');
  const credentials = { ...localStorage }; expect(JSON.stringify(credentials)).not.toMatch(/Rascunho mantido|Resumo A/); expect(Object.keys(sessionStorage)).toEqual([]);
  fireEvent.click(screen.getByText('Atualizar nome')); expect(screen.getByLabelText('Identidade')).toHaveTextContent('7:0'); expect(screen.getByLabelText('Nome do medicamento')).toHaveValue('Rascunho mantido'); expect(localStorage.getItem('access_token')).toBe('token-A'); expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes('/dose/me'))).toHaveLength(1);
});
it.each(['logout', 'identity', 'expiration'])('WUX_STATE_04 %s', async kind => {
  render(providers(<Navigation />)); await ready(); fireEvent.change(screen.getByLabelText('Nome do medicamento'), { target: { value: 'Rascunho privado A' } }); fireEvent.click(screen.getByText('Guardar resumo'));
  if (kind === 'identity') fireEvent.click(screen.getByText('Conta B'));
  else if (kind === 'logout') fireEvent.click(screen.getByText('Sair da sessão'));
  else { vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Expirada' }, 401)); fireEvent.click(screen.getByText('Verificar sessão')); await waitFor(() => expect(screen.getByLabelText('Identidade')).toHaveTextContent('')); }
  expect(screen.getByLabelText('Nome do medicamento')).toHaveValue(''); expect(screen.getByLabelText('Resumo')).toBeEmptyDOMElement();
  fireEvent.click(screen.getByText('Conta A')); await waitFor(() => expect(screen.getByLabelText('Identidade').textContent).toMatch(/^7:[1-9]/)); expect(screen.getByLabelText('Nome do medicamento')).toHaveValue(''); expect(screen.getByLabelText('Resumo')).toBeEmptyDOMElement();
});
function Collection() { const auth = useAuth(); const { collection, refresh } = useDoseCollection(); return <><SessionActions /><button onClick={() => void refresh()}>Atualizar coleção</button><output aria-label="Doses">{auth.sessionStatus === 'authenticated' ? collection.items.map(dose => dose.kind === 'complete' ? dose.medicationName : dose.reason).join(',') : ''}</output></>; }
it('WUX_STATE_06 newer read', async () => {
  let old!: (value: Response) => void; let current!: (value: Response) => void; let reads = 0;
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('/usuario/me') ? json({ data: user }) : !String(input).includes('?') ? json({ data: [] }) : new Promise(done => { if (++reads === 1) old = done; else current = done; }));
  render(providers(<Collection />)); await ready(); await waitFor(() => expect(reads).toBe(1)); const signal = vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes('?'))![1]!.signal!;
  fireEvent.click(screen.getByText('Atualizar coleção')); await act(async () => current(json({ data: [dose('Atual')] }))); expect(screen.getByLabelText('Doses')).toHaveTextContent('Atual'); await act(async () => old(json({ data: [dose('Antigo')] }))); expect(signal.aborted).toBe(true); expect(screen.getByLabelText('Doses')).toHaveTextContent('Atual'); expect(screen.queryByText('Antigo')).not.toBeInTheDocument();
});
it('WUX_STATE_06 identity replacement', async () => {
  let old!: (value: Response) => void; let queried = false;
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('/usuario/me') ? json({ data: user }) : !String(input).includes('?') ? json({ data: [] }) : !queried ? (queried = true, new Promise(done => { old = done; })) : json({ data: [dose('Conta B')] }));
  render(providers(<Collection />)); await ready(); await waitFor(() => expect(queried).toBe(true)); const signal = vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes('?'))![1]!.signal!; fireEvent.click(screen.getByText('Conta B')); await waitFor(() => expect(screen.getByLabelText('Doses')).toHaveTextContent('Conta B'));
  await act(async () => old(json({ data: [dose('Privado A')] }))); expect(signal.aborted).toBe(true); expect(screen.getByLabelText('Doses')).toHaveTextContent('Conta B'); expect(screen.queryByText('Privado A')).not.toBeInTheDocument();
});
