import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TreatmentDraftProvider, useTreatmentDraft } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
function Probe() {
  const { draft, updateDraft, summary, setSummary } = useTreatmentDraft();
  return <><output>{draft.medicationName}:{draft.amount}:{summary?.medicationName}</output><button onClick={() => { updateDraft({ medicationName: 'Vitamina', amount: '1,5' }); setSummary({ medicationId: 1, medicationName: 'Salvo', firstDoseAt: '2026-11-14T12:00:00Z' }); }}>preencher</button></>;
}
it('preserva rascunho e resumo entre rotas da mesma aba sem storage', () => {
  const local = vi.spyOn(Storage.prototype, 'setItem');
  const view = render(<TreatmentDraftProvider identity="A"><Probe /></TreatmentDraftProvider>);
  fireEvent.click(screen.getByText('preencher'));
  view.rerender(<TreatmentDraftProvider identity="A"><div>outra rota</div></TreatmentDraftProvider>);
  view.rerender(<TreatmentDraftProvider identity="A"><Probe /></TreatmentDraftProvider>);
  expect(screen.getByRole('status')).toHaveTextContent('Vitamina:1,5:Salvo');
  expect(local).not.toHaveBeenCalled();
});
it('descarta o namespace na troca de identidade e no logout, inclusive ao retornar à conta anterior', () => {
  const view = render(<TreatmentDraftProvider identity="A"><Probe /></TreatmentDraftProvider>);
  fireEvent.click(screen.getByText('preencher'));
  for (const identity of ['B', 'A', '']) {
    view.rerender(<TreatmentDraftProvider identity={identity}><Probe /></TreatmentDraftProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('::');
  }
  fireEvent.click(screen.getByText('preencher'));
  expect(screen.getByRole('status')).toHaveTextContent('::Salvo');
});
