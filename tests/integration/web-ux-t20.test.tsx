import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import DoseCard from '@/app/features/web-ux/components/DoseCard';
import { useDoseMutation } from '@/app/features/web-ux/hooks/useDoseMutation';
import type { CompleteDose, DoseView } from '@/app/features/web-ux/domain/agenda';
const instant = '2026-11-14T15:00:00Z';
const dose: CompleteDose = { kind: 'complete', id: 91, medicationId: 77, medicationName: 'Vitamina', expectedAt: instant, amountLabel: '1,5 mg', registered: false };
const now = new Date('2026-11-14T15:00:00Z');
const zone = 'America/Sao_Paulo';
const response = (registered: boolean) => new Response(JSON.stringify({ data: { id: 91, tomado: registered, data_dose: instant } }), { headers: { 'content-type': 'application/json' } });
function Integrated({ registered = false, nowValue = now }: { registered?: boolean; nowValue?: Date }) {
  const [source] = useState<DoseView[]>([{ ...dose, registered }]);
  const operation = useDoseMutation({ doses: source, identity: 'A' });
  return <DoseCard dose={operation.doses[0]} now={nowValue} zone={zone} status={operation.status[91]} onMutate={operation.mutate} onRetry={() => operation.retry(91)} />;
}
beforeEach(() => {
  localStorage.setItem('access_token', 'token-A'); vi.setSystemTime(now);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
it('WUX_DOSE_01', async () => {
  vi.mocked(fetch).mockResolvedValue(response(true)); render(<Integrated />);
  expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.getByText('1,5 mg')).toBeVisible(); expect(screen.getByText('Pendente')).toBeVisible();
  expect(screen.getByText(/14\/11\/2026/)).toHaveTextContent('12:00');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar dose de Vitamina, prevista para 14/11/2026 às 12:00' }));
  await screen.findByText('Registrada'); expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ tomado: true });
});
it('WUX_DOSE_02', () => {
  const mutate = vi.fn(); render(<DoseCard dose={{ ...dose, expectedAt: '2026-11-14T16:00:00Z' }} now={now} zone={zone} onMutate={mutate} />);
  expect(screen.getByText('Vitamina')).toBeVisible(); expect(screen.getByText('Programada')).toBeVisible(); expect(screen.getByText(/13:00/)).toBeVisible();
  expect(screen.queryByRole('button', { name: /Registrar dose/ })).not.toBeInTheDocument(); expect(mutate).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
it('WUX_DOSE_05', async () => {
  vi.mocked(fetch).mockResolvedValue(response(false)); render(<Integrated registered />);
  const opener = screen.getByRole('button', { name: 'Corrigir registro de Vitamina, previsto para 14/11/2026 às 12:00' }); opener.focus(); fireEvent.click(opener);
  expect(screen.getByRole('dialog', { name: 'Corrigir registro de Vitamina?' })).toHaveAccessibleDescription('A dose prevista para 14/11/2026 às 12:00 voltará a não registrada.');
  expect(fetch).not.toHaveBeenCalled(); fireEvent.click(screen.getByText('Cancelar')); expect(fetch).not.toHaveBeenCalled(); expect(opener).toHaveFocus(); expect(screen.getByText('Registrada')).toBeVisible();
  fireEvent.click(opener); fireEvent.click(screen.getByText('Confirmar correção'));
  await screen.findByText('Pendente'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ tomado: false });
});
it('exibe atrasada e permite tentar novamente após falha, conservando o estado confirmado', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response(true)); render(<Integrated />);
  fireEvent.click(screen.getByRole('button', { name: /Registrar dose/ })); await screen.findByRole('alert'); expect(screen.getByText('Pendente')).toBeVisible();
  fireEvent.click(screen.getByText('Tentar novamente')); await screen.findByText('Registrada'); expect(fetch).toHaveBeenCalledTimes(2);
});
it('oferece registro para dose atrasada e mostra confirmação do servidor', async () => {
  vi.mocked(fetch).mockResolvedValue(response(true)); render(<Integrated nowValue={new Date('2026-11-14T16:00:00Z')} />);
  expect(screen.getByText('Atrasada')).toBeVisible(); fireEvent.click(screen.getByRole('button', { name: /Registrar dose de Vitamina/ }));
  await screen.findByText('Registrada');
});
it('mantém erro da correção dentro do diálogo e retry conclui a correção', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response(false)); render(<Integrated registered />);
  fireEvent.click(screen.getByRole('button', { name: /Corrigir registro/ })); fireEvent.click(screen.getByText('Confirmar correção'));
  const alert = await screen.findByRole('alert'); expect(screen.getByRole('dialog')).toContainElement(alert); expect(screen.getByText('Registrada')).toBeVisible();
  fireEvent.click(screen.getByText('Tentar novamente')); await screen.findByText('Pendente'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('dados incompletos não recebem nome, horário ou ação inventados', () => {
  const mutate = vi.fn(); render(<DoseCard dose={{ kind: 'incomplete', id: 12, reason: 'Horário não informado', rawDate: '2026-11-14', raw: {} }} now={now} onMutate={mutate} />);
  expect(screen.getByText('Dados incompletos')).toBeVisible(); expect(screen.getByText('Horário não informado')).toBeVisible(); expect(screen.queryByRole('button')).not.toBeInTheDocument(); expect(mutate).not.toHaveBeenCalled();
});
it('revalida o relógio no gesto e bloqueia o cartão durante solicitação pendente', async () => {
  const mutate = vi.fn(async () => true); const view = render(<DoseCard dose={dose} now={now} zone={zone} onMutate={mutate} />);
  vi.setSystemTime(new Date('2026-11-14T14:00:00Z')); fireEvent.click(screen.getByRole('button', { name: /Registrar dose/ })); expect(mutate).not.toHaveBeenCalled();
  view.rerender(<DoseCard dose={dose} now={now} zone={zone} status={{ pending: true, error: null }} onMutate={mutate} />);
  expect(screen.getByRole('button', { name: /Registrando/ })).toBeDisabled();
  await waitFor(() => expect(fetch).not.toHaveBeenCalled());
});
