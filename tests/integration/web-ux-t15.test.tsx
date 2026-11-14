import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { useTreatmentSubmission } from '@/app/features/web-ux/hooks/useTreatmentSubmission';
const draft = { medicationName: 'Vitamina', classification: 'Suplemento', stock: '10', expiry: '2027-12-31', amount: '1,5', unit: 'mg', boxUnit: 'comp', color: '#008000', reason: 'Rotina', notes: 'Com água', photo: 'https://example.test/photo.jpg', firstDoseAt: '2026-11-14T12:00:00Z', intervalHours: '24', duration: '1', durationUnit: 'days' as const };
const payload = { remedio: { nome: 'Vitamina', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-12-31', quantidadeDiaria: 1, quantidadeDias: 1, horaInicio: '2026-11-14T12:00:00.000Z', quantidadeDose: '1.5 mg', unidadeMedida: 'comp', cor: '#008000', motivo: 'Rotina', observacao: 'Com água', foto: 'https://example.test/photo.jpg' }, doses: ['2026-11-14T12:00:00.000Z'] };
const saved = { data: { remedio: { ...payload.remedio, id: 77 }, doses: [{ id: 91, remedioId: 77, data_dose: '2026-11-14T12:00:00.000Z', tomado: false }] } };
const json = (value: unknown, status = 201) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
function Probe({ refresh }: { refresh: () => Promise<unknown> }) {
  const context = useTreatmentDraft(); const op = useTreatmentSubmission({ refresh });
  return <><output>{JSON.stringify({ draft: context.draft, summary: context.summary, intent: op.intent, locked: op.locked })}</output><p>{op.message}</p>
    <button onClick={() => context.updateDraft(draft)}>preencher</button><button onClick={() => context.updateDraft({ medicationName: 'Alterado' })}>alterar</button>
    <button onClick={() => void op.submit()}>Salvar tratamento</button><button onClick={() => void op.retry()}>Tentar mesma intenção</button><button onClick={() => void op.refresh()}>Atualizar lista</button><a href={op.consultHref}>Consultar registros</a></>;
}
const state = () => JSON.parse(screen.getByRole('status').textContent!);
function mount(refresh = vi.fn(async () => true), identity = 'A') {
  const view = render(<TreatmentDraftProvider identity={identity}><Probe refresh={refresh} /></TreatmentDraftProvider>);
  fireEvent.click(screen.getByText('preencher')); return { ...view, refresh };
}
beforeEach(() => { localStorage.setItem('access_token', 'token-A'); });
it('WUX_FORM_16', async () => {
  vi.mocked(fetch).mockResolvedValue(json(saved)); const refresh = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true); mount(refresh);
  fireEvent.click(screen.getByText('Salvar tratamento'));
  await screen.findByText('Tratamento salvo. Não foi possível atualizar a lista.');
  expect(state()).toMatchObject({ draft: { medicationName: '' }, summary: { medicationId: 77, medicationName: 'Vitamina', firstDoseAt: '2026-11-14T12:00:00.000Z' }, intent: { phase: 'confirmed', refreshFailed: true } });
  fireEvent.click(screen.getByText('Atualizar lista'));
  await screen.findByText('Tratamento salvo.');
  fireEvent.click(screen.getByText('Salvar tratamento'));
  expect(refresh).toHaveBeenCalledTimes(2); expect(fetch).toHaveBeenCalledTimes(1);
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/tratamento$/);
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual(payload);
});
it('WUX_STATE_07', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(json(saved)); mount();
  fireEvent.click(screen.getByText('Salvar tratamento'));
  await screen.findByText(/Não foi possível confirmar o resultado/);
  const first = vi.mocked(fetch).mock.calls[0][1]!;
  expect(state()).toMatchObject({ draft, intent: { phase: 'uncertain', identity: 'A', body: JSON.stringify(payload) } });
  expect(state().intent.key).toBeTruthy(); expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Tentar mesma intenção')); await screen.findByText('Tratamento salvo.');
  const second = vi.mocked(fetch).mock.calls[1][1]!;
  expect(second.body).toBe(first.body); expect(new Headers(second.headers).get('Idempotency-Key')).toBe(new Headers(first.headers).get('Idempotency-Key'));
});
it('WUX_STATE_11', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('offline')); mount(); fireEvent.click(screen.getByText('Salvar tratamento'));
  await screen.findByText(/Não foi possível confirmar o resultado/); const frozen = state().intent;
  fireEvent.click(screen.getByText('alterar'));
  expect(state()).toMatchObject({ locked: true, draft, intent: frozen });
  expect(screen.getByRole('link', { name: 'Consultar registros' })).toHaveAttribute('href', '/meus-medicamentos');
  expect(fetch).toHaveBeenCalledTimes(1);
});
it.each([{ data: { ...saved.data, doses: [] } }, { data: { ...saved.data, doses: [{ ...saved.data.doses[0], data_dose: '2026-11-15T12:00:00Z' }] } }, { data: { ...saved.data, doses: [{ ...saved.data.doses[0], remedioId: 88 }] } }])('não confirma resposta incompleta ou divergente %j', async response => {
  vi.mocked(fetch).mockResolvedValue(json(response)); const { refresh } = mount();
  fireEvent.click(screen.getByText('Salvar tratamento')); await screen.findByText(/Não foi possível confirmar o resultado/);
  expect(state()).toMatchObject({ summary: null, draft, intent: { phase: 'uncertain' } }); expect(refresh).not.toHaveBeenCalled();
});
it('descarta resposta antiga e bloqueia concorrência', async () => {
  let resolve!: (value: Response) => void; vi.mocked(fetch).mockImplementation(() => new Promise(done => { resolve = done; })); const { rerender, refresh } = mount();
  fireEvent.click(screen.getByText('Salvar tratamento')); fireEvent.click(screen.getByText('Salvar tratamento'));
  expect(fetch).toHaveBeenCalledTimes(1);
  localStorage.setItem('access_token', 'token-B'); rerender(<TreatmentDraftProvider identity="B"><Probe refresh={refresh} /></TreatmentDraftProvider>);
  await act(async () => resolve(json(saved)));
  expect(state()).toMatchObject({ draft: { medicationName: '' }, summary: null, intent: { phase: 'editing' } }); expect(refresh).not.toHaveBeenCalled();
});
it('conserva a intenção ao sair da rota durante o envio', async () => {
  vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); const { rerender, refresh } = mount();
  fireEvent.click(screen.getByText('Salvar tratamento')); const frozen = state().intent;
  rerender(<TreatmentDraftProvider identity="A"><p>Outra rota</p></TreatmentDraftProvider>);
  rerender(<TreatmentDraftProvider identity="A"><Probe refresh={refresh} /></TreatmentDraftProvider>);
  expect(state().intent).toEqual({ ...frozen, phase: 'uncertain' }); expect(state().draft).toEqual(draft);
});
it('impede retry antes de Retry-After sem reenvio automático', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: 'Aguarde' }), { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': '60' } })); mount();
  fireEvent.click(screen.getByText('Salvar tratamento')); await screen.findByText(/Não foi possível confirmar o resultado/);
  expect(state().intent.retryNotBefore).toBeGreaterThan(Date.now());
  fireEvent.click(screen.getByText('Tentar mesma intenção')); expect(fetch).toHaveBeenCalledTimes(1);
});
