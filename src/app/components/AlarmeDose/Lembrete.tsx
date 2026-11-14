'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { LembreteContext } from '@/app/contexts/lembreteContext';
import { ApiError, apiRequest } from '@/app/utils/api';
import { RequestContractError, requestErrorMessage } from '@/app/utils/request-errors';
import { isDoseInstant } from '@/app/features/web-ux/domain/agenda';
import { publishDoseConfirmation } from '@/app/features/web-ux/data/dose-confirmations';
import RequestFeedback, { useRetryDelay } from '../RequestFeedback/RequestFeedback';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { medicationColors } from '../ui/ColorSelector';

interface alarmeDoseProps { dataHora: string; medicamentoNome: string; quantidadeDose: string; cor: string; id: number; onClose: () => void }
export default function Lembrete({ dataHora, medicamentoNome, quantidadeDose, cor, id, onClose }: alarmeDoseProps) {
  const context = useContext(LembreteContext);
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const key = `${token}:${id}`;
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string | null; notBefore?: number } | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null); const [refreshFailedKey, setRefreshFailedKey] = useState<string | null>(null);
  const saving = savingKey === key; const error = failure?.key === key ? failure.message : null; const confirmed = confirmedKey === key; const refreshFailed = refreshFailedKey === key;
  const remaining = useRetryDelay(failure?.key === key ? failure.notBefore : undefined);
  const attempt = useRef<AbortController | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isDoseInstant(dataHora) || Date.parse(dataHora) <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(2_147_483_647, Math.max(0, Date.parse(dataHora) - Date.now())));
    return () => window.clearTimeout(timer);
  }, [dataHora, now]);
  useEffect(() => () => { attempt.current?.abort(); attempt.current = null; }, [id, token]);
  const valid = isDoseInstant(dataHora); const date = valid ? new Date(dataHora) : null;
  const time = date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : 'Horário não informado';
  const scheduled = !!date && date.getTime() > now;
  async function register() {
    if (attempt.current || remaining || !valid || Date.parse(dataHora) > Date.now()) return;
    const controller = new AbortController(); attempt.current = controller;
    const current = () => !controller.signal.aborted && attempt.current === controller && localStorage.getItem('access_token') === token;
    setSavingKey(key); setFailure(null);
    try {
      if (!confirmed) {
        const response = await apiRequest<{ data: { id: number; tomado: boolean; data_dose: string } }>(`dose/${id}`, { method: 'PUT', signal: controller.signal, body: JSON.stringify({ tomado: true }) });
        if (!current()) return;
        if (response?.data?.id !== id || response.data.tomado !== true || !isDoseInstant(response.data.data_dose) || Date.parse(response.data.data_dose) !== Date.parse(dataHora)) throw new RequestContractError();
        setConfirmedKey(key);
        if (context?.identityKey) publishDoseConfirmation({ identityKey: context.identityKey, id, expectedAt: dataHora, registered: true });
      }
      const refreshed = await context?.getLembretes();
      if (!current()) return;
      if (refreshed === false) { setRefreshFailedKey(key); return; }
      onClose();
    } catch (cause) { if (current()) setFailure({ key, message: requestErrorMessage(cause), notBefore: cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : undefined }); }
    finally { if (current()) { attempt.current = null; setSavingKey(null); } }
  }
  return <Dialog open onClose={onClose} title="Lembrete de dose" description="Fechar este lembrete não registra nem adia a dose.">
    <div className="space-y-6">
      <div className="space-y-2"><h3 className="break-words text-2xl font-semibold">{medicamentoNome}</h3><p className="text-xl font-semibold">{quantidadeDose}</p><dl className="flex flex-wrap gap-6"><div><dt>Data</dt><dd>{date?.toLocaleDateString('pt-BR') || 'Não informada'}</dd></div><div><dt>Horário</dt><dd><time dateTime={valid ? dataHora : undefined}>{time}</time></dd></div></dl><p className="flex items-center gap-2 text-[var(--text-muted)]"><span aria-hidden style={{ backgroundColor: medicationColors.find(color => color.value === cor)?.swatch ?? 'transparent' }} className="h-5 w-5 rounded border border-[var(--border-control)]" />Cor identificadora: {cor || 'Não informada'}</p></div>
      <div ref={context?.setLembretesFeedbackHost} />
      {error && <RequestFeedback context="Ao registrar dose" message={error} />}
      {refreshFailed && <RequestFeedback kind="success" message="Dose registrada. A atualização dos lembretes não foi concluída." />}
      {remaining > 0 && <p role="status">Aguarde {remaining} segundos para tentar novamente.</p>}
      {scheduled && <p>Programada. O registro fica disponível no horário previsto.</p>}
      <Button className="w-full" onClick={() => void register()} loading={saving} loadingLabel="Registrando…" disabled={!valid || scheduled || remaining > 0} aria-label={confirmed ? 'Atualizar lembretes' : `Registrar dose de ${medicamentoNome} às ${time}`}>{confirmed ? 'Atualizar lembretes' : 'Registrar dose'}</Button>
    </div>
  </Dialog>;
}
