import { LembreteContext } from '@/app/contexts/lembreteContext';
import { apiRequest } from '@/app/utils/api';
import { getSessionIdentity } from '@/app/utils/session-storage';
import { Bell, X } from 'lucide-react';
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import RequestFeedback from '../RequestFeedback/RequestFeedback';
import { requestErrorMessage } from '@/app/utils/request-errors';

interface alarmeDoseProps {
  dataHora: string;
  medicamentoNome: string;
  quantidadeDose: string;
  cor: string;
  id: number;
  onClose: () => void;
}

const Lembrete = (props: alarmeDoseProps) => {
  const { dataHora, medicamentoNome, quantidadeDose, cor, id, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const medicineId = useId();
  const context = useContext(LembreteContext);
  const session = getSessionIdentity();
  const key = `${session}:${id}`;
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string | null } | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const [refreshFailedKey, setRefreshFailedKey] = useState<string | null>(null);
  const saving = savingKey === key;
  const error = failure?.key === key ? failure.message : null;
  const confirmed = confirmedKey === key;
  const refreshFailed = refreshFailedKey === key;
  const attempt = useRef<AbortController | null>(null);
  useEffect(() => () => { attempt.current?.abort(); attempt.current = null; }, [id, session]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const dataDose = new Date(dataHora);

  const dia = String(dataDose.getDate()).padStart(2, '0');
  const mes = String(dataDose.getMonth() + 1).padStart(2, '0');
  const ano = dataDose.getFullYear().toString();

  const hora = String(dataDose.getHours()).padStart(2, '0');
  const minuto = String(dataDose.getMinutes()).padStart(2, '0');
  const horario = `${hora}:${minuto}`;


  const hashCor: Record<string, string> = {
    'Vermelho': '#FF0000',
    'Azul': '#4B00FF',
    'Amarelo': '#FFFF00',
    'Laranja': '#FFA500',
    'Azul claro': '#00CFFF',
    'Branco': '#FFFFFF',
    'Verde claro': '#00FF7F',
    'Verde escuro': '#006400',
    'Preto': '#000000',
    'Orquídea': '#DA70D6'
  };

  const corMedicamento = Object.hasOwn(hashCor, cor) ? hashCor[cor] : '#037F8C';

  const medicamentoTomado = async () => {
    if (attempt.current) return;
    const controller = new AbortController();
    attempt.current = controller;
    const current = () => !controller.signal.aborted && getSessionIdentity() === session;
    setSavingKey(key);
    setFailure(null);
    try {
      if (!confirmed) {
        await apiRequest(`dose/${id}`, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tomado: true,
      }),
        });
        if (!current()) return;
        setConfirmedKey(key);
      }
      const refreshed = await context?.getLembretes();
      if (!current()) return;
      if (refreshed === false) { setRefreshFailedKey(key); return; }
      onClose();
    } catch (failure) {
      if (current()) setFailure({ key, message: requestErrorMessage(failure) });
    } finally {
      if (attempt.current === controller) attempt.current = null;
      if (current()) setSavingKey(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={medicineId}
      className="KantumruyRegular fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-[#182C2D] shadow-[0_16px_48px_#102D3040] backdrop:bg-[#0D2123]/50 sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8F6F4] text-[#044D55]">
          <Bell className="size-5" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="KantumruySemiBold flex-1 text-lg leading-snug">Hora do Medicamento!</h2>
        <button
          type="button"
          aria-label="Fechar lembrete"
          className="med-button med-button--ghost shrink-0 px-2"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <p id={medicineId} className="KantumruyBold mt-5 flex items-baseline gap-2.5 text-2xl leading-tight [overflow-wrap:anywhere]">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full border border-[#182C2D]/30" style={{ backgroundColor: corMedicamento }} />
        {medicamentoNome}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-[#EDF3F3] p-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-[#425858]">Data</dt>
          <dd className="KantumruySemiBold mt-1 tabular-nums">{dia}/{mes}/{ano}</dd>
        </div>
        <div>
          <dt className="text-sm text-[#425858]">Horário</dt>
          <dd className="KantumruySemiBold mt-1 tabular-nums">{horario}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-sm text-[#425858]">Dosagem</dt>
          <dd className="KantumruySemiBold mt-1 tabular-nums [overflow-wrap:anywhere]">{quantidadeDose}</dd>
        </div>
      </dl>
      <div className="mt-5 space-y-3">
        <div ref={context?.setLembretesFeedbackHost} />
        {error && <RequestFeedback context="Ao confirmar dose" message={error} />}
        {refreshFailed && <RequestFeedback kind="success" message="Dose confirmada. A atualização dos lembretes não foi concluída." />}
        <button
          type="button"
          onClick={medicamentoTomado}
          disabled={saving}
          className="med-button med-button--primary min-h-12 w-full bg-[#044D55] text-base hover:bg-[#063B40]"
        >
          {saving ? 'Carregando...' : confirmed ? 'Atualizar lembretes' : 'Medicamento Tomado'}
        </button>
      </div>
    </dialog>
  )
}

export default Lembrete;
