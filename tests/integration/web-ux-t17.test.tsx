import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMedicationDeletion } from '@/app/features/web-ux/hooks/useMedicationDeletion';
import Dialog from '@/app/components/ui/Dialog';
import RequestFeedback from '@/app/components/RequestFeedback/RequestFeedback';
function Probe({ identity = 'A' }: { identity?: string }) {
  const op = useMedicationDeletion({ identity });
  return <>{!op.deletedIds.includes(77) && <div><p>Vitamina</p><p>4 doses previstas</p><button onClick={() => op.requestDeletion({ id: 77, name: 'Vitamina' })}>Excluir medicamento</button></div>}
    <Dialog open={!!op.confirmation} onClose={op.cancel} title={op.confirmation?.title ?? ''} description={op.confirmation?.description}>
      <button onClick={op.cancel} disabled={op.pending}>Cancelar</button><button onClick={() => void op.confirm()} disabled={op.pending}>Confirmar exclusão</button>
      {op.error && <RequestFeedback message={op.error} retry={{ onRetry: async () => { await op.retry(); }, notBefore: op.retryNotBefore }} />}
    </Dialog></>;
}
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A');
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
it('WUX_MED_08', async () => {
  let resolve!: (value: Response) => void; vi.mocked(fetch).mockImplementation(() => new Promise(done => { resolve = done; })); render(<Probe />);
  fireEvent.click(screen.getByText('Excluir medicamento'));
  expect(screen.getByRole('dialog', { name: 'Excluir Vitamina?' })).toHaveAccessibleDescription('Excluir Vitamina também remove todas as suas doses.');
  expect(fetch).not.toHaveBeenCalled(); fireEvent.click(screen.getByText('Confirmar exclusão'));
  expect(screen.getByText('4 doses previstas')).toBeVisible(); expect(screen.getByText('Confirmar exclusão')).toBeDisabled();
  const [url, init] = vi.mocked(fetch).mock.calls[0]; expect(String(url)).toMatch(/\/remedio\/77$/); expect(init?.method).toBe('DELETE'); expect(init?.body).toBeUndefined();
  await act(async () => resolve(new Response(JSON.stringify({ message: 'Remédio excluído' }), { status: 200, headers: { 'content-type': 'application/json' } })));
  expect(screen.queryByText('Vitamina')).not.toBeInTheDocument(); expect(screen.queryByText('4 doses previstas')).not.toBeInTheDocument(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('WUX_MED_09', () => {
  render(<Probe />); fireEvent.click(screen.getByText('Excluir medicamento')); fireEvent.click(screen.getByText('Cancelar'));
  expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.getByText('4 doses previstas')).toBeVisible(); expect(fetch).not.toHaveBeenCalled(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('WUX_MED_10', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Remédio excluído' }), { status: 200, headers: { 'content-type': 'application/json' } }));
  render(<Probe />); fireEvent.click(screen.getByText('Excluir medicamento')); fireEvent.click(screen.getByText('Confirmar exclusão'));
  await screen.findByRole('alert'); expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.getByText('4 doses previstas')).toBeVisible();
  fireEvent.click(screen.getByText('Tentar novamente')); await waitFor(() => expect(screen.queryByText('Vitamina')).not.toBeInTheDocument()); expect(fetch).toHaveBeenCalledTimes(2);
});
it('descarta exclusão antiga ao trocar identidade', async () => {
  let resolve!: (value: Response) => void; vi.mocked(fetch).mockImplementation(() => new Promise(done => { resolve = done; })); const view = render(<Probe />);
  fireEvent.click(screen.getByText('Excluir medicamento')); fireEvent.click(screen.getByText('Confirmar exclusão'));
  localStorage.setItem('access_token', 'token-B'); view.rerender(<Probe identity="B" />);
  await act(async () => resolve(new Response(JSON.stringify({ message: 'Remédio excluído' }), { headers: { 'content-type': 'application/json' } })));
  expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
