'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
type Target = { id: number; name: string };
type Snapshot = { scope: string; target: Target | null; pending: boolean; error: string | null; retryNotBefore?: number; deletedIds: number[] };
export function useMedicationDeletion({ identity }: { identity: string }) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const scope = JSON.stringify([identity, token]);
  const empty: Snapshot = { scope, target: null, pending: false, error: null, deletedIds: [] };
  const [snapshot, setSnapshot] = useState(empty);
  const state = snapshot.scope === scope ? snapshot : empty;
  const request = useRef<AbortController | null>(null);
  useLayoutEffect(() => () => { request.current?.abort(); request.current = null; }, [scope]);
  function requestDeletion(target: Target) {
    if (!identity || !token || request.current || !Number.isSafeInteger(target.id) || target.id <= 0 || !target.name.trim()) return;
    setSnapshot({ ...state, target, error: null, retryNotBefore: undefined });
  }
  function cancel() { if (!request.current) setSnapshot({ ...state, target: null, error: null, retryNotBefore: undefined }); }
  async function confirm() {
    const target = state.target;
    if (!identity || !token || !target || request.current || (state.retryNotBefore ?? 0) > Date.now()) return false;
    const controller = new AbortController(); request.current = controller;
    const active = () => !controller.signal.aborted && localStorage.getItem('access_token') === token;
    setSnapshot({ ...state, pending: true, error: null });
    try {
      const response = await apiRequest<{ message?: string }>(`remedio/${target.id}`, { method: 'DELETE', signal: controller.signal });
      if (!active()) return false;
      if (typeof response?.message !== 'string' || !response.message.trim()) throw new RequestContractError();
      setSnapshot({ ...state, target: null, pending: false, error: null, deletedIds: [...state.deletedIds, target.id] });
      return true;
    } catch (cause) {
      if (active()) setSnapshot({ ...state, pending: false, error: requestErrorMessage(cause), retryNotBefore: cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : undefined });
      return false;
    } finally { if (request.current === controller) request.current = null; }
  }
  return { ...state, requestDeletion, cancel, confirm, retry: confirm,
    confirmation: state.target ? { title: `Excluir ${state.target.name}?`, description: `Excluir ${state.target.name} também remove todas as suas doses.` } : null };
}
