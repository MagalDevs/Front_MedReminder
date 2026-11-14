import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Button from '@/app/components/ui/Button';

describe('shared Button (SYSTEM-04, ACCESS-07)', () => {
  it('WUX_T02_KEYBOARD activates the named action by keyboard without submitting a surrounding form', async () => {
    function Example() {
      const [text, setText] = useState('Antes');
      return <form onSubmit={event => { event.preventDefault(); setText('Envio indevido'); }}>
        <Button onClick={() => setText('Revisão aberta')}>Conferir tratamento</Button><p>{text}</p>
      </form>;
    }
    render(<Example />);
    const button = screen.getByRole('button', { name: 'Conferir tratamento' });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Revisão aberta')).toBeVisible();
    expect(screen.queryByText('Envio indevido')).not.toBeInTheDocument();
    expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
  });

  it('WUX_T02_PENDING blocks activation while loading or disabled and keeps an accessible progress label', async () => {
    function Example() {
      const [pending, setPending] = useState(false);
      const [submissions, setSubmissions] = useState(0);
      return <><Button loading={pending} loadingLabel="Salvando tratamento…" onClick={() => {
        setSubmissions(value => value + 1); setPending(true);
      }}>Salvar tratamento</Button>
        <Button disabled onClick={() => setPending(false)}>Cancelar envio</Button>
        <p>{submissions} tratamento em envio</p></>;
    }
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar tratamento' }));
    const pending = screen.getByRole('button', { name: 'Salvando tratamento…' });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(pending);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }));
    expect(pending).toBeVisible();
    expect(pending).toBeDisabled();
    expect(screen.getByText('1 tratamento em envio')).toBeVisible();
  });

  it('WUX_T02_VARIANTS preserves submit semantics and allows secondary keyboard activation', async () => {
    function Example() {
      const [result, setResult] = useState('Em edição');
      return <form onSubmit={event => { event.preventDefault(); setResult('Tratamento salvo'); }}>
        <Button variant="secondary" onClick={() => setResult('Etapa anterior')}>Voltar</Button>
        <Button type="submit">Salvar</Button><p>{result}</p>
      </form>;
    }
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByText('Etapa anterior')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Tratamento salvo')).toBeVisible();
  });
});
