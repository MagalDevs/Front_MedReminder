'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import { CompleteDose, DoseView, doseState, isDoseInstant } from '../domain/agenda';

export type DoseMutationStatus = { pending: boolean; error: string | null; retryNotBefore?: number; desired?: boolean };
type Snapshot = { scope: string; source: DoseView[]; confirmed: Record<number, boolean>; status: Record<number, DoseMutationStatus> };

/** Pass the immutable collection snapshot; a new snapshot revokes pending writes. */
export function useDoseMutation({ doses, identity }: { doses: DoseView[]; identity: string }) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const scope = JSON.stringify([identity, token]);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ scope, source: doses, confirmed: {}, status: {} }));
  const requests = useRef(new Map<number, AbortController>());
  const current = snapshot.scope === scope && snapshot.source === doses;
  const status = useMemo(() => current ? snapshot.status : {}, [current, snapshot.status]);
  const confirmed = current ? snapshot.confirmed : {};
  const visibleDoses = doses.map(dose => dose.kind === 'complete' && confirmed[dose.id] !== undefined ? { ...dose, registered: confirmed[dose.id] } : dose);

  useLayoutEffect(() => {
    const pending = requests.current;
    return () => { for (const request of pending.values()) request.abort(); pending.clear(); };
  }, [scope, doses]);

  const mutate = useCallback(async (id: number, registered: boolean): Promise<boolean> => {
    const dose = visibleDoses.find((item): item is CompleteDose => item.kind === 'complete' && item.id === id);
    if (!identity || !token || !dose || typeof registered !== 'boolean' || requests.current.has(id) || dose.registered === registered || (status[id]?.retryNotBefore ?? 0) > Date.now()) return false;
    // Recheck at the gesture, even if a hidden tab's last rendered clock was old.
    if (registered && doseState(dose, Date.now()) === 'scheduled') return false;
    const controller = new AbortController();
    requests.current.set(id, controller);
    const active = () => !controller.signal.aborted && localStorage.getItem('access_token') === token;
    const update = (change: (previous: Snapshot) => Snapshot) => setSnapshot(previous => change(previous.scope === scope && previous.source === doses ? previous : { scope, source: doses, confirmed: {}, status: {} }));
    update(previous => ({ ...previous, status: { ...previous.status, [id]: { pending: true, error: null, desired: registered } } }));
    try {
      const response = await apiRequest<{ data?: { id?: unknown; tomado?: unknown; data_dose?: unknown } }>(`dose/${id}`, { method: 'PUT', body: JSON.stringify({ tomado: registered }), signal: controller.signal });
      if (!active()) return false;
      const saved = response?.data;
      if (!saved || saved.id !== id || saved.tomado !== registered || !isDoseInstant(saved.data_dose) || Date.parse(saved.data_dose) !== Date.parse(dose.expectedAt)) throw new RequestContractError();
      update(previous => ({ ...previous, confirmed: { ...previous.confirmed, [id]: registered }, status: { ...previous.status, [id]: { pending: false, error: null } } }));
      return true;
    } catch (error) {
      if (!active()) return false;
      update(previous => ({ ...previous, status: { ...previous.status, [id]: { pending: false, error: requestErrorMessage(error), desired: registered, retryNotBefore: error instanceof ApiError && error.status === 429 && error.retryAfter !== undefined ? Date.now() + error.retryAfter * 1000 : undefined } } }));
      return false;
    } finally {
      if (requests.current.get(id) === controller) requests.current.delete(id);
    }
  }, [doses, identity, scope, status, token, visibleDoses]);

  const retry = (id: number) => status[id]?.desired !== undefined ? mutate(id, status[id].desired!) : Promise.resolve(false);
  return { doses: identity && token ? visibleDoses : [], status, mutate, retry };
}
