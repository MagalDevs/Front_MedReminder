import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import TreatmentStep from '@/app/features/web-ux/components/TreatmentStep';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { buildTreatmentPayload, validateDraft } from '@/app/features/web-ux/domain/treatment';
function Harness() {
  const { draft, updateDraft } = useTreatmentDraft(); const [errors, setErrors] = useState<Record<string, string>>({}); const [payload, setPayload] = useState('');
  return <><TreatmentStep errors={errors} /><button onClick={() => updateDraft({ medicationName: 'Vitamina', stock: '10', expiry: '2027-01-31', photo: 'https://example.test/photo.png' })}>Preparar medicamento</button>
    <button onClick={() => { const result = validateDraft(draft); setErrors(result.errors); if (result.valid) setPayload(JSON.stringify(buildTreatmentPayload(draft))); }}>Conferir</button>
    <output data-testid="payload">{payload}</output></>;
}
function mount() { render(<TreatmentDraftProvider identity="A"><Harness /></TreatmentDraftProvider>); fireEvent.click(screen.getByText('Preparar medicamento')); }
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function schedule() { fill('Unidade por dose', 'mg'); fill('Primeira dose', '2026-11-13T08:00'); fill('Intervalo em horas', '6'); fill('Duração', '1'); }
it('WUX_FORM_06', () => {
  mount(); schedule();
  for (const amount of ['1,5', '1.5']) {
    fill('Quantidade por dose', amount); fireEvent.click(screen.getByText('Conferir'));
    expect(screen.getByLabelText('Quantidade por dose')).toHaveValue(amount);
    expect(screen.getByText('Quantidade informada: 1,5 mg')).toBeVisible();
    expect(JSON.parse(screen.getByTestId('payload').textContent!)).toMatchObject({ remedio: { quantidadeDose: '1.5 mg', quantidadeDiaria: 4, quantidadeDias: 1 }, doses: ['2026-11-13T11:00:00.000Z', '2026-11-13T17:00:00.000Z', '2026-11-13T23:00:00.000Z', '2026-11-14T05:00:00.000Z'] });
  }
});
it('WUX_FORM_12', () => {
  mount(); schedule(); fill('Quantidade por dose', '2'); fill('Duração', '2');
  fill('Unidade da duração', 'weeks'); expect(screen.getByText('Uma semana equivale a 7 dias.')).toBeVisible(); expect(screen.getByText('Duração total: 14 dias.')).toBeVisible();
  fireEvent.click(screen.getByText('Conferir')); expect(JSON.parse(screen.getByTestId('payload').textContent!).remedio.quantidadeDias).toBe(14);
  fill('Unidade da duração', 'months'); expect(screen.getByText('Um mês equivale a 30 dias.')).toBeVisible(); expect(screen.getByText('Duração total: 60 dias.')).toBeVisible();
  fireEvent.click(screen.getByText('Conferir')); expect(JSON.parse(screen.getByTestId('payload').textContent!).remedio.quantidadeDias).toBe(60);
});
it('T22 invalid dose and recurrence show the model errors without normalizing input', () => {
  mount(); schedule(); fill('Quantidade por dose', '1,2.3'); fill('Intervalo em horas', '0'); fireEvent.click(screen.getByText('Conferir'));
  expect(screen.getByLabelText('Quantidade por dose')).toHaveValue('1,2.3'); expect(screen.getByLabelText('Quantidade por dose')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Informe uma quantidade maior que zero, usando vírgula ou ponto para decimais')).toBeVisible();
  expect(screen.getByLabelText('Intervalo em horas')).toHaveAttribute('aria-invalid', 'true'); expect(screen.getByTestId('payload')).toBeEmptyDOMElement();
});
