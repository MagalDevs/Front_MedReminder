import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/app/contexts/AuthContext';
import MedicationEditScreen from '@/app/features/web-ux/screens/MedicationEditScreen';
vi.mock('next/navigation', () => ({ usePathname: () => '/meus-medicamentos/17/editar', useRouter: () => ({ push: vi.fn() }) }));
const medication = { id: 17, nome: 'Vitamina', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-01-01', cor: 'Azul', motivo: 'Rotina', observacao: '', quantidadeDose: '1,5 mg', unidadeMedida: 'comprimidos', quantidadeDiaria: 6, quantidadeDias: 10 };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  localStorage.setItem('access_token', 'token-A');
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const path = String(input);
    if (path.endsWith('usuario/me')) return json({ data: { id: 7, nome: 'Ana' } });
    if (path.includes('/dose/me')) return json({ data: [{ id: 1, data_dose: '2026-11-14T08:00:00-03:00', tomado: false, remedio: medication }] });
    return json({ data: options?.method === 'PUT' ? { ...medication, ...JSON.parse(String(options.body)) } : medication });
  });
});
function mount() { render(<AuthProvider><MedicationEditScreen medicationId={17} /></AuthProvider>); }
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
it('T28 edits the selected ID with only changed allowed metadata and leaves schedule read-only', async () => {
  mount(); await screen.findByDisplayValue('Vitamina');
  expect(screen.getByText('Esta edição não altera os horários das doses')).toBeVisible();
  expect(screen.getByText('1,5 mg')).toBeVisible(); expect(screen.getByText('comprimidos')).toBeVisible();
  expect(screen.queryByLabelText('Intervalo')).not.toBeInTheDocument(); expect(screen.queryByText('6 vezes ao dia')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver horários' })).toHaveAttribute('href', '/meus-lembretes?medicamentoId=17');
  const changed = { nome: 'Novo nome', classificacao: 'Outra', quantidadeCaixa: 25, dataValidade: '2028-02-29', cor: 'Verde claro', motivo: 'Novo motivo', observacao: 'Com água' };
  change('Nome', changed.nome); change('Classificação', changed.classificacao); change('Quantidade em estoque', '25'); change('Validade', changed.dataValidade); change('Motivo', changed.motivo); change('Observação', changed.observacao); fireEvent.click(screen.getByLabelText(/Verde claro/));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Medicamento atualizado. Os horários das doses foram preservados.');
  const writes = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT'); expect(writes).toHaveLength(1); expect(String(writes[0][0])).toMatch(/remedio\/17$/); expect(JSON.parse(String(writes[0][1]?.body))).toEqual(changed);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Nenhuma alteração para salvar.'); expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
});
it('T28 invalid stock blocks sending and failed save preserves edits for manual retry', async () => {
  mount(); await screen.findByDisplayValue('Vitamina'); change('Quantidade em estoque', '0'); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Informe um estoque inteiro maior que zero.'); expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  change('Quantidade em estoque', '11'); vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Indisponível' }, 503)); fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeVisible()); expect(screen.getByLabelText('Quantidade em estoque')).toHaveValue(11); expect(screen.queryByText(/Medicamento atualizado/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Medicamento atualizado. Os horários das doses foram preservados.');
});
it('T28 wrong medication response never opens an editor and failed load is recoverable', async () => {
  vi.mocked(fetch).mockImplementation(async input => String(input).endsWith('usuario/me') ? json({ data: { id: 7, nome: 'Ana' } }) : String(input).includes('/dose/me') ? json({ data: [] }) : json({ data: { ...medication, id: 99 } }));
  mount(); await screen.findByRole('button', { name: 'Tentar novamente' }); expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: medication })); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByDisplayValue('Vitamina');
});
