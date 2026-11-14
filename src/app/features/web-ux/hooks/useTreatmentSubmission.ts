'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import { useTreatmentDraft, type TreatmentIntent, type TreatmentSummary } from '../contexts/TreatmentDraftContext';
import { buildTreatmentPayload } from '../domain/treatment';
import { isDoseInstant } from '../domain/agenda';

type Payload = ReturnType<typeof buildTreatmentPayload>;
function confirmedSummary(raw: unknown, payload: Payload): TreatmentSummary {
  const data = (raw as { data?: { remedio?: { id?: number; nome?: string }; doses?: { id: number; remedioId: number; data_dose: string; tomado: boolean }[] } })?.data;
  const medication = data?.remedio; const doses = data?.doses;
  if (!medication || !Number.isSafeInteger(medication.id) || medication.id! <= 0 || medication.nome !== payload.remedio.nome || !Array.isArray(doses) || doses.length !== payload.doses.length ||
    new Set(doses.map(dose => dose?.id)).size !== doses.length || !doses.every(dose => dose && Number.isSafeInteger(dose.id) && dose.id > 0 && dose.remedioId === medication.id && typeof dose.tomado === 'boolean' && isDoseInstant(dose.data_dose)) ||
    [...doses].map(dose => Date.parse(dose.data_dose)).sort((a, b) => a - b).some((instant, index) => instant !== Date.parse(payload.doses[index]))) throw new RequestContractError();
  return { medicationId: medication.id!, medicationName: medication.nome, firstDoseAt: payload.doses[0] };
}
export function useTreatmentSubmission({ refresh: refreshCollection }: { refresh: () => Promise<unknown> }) {
  const { identity, draft, intent, setIntent, resetDraft, setSummary } = useTreatmentDraft();
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const request = useRef<AbortController | null>(null);
  const latestIntent = useRef(intent); latestIntent.current = intent;
  const [error, setError] = useState<string | null>(null);
  useLayoutEffect(() => () => {
    request.current?.abort(); request.current = null;
    const pending = latestIntent.current;
    if (pending.phase === 'submitting') setIntent({ ...pending, phase: 'uncertain' });
  }, [identity, token, setIntent]);

  async function refresh() {
    if (intent.phase !== 'confirmed' || request.current) return false;
    const controller = new AbortController(); request.current = controller;
    try {
      const result = await refreshCollection();
      if (result === false || (result && typeof result === 'object' && 'complete' in result && !result.complete)) throw new Error('Carga incompleta');
      if (!controller.signal.aborted && localStorage.getItem('access_token') === token) setIntent({ ...intent, refreshFailed: false });
      return !controller.signal.aborted;
    } catch {
      if (!controller.signal.aborted && localStorage.getItem('access_token') === token) setIntent({ ...intent, refreshFailed: true });
      return false;
    } finally { if (request.current === controller) request.current = null; }
  }
  async function submit() {
    if (!identity || !token || request.current || intent.phase === 'confirmed' || intent.phase === 'submitting') return false;
    let pending: Extract<TreatmentIntent, { key: string }>;
    try {
      pending = intent.phase === 'uncertain' ? intent : { phase: 'submitting', identity, key: crypto.randomUUID(), body: JSON.stringify(buildTreatmentPayload(draft)) };
    } catch (cause) { setError(requestErrorMessage(cause)); return false; }
    if (pending.identity !== identity || (pending.retryNotBefore ?? 0) > Date.now()) return false;
    const controller = new AbortController(); request.current = controller;
    const active = () => !controller.signal.aborted && localStorage.getItem('access_token') === token;
    setIntent({ ...pending, phase: 'submitting' }); setError(null);
    try {
      const response = await apiRequest('tratamento', { method: 'POST', body: pending.body, headers: { 'Idempotency-Key': pending.key }, signal: controller.signal });
      if (!active()) return false;
      const summary = confirmedSummary(response, JSON.parse(pending.body) as Payload);
      setSummary(summary); resetDraft();
      setIntent({ phase: 'confirmed', summary, refreshFailed: false });
      try {
        const result = await refreshCollection();
        if (result === false || (result && typeof result === 'object' && 'complete' in result && !result.complete)) throw new Error('Carga incompleta');
      } catch { if (active()) setIntent({ phase: 'confirmed', summary, refreshFailed: true }); }
      return active();
    } catch (cause) {
      if (active()) {
        setIntent({ ...pending, phase: 'uncertain', retryNotBefore: cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : undefined });
        setError('Não foi possível confirmar o resultado. Tente a mesma intenção novamente ou consulte os registros.');
      }
      return false;
    } finally { if (request.current === controller) request.current = null; }
  }
  return { intent, locked: intent.phase !== 'editing', error, submit, retry: submit, refresh, consultHref: '/meus-medicamentos',
    message: intent.phase === 'confirmed' ? intent.refreshFailed ? 'Tratamento salvo. Não foi possível atualizar a lista.' : 'Tratamento salvo.' : error,
    retryNotBefore: intent.phase === 'uncertain' ? intent.retryNotBefore : undefined };
}
