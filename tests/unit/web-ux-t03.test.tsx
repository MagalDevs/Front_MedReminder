import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import FormField from '@/app/components/ui/FormField';

it('WUX_SYSTEM_05 associates a visible textual error with the labeled field and preserves its entered value', async () => {
  render(<FormField label="Quantidade por dose" description="Use a quantidade prescrita." error="Informe uma quantidade maior que zero.">
    <input defaultValue="0" />
  </FormField>);
  const input = screen.getByRole('textbox', { name: 'Quantidade por dose' });
  await userEvent.click(screen.getByText('Quantidade por dose'));
  expect(input).toHaveFocus();
  expect(input).toHaveValue('0');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Use a quantidade prescrita. Informe uma quantidade maior que zero.');
  expect(screen.getByRole('alert')).toHaveTextContent('Informe uma quantidade maior que zero.');
  await userEvent.clear(input);
  await userEvent.type(input, '0,5');
  expect(input).toHaveValue('0,5');
});

it('WUX_T03_ASSOCIATIONS keeps IDs unique, preserves external help, and removes stale error associations', () => {
  const example = (error?: string) => <>
    <p id="external-help">Dose informada na receita.</p>
    <FormField label="Dose" description="Informe o valor." error={error}>
      <input id="dose" aria-describedby="external-help" />
    </FormField>
    <FormField label="Unidade"><select defaultValue="mg"><option>mg</option><option>ml</option></select></FormField>
    <FormField label="Observação"><textarea /></FormField>
  </>;
  const { rerender } = render(example('Dose inválida.'));
  const dose = screen.getByRole('textbox', { name: 'Dose' });
  const unit = screen.getByRole('combobox', { name: 'Unidade' });
  const unitId = unit.id;
  const note = screen.getByRole('textbox', { name: 'Observação' });
  expect(new Set([dose.id, unit.id, note.id]).size).toBe(3);
  expect(dose).toHaveAttribute('id', 'dose');
  expect(dose).toHaveAccessibleDescription('Dose informada na receita. Informe o valor. Dose inválida.');
  rerender(example());
  expect(dose).not.toHaveAttribute('aria-invalid');
  expect(dose).toHaveAccessibleDescription('Dose informada na receita. Informe o valor.');
  expect(screen.queryByText('Dose inválida.')).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Unidade' })).toHaveAttribute('id', unitId);
});
