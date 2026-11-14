import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import TreatmentWizard from '@/app/features/web-ux/components/TreatmentWizard';
import { TreatmentDraftProvider } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
vi.mock('next/navigation', () => ({ usePathname: () => '/novo-medicamento' }));
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A');
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.mocked(fetch).mockImplementation(async input => {
    if (String(input).includes('.csv')) return new Response('NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n');
    throw new TypeError('offline');
  });
});
const refresh = async () => true;
function mount(read = refresh) { return render(<TreatmentDraftProvider identity="A"><TreatmentWizard refresh={read} /></TreatmentDraftProvider>); }
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function medication() { fill('Nome do medicamento', 'Vitamina'); fill('Quantidade em estoque', '10'); fill('Validade', '2027-12-31'); fill('URL da foto', 'https://example.test/photo.png'); }
function treatment() { fill('Quantidade por dose', '1,5'); fill('Unidade por dose', 'mg'); fill('Primeira dose', '2026-11-13T08:00'); fill('Intervalo em horas', '6'); fill('Duração', '1'); }
function review() { medication(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); treatment(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); }
function savedResponse() { const call = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST')!; const payload = JSON.parse(String(call[1]!.body)); return new Response(JSON.stringify({ data: { remedio: { id: 71, nome: payload.remedio.nome }, doses: payload.doses.map((date: string, index: number) => ({ id: index + 1, remedioId: 71, data_dose: date, tomado: false })) } }), { status: 201, headers: { 'content-type': 'application/json' } }); }
it('WUX_FORM_04', () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  const name = screen.getByLabelText('Nome do medicamento'); expect(name).toHaveFocus(); expect(name).toHaveAttribute('aria-invalid', 'true'); expect(document.getElementById(name.getAttribute('aria-describedby')!)).toHaveTextContent('(obrigatório)');
  expect(screen.queryByLabelText('Quantidade por dose')).not.toBeInTheDocument();
  medication(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); treatment(); fill('Intervalo em horas', '0'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByLabelText('Intervalo em horas')).toHaveFocus(); expect(screen.getByLabelText('Intervalo em horas')).toHaveAttribute('aria-invalid', 'true'); expect(screen.queryByRole('button', { name: 'Salvar tratamento' })).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
});
it('WUX_FORM_05', () => {
  mount(); medication(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); treatment(); fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen.getByLabelText('Nome do medicamento')).toHaveValue('Vitamina'); expect(screen.getByLabelText('Quantidade em estoque')).toHaveValue('10'); expect(screen.getByLabelText('Validade')).toHaveValue('2027-12-31');
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); expect(screen.getByLabelText('Quantidade por dose')).toHaveValue('1,5'); expect(screen.getByLabelText('Primeira dose')).toHaveValue('2026-11-13T08:00'); expect(screen.getByLabelText('Intervalo em horas')).toHaveValue('6'); expect(screen.getByLabelText('Duração')).toHaveValue('1');
});
it('WUX_STATE_05', () => {
  mount(); expect(screen.getByText('O rascunho é mantido nesta aba enquanto você navega. Recarregar ou fechar a aba descarta o preenchimento.')).toBeVisible();
  expect(screen.getByRole('list', { name: 'Etapas do cadastro' }).querySelector('[aria-current="step"]')).toHaveTextContent('Medicamento');
  expect(screen.getByRole('list', { name: 'Etapas do cadastro' })).toHaveTextContent('MedicamentoTratamentoRevisão');
});
it('T24 review gesture submits the real exact payload once and keeps a persistent confirmed summary', async () => {
  mount(); review(); expect(screen.getByText('America/Sao_Paulo')).toBeVisible();
  vi.mocked(fetch).mockImplementation(async () => savedResponse());
  fireEvent.click(screen.getByRole('button', { name: 'Salvar tratamento' })); fireEvent.click(screen.getByRole('button', { name: /Salvando/ }));
  await screen.findByText('Tratamento salvo.'); expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.getByText('Primeira dose criada')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Ver horários' })).toHaveAttribute('href', '/meus-lembretes?medicamentoId=71');
  const posts = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST'); expect(posts).toHaveLength(1);
  expect(JSON.parse(String(posts[0][1]!.body))).toEqual({ remedio: { nome: 'Vitamina', classificacao: 'Não classificado', quantidadeCaixa: 10, dataValidade: '2027-12-31', quantidadeDiaria: 4, quantidadeDias: 1, horaInicio: '2026-11-13T11:00:00.000Z', quantidadeDose: '1.5 mg', unidadeMedida: '', cor: '', motivo: 'Não especificado', observacao: '', foto: 'https://example.test/photo.png' }, doses: ['2026-11-13T11:00:00.000Z', '2026-11-13T17:00:00.000Z', '2026-11-13T23:00:00.000Z', '2026-11-14T05:00:00.000Z'] });
  expect(new Headers(posts[0][1]!.headers).get('Idempotency-Key')).toBeTruthy();
});
it('T24 uncertain result freezes content and retries the same intention after leaving and returning', async () => {
  const view = mount(); review(); fireEvent.click(screen.getByRole('button', { name: 'Salvar tratamento' })); await screen.findByText(/Não foi possível confirmar o resultado/);
  const first = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST')![1]!;
  view.rerender(<TreatmentDraftProvider identity="A"><p>Outra rota</p></TreatmentDraftProvider>);
  view.rerender(<TreatmentDraftProvider identity="A"><TreatmentWizard refresh={refresh} /></TreatmentDraftProvider>);
  expect(screen.getByText(/Não foi possível confirmar o resultado/)).toBeVisible(); expect(screen.queryByRole('button', { name: 'Editar medicamento' })).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Consultar registros' })).toHaveAttribute('href', '/meus-medicamentos');
  vi.mocked(fetch).mockImplementation(async () => savedResponse()); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Tratamento salvo.');
  const posts = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST'); expect(posts).toHaveLength(2); expect(posts[1][1]!.body).toBe(first.body); expect(new Headers(posts[1][1]!.headers).get('Idempotency-Key')).toBe(new Headers(first.headers).get('Idempotency-Key'));
});
it('T24 confirmed refresh failure retries only reading and never creates again', async () => {
  const read = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true); mount(read); review(); vi.mocked(fetch).mockImplementation(async () => savedResponse()); fireEvent.click(screen.getByRole('button', { name: 'Salvar tratamento' }));
  await screen.findByText('Tratamento salvo. Não foi possível atualizar a lista.'); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Tratamento salvo.'); expect(read).toHaveBeenCalledTimes(2); expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
});
