import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import ColorSelector from '@/app/components/ui/ColorSelector';
function Probe() { const [value, setValue] = useState('Vermelho'); return <ColorSelector value={value} onChange={setValue} />; }
it('WUX_ACCESS_03', async () => {
  const user = userEvent.setup(); render(<Probe />);
  expect(screen.getByRole('group', { name: 'Cor identificadora' })).toBeVisible();
  expect(screen.getAllByRole('radio').map(radio => radio.getAttribute('value'))).toEqual(['Vermelho', 'Azul', 'Amarelo', 'Laranja', 'Azul claro', 'Branco', 'Verde claro', 'Verde escuro', 'Preto', 'Orquídea']);
  expect(screen.getByRole('radio', { name: 'Vermelho' })).toBeChecked();
  await user.tab(); expect(screen.getByRole('radio', { name: 'Vermelho' })).toHaveFocus();
  await user.keyboard('{ArrowRight}'); expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked(); expect(screen.getByRole('radio', { name: 'Vermelho' })).not.toBeChecked();
  await user.keyboard('{ArrowLeft}'); expect(screen.getByRole('radio', { name: 'Vermelho' })).toBeChecked();
  await user.click(screen.getByText('Branco')); expect(screen.getByRole('radio', { name: 'Branco' })).toBeChecked();
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
  for (const radio of screen.getAllByRole('radio')) expect(radio.closest('label')).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
});
it('mantém seleção e impede alteração quando indisponível', async () => {
  const onChange = vi.fn(); const user = userEvent.setup(); render(<ColorSelector value="Azul" disabled onChange={onChange} />);
  await user.click(screen.getByText('Amarelo')); expect(onChange).not.toHaveBeenCalled(); expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Amarelo' })).toBeDisabled();
});
