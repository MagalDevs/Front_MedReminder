import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it } from 'vitest';
import Dialog from '@/app/components/ui/Dialog';
import Button from '@/app/components/ui/Button';

beforeEach(() => {
  // jsdom has no top layer. Only supply the missing native open/close API;
  // the component's real keyboard and focus handlers remain under test.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

function Example({ empty = false }: { empty?: boolean }) {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  return <><Button onClick={() => setOpen(true)}>Excluir medicamento</Button>
    <a href="#agenda">Consultar agenda</a><p>{removed ? 'Medicamento excluído' : 'Medicamento mantido'}</p>
    <Dialog open={open} onClose={() => setOpen(false)} title="Excluir Amoxicilina?" description="Confira o nome antes de excluir.">
      {!empty && <><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        <Button onClick={() => { setRemoved(true); setOpen(false); }}>Confirmar exclusão</Button></>}
    </Dialog></>;
}

it('WUX_ACCESS_05 returns focus to the opener after explicit cancellation and close', async () => {
  render(<Example />);
  const opener = screen.getByRole('button', { name: 'Excluir medicamento' });
  await userEvent.click(opener);
  expect(screen.getByRole('dialog', { name: 'Excluir Amoxicilina?' })).toHaveAccessibleDescription('Confira o nome antes de excluir.');
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(screen.getByText('Medicamento mantido')).toBeVisible();
  await userEvent.click(opener);
  await userEvent.click(screen.getByRole('button', { name: 'Fechar Excluir Amoxicilina?' }));
  expect(opener).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('WUX_ACCESS_10 contains Tab and Shift+Tab and Escape cancels without confirming a destructive action', async () => {
  render(<Example />);
  const opener = screen.getByRole('button', { name: 'Excluir medicamento' });
  await userEvent.click(opener);
  const dialog = screen.getByRole('dialog');
  const close = within(dialog).getByRole('button', { name: 'Fechar Excluir Amoxicilina?' });
  const confirm = within(dialog).getByRole('button', { name: 'Confirmar exclusão' });
  expect(close).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(confirm).toHaveFocus();
  await userEvent.tab();
  expect(close).toHaveFocus();
  await userEvent.tab();
  expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Medicamento mantido')).toBeVisible();
  expect(opener).toHaveFocus();
});

it('WUX_T04_MINIMAL keeps focus reachable with only the built-in close action', async () => {
  render(<Example empty />);
  await userEvent.click(screen.getByRole('button', { name: 'Excluir medicamento' }));
  const close = screen.getByRole('button', { name: 'Fechar Excluir Amoxicilina?' });
  await userEvent.tab();
  expect(close).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(close).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  expect(screen.getByText('Medicamento mantido')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
