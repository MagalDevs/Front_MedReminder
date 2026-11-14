import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import TreatmentReview from '@/app/features/web-ux/components/TreatmentReview';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import type { TreatmentDraft } from '@/app/features/web-ux/domain/treatment';
const draft = { medicationName: 'Vitamina A', classification: 'Suplemento', amount: '1,5', unit: 'mg', stock: '30', boxUnit: 'comprimidos', expiry: '2027-01-31', photo: 'https://example.test/photo.png', color: 'Azul', reason: 'Rotina', notes: 'Anotação', firstDoseAt: '2026-11-13T08:00', intervalHours: '6', duration: '1', durationUnit: 'days' } satisfies TreatmentDraft;
function Harness({ patch }: { patch?: Partial<TreatmentDraft> }) { const { updateDraft } = useTreatmentDraft(); return <><button onClick={() => updateDraft({ ...draft, ...patch })}>Preparar</button><TreatmentReview /></>; }
function mount(patch?: Partial<TreatmentDraft>) { render(<TreatmentDraftProvider identity="A"><Harness patch={patch} /></TreatmentDraftProvider>); fireEvent.click(screen.getByText('Preparar')); }
it('T23 review exposes medication, amount, interval, exclusive end, zone and all literal instants', () => {
  mount(); expect(screen.getByText('Vitamina A')).toBeVisible(); expect(screen.getByText('1,5 mg')).toBeVisible(); expect(screen.getByText('A cada 6 horas')).toBeVisible();
  expect(screen.getByText('Fuso utilizado')).toBeVisible(); expect(screen.getByText('America/Sao_Paulo')).toBeVisible(); expect(screen.getByText('Fim exclusivo')).toBeVisible();
  expect(screen.getByTestId('review-start')).toHaveAttribute('datetime', '2026-11-13T11:00:00.000Z'); expect(screen.getByTestId('review-end')).toHaveAttribute('datetime', '2026-11-14T11:00:00.000Z');
  expect(screen.getByText('4 doses')).toBeVisible(); const toggle = screen.getByRole('button', { name: 'Ver todos os horários' }); fireEvent.click(toggle);
  const list = screen.getByRole('list', { name: 'Horários previstos' });
  expect(within(list).getAllByRole('listitem').map(item => item.querySelector('time')!.dateTime)).toEqual(['2026-11-13T11:00:00.000Z', '2026-11-13T17:00:00.000Z', '2026-11-13T23:00:00.000Z', '2026-11-14T05:00:00.000Z']);
  expect(list).toHaveTextContent('13/11/2026'); expect(list).toHaveTextContent('08:00'); fireEvent.click(screen.getByRole('button', { name: 'Ocultar horários' })); expect(screen.queryByRole('list', { name: 'Horários previstos' })).not.toBeInTheDocument();
});
it('T23 every one of 1000 doses can be inspected and the exclusive end is omitted', () => {
  mount({ intervalHours: '3', duration: '125' }); fireEvent.click(screen.getByRole('button', { name: 'Ver todos os horários' }));
  const items = within(screen.getByRole('list', { name: 'Horários previstos' })).getAllByRole('listitem'); expect(items).toHaveLength(1000);
  expect(items[0].querySelector('time')).toHaveAttribute('datetime', '2026-11-13T11:00:00.000Z'); expect(items[999].querySelector('time')).toHaveAttribute('datetime', '2027-03-18T08:00:00.000Z');
  expect(screen.getByTestId('review-end')).toHaveAttribute('datetime', '2027-03-18T11:00:00.000Z');
});
it('T23 invalid model explains the parameter and cannot display a fabricated schedule', () => {
  mount({ intervalHours: '0' }); expect(screen.getByRole('alert')).toHaveTextContent('Informe um inteiro positivo seguro');
  expect(screen.queryByRole('button', { name: 'Ver todos os horários' })).not.toBeInTheDocument(); expect(screen.queryByTestId('review-start')).not.toBeInTheDocument();
});
