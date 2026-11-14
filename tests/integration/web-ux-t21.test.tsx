import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import MedicationStep from '@/app/features/web-ux/components/MedicationStep';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { validateDraft } from '@/app/features/web-ux/domain/treatment';

function Harness() {
  const { draft, updateDraft } = useTreatmentDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  return <><MedicationStep errors={errors} /><button onClick={() => updateDraft({ amount: '1,5', unit: 'mg', firstDoseAt: '2026-11-13T08:00', intervalHours: '6', duration: '2', durationUnit: 'weeks' })}>Preparar tratamento</button>
    <button onClick={() => setErrors(validateDraft(draft).errors)}>Validar</button><output data-testid="draft">{JSON.stringify(draft)}</output></>;
}
function mount() { return render(<TreatmentDraftProvider identity="A"><Harness /></TreatmentDraftProvider>); }
it('WUX_FORM_03', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento\n'));
  mount(); fireEvent.click(screen.getByText('Preparar tratamento'));
  await waitFor(() => expect(screen.queryByText('Carregando catálogo...')).not.toBeInTheDocument());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Vitamina' } });
  fireEvent.click(screen.getByRole('option', { name: 'Vitamina A Suplemento' }));
  await waitFor(() => expect(screen.getByLabelText('Nome do medicamento')).toHaveValue('Vitamina A'));
  expect(screen.getByLabelText('Classificação')).toHaveValue('Suplemento');
  expect(JSON.parse(screen.getByTestId('draft').textContent!)).toMatchObject({ amount: '1,5', unit: 'mg', firstDoseAt: '2026-11-13T08:00', intervalHours: '6', duration: '2', durationUnit: 'weeks' });
  fireEvent.change(screen.getByLabelText('Classificação'), { target: { value: 'Editada' } });
  expect(screen.getByLabelText('Classificação')).toHaveValue('Editada');
});
it('T21 manual fields preserve stock, calendar expiry, photo URL and named color with associated validation', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('offline')); mount();
  await screen.findByText('Cadastrar manualmente'); fireEvent.click(screen.getByText('Cadastrar manualmente'));
  fireEvent.click(screen.getByText('Validar'));
  expect(screen.getByLabelText('Nome do medicamento')).toHaveAttribute('aria-invalid', 'true');
  const expiry = screen.getByLabelText('Validade');
  expect(document.getElementById(expiry.getAttribute('aria-describedby')!.split(' ').at(-1)!)).toHaveTextContent('Data de validade inválida');
  for (const [label, value] of [['Nome do medicamento', 'Manual'], ['Quantidade em estoque', '12'], ['Validade', '2027-01-31'], ['URL da foto', 'https://example.test/medicamento.png'], ['Unidade do estoque', 'comprimidos'], ['Motivo', 'Rotina'], ['Observação', 'Texto']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('radio', { name: 'Azul' })); fireEvent.click(screen.getByText('Validar'));
  expect(screen.getByLabelText('Nome do medicamento')).not.toHaveAttribute('aria-invalid');
  expect(expiry).not.toHaveAttribute('aria-invalid');
  expect(JSON.parse(screen.getByTestId('draft').textContent!)).toMatchObject({ medicationName: 'Manual', stock: '12', expiry: '2027-01-31', photo: 'https://example.test/medicamento.png', boxUnit: 'comprimidos', color: 'Azul', reason: 'Rotina', notes: 'Texto' });
});
