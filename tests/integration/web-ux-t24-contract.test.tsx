import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import TreatmentWizard from '@/app/features/web-ux/components/TreatmentWizard';
import { TreatmentDraftProvider } from '@/app/features/web-ux/contexts/TreatmentDraftContext';
import { buildTreatmentPayload, validateDraft, type TreatmentDraft } from '@/app/features/web-ux/domain/treatment';
vi.mock('next/navigation', () => ({ usePathname: () => '/novo-medicamento' }));
const draft: TreatmentDraft = { medicationName: 'Vitamina', classification: '', amount: '1,5', unit: 'mg', stock: '10', boxUnit: 'comprimidos', color: 'Azul', photo: 'https://example.test/photo.png', expiry: '2027-12-31', firstDoseAt: '2026-11-13T08:00', intervalHours: '6', duration: '1', durationUnit: 'days', reason: '', notes: '' };
beforeEach(() => { localStorage.setItem('access_token', 'token-A'); vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} })); vi.mocked(fetch).mockResolvedValue(new Response('NOME_PRODUTO,DESCRIÇÃO\nVitamina,Suplemento\n')); });
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function mount() { render(<TreatmentDraftProvider identity="A"><TreatmentWizard refresh={async () => true} /></TreatmentDraftProvider>); fill('Nome do medicamento', 'Vitamina'); fill('Quantidade em estoque', '10'); fill('Validade', '2027-12-31'); fill('URL da foto', draft.photo); }
it('T24 contract rejects missing or overlong stock unit and color before constructing a payload', () => {
  for (const field of ['boxUnit', 'color'] as const) {
    for (const value of ['', '   ', 'x'.repeat(51)]) {
      const invalid = { ...draft, [field]: value }; expect(validateDraft(invalid).errors).toHaveProperty(field); expect(() => buildTreatmentPayload(invalid)).toThrow();
    }
  }
});
it('T24 contract preserves valid 50-character metadata and 255-character photo, rejecting 256', () => {
  const photo = 'https://example.test/' + 'x'.repeat(234);
  expect(photo).toHaveLength(255); const valid = { ...draft, boxUnit: 'u'.repeat(50), color: 'c'.repeat(50), photo };
  expect(validateDraft(valid).valid).toBe(true); expect(buildTreatmentPayload(valid).remedio).toMatchObject({ unidadeMedida: 'u'.repeat(50), cor: 'c'.repeat(50), foto: photo });
  expect(validateDraft({ ...valid, photo: photo + 'x' }).errors).toHaveProperty('photo'); expect(() => buildTreatmentPayload({ ...valid, photo: photo + 'x' })).toThrow();
});
it('T24 required stock unit and color block progression and focus their associated errors', () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); const unit = screen.getByLabelText('Unidade do estoque'); expect(unit).toHaveFocus(); expect(unit).toHaveAttribute('aria-invalid', 'true'); expect(document.getElementById(unit.getAttribute('aria-describedby')!.split(' ').at(-1)!)).toHaveTextContent('Informe a unidade do estoque');
  fill('Unidade do estoque', 'comprimidos'); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); const color = screen.getByRole('group', { name: 'Cor identificadora' }); expect(color).toHaveFocus(); expect(color).toHaveAttribute('aria-invalid', 'true'); expect(document.getElementById(color.getAttribute('aria-describedby')!)).toHaveTextContent('Escolha uma cor identificadora');
  expect(screen.queryByLabelText('Quantidade por dose')).not.toBeInTheDocument(); expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  fireEvent.click(screen.getByRole('radio', { name: 'Azul' })); fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); expect(screen.getByLabelText('Quantidade por dose')).toBeVisible();
});
it('T24 overlong photo URL is identified before advancing or posting', () => {
  mount(); fill('Unidade do estoque', 'comprimidos'); fireEvent.click(screen.getByRole('radio', { name: 'Azul' })); fill('URL da foto', 'https://example.test/' + 'x'.repeat(235)); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByLabelText('URL da foto')).toHaveFocus(); expect(screen.getByLabelText('URL da foto')).toHaveAttribute('aria-invalid', 'true'); expect(screen.getByText('Informe uma URL de imagem com até 255 caracteres')).toBeVisible(); expect(screen.queryByLabelText('Quantidade por dose')).not.toBeInTheDocument(); expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
});
