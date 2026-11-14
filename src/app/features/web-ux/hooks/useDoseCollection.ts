'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError } from '../../../utils/api';
import { requestErrorMessage } from '../../../utils/request-errors';
import { publishNavigationFeedback } from '../../../utils/navigation-feedback';
import { loadDoseCollection, type DoseCollection } from '../data/loadDoseCollection';
import { subscribeDoseConfirmations, type DoseConfirmation } from '../data/dose-confirmations';

/** Owns a stable immutable collection snapshot; clocks and filters never replace it. */
export function useDoseCollection() {
  const { identityKey, sessionStatus, logout } = useAuth();
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const scope = JSON.stringify([identityKey, token]);
  const empty = useMemo<DoseCollection>(() => ({ items: [], complete: false, loading: true, error: null, expectedTotal: null }), []);
  const [snapshot, setSnapshot] = useState<{ scope: string; collection: DoseCollection; retryNotBefore?: number }>({ scope, collection: empty });
  const request = useRef<AbortController | null>(null);
  const deadline = useRef({ scope, at: 0 });
  const confirmations = useRef<DoseConfirmation[]>([]);
  useLayoutEffect(() => {
    confirmations.current = [];
    return subscribeDoseConfirmations(identityKey, value => { if (localStorage.getItem('access_token') === token) confirmations.current.push(value); });
  }, [identityKey, scope, token]);
  const authenticated = sessionStatus === 'authenticated' && !!identityKey && !!token;
  const refresh = useCallback(async (): Promise<DoseCollection> => {
    if (!authenticated || deadline.current.scope === scope && Date.now() < deadline.current.at) return { ...empty, loading: false };
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const start = confirmations.current.length;
    const reconcile = (value: DoseCollection): DoseCollection => ({ ...value, items: value.items.map(dose => {
      if (dose.kind !== 'complete') return dose;
      const confirmed = confirmations.current.slice(start).findLast(item => item.id === dose.id && Date.parse(item.expectedAt) === Date.parse(dose.expectedAt));
      return confirmed ? { ...dose, registered: confirmed.registered } : dose;
    }) });
    const active = () => !controller.signal.aborted && request.current === controller && localStorage.getItem('access_token') === token;
    setSnapshot(previous => ({ scope, collection: { ...(previous.scope === scope ? previous.collection : empty), complete: false, loading: true } }));
    try {
      const result = reconcile(await loadDoseCollection({ signal: controller.signal, onProgress: collection => { if (active()) setSnapshot({ scope, collection: reconcile(collection) }); } }));
      if (result.failure instanceof ApiError && result.failure.status === 401 && active()) {
        logout(); publishNavigationFeedback('session-expired');
      }
      if (active()) {
        const retryNotBefore = result.failure instanceof ApiError && result.failure.status === 429 && result.failure.retryAfter !== undefined ? Date.now() + result.failure.retryAfter * 1000 : undefined;
        deadline.current = { scope, at: retryNotBefore ?? 0 };
        setSnapshot(previous => ({ scope, collection: result.error && result.items.length === 0 && previous.scope === scope ? { ...result, items: previous.collection.items } : result, retryNotBefore }));
      }
      return active() ? result : { ...empty, loading: false };
    } catch (cause) {
      if (active()) setSnapshot(previous => ({ scope, collection: { ...(previous.scope === scope ? previous.collection : empty), loading: false, complete: false, error: requestErrorMessage(cause) } }));
      return { ...empty, loading: false };
    } finally { if (request.current === controller) request.current = null; }
  }, [authenticated, empty, logout, scope, token]);
  useLayoutEffect(() => () => { request.current?.abort(); request.current = null; }, [scope, authenticated]);
  useEffect(() => { if (authenticated) void refresh(); }, [authenticated, refresh]);
  return { collection: authenticated && snapshot.scope === scope ? snapshot.collection : empty, retryNotBefore: snapshot.scope === scope ? snapshot.retryNotBefore : undefined, refresh };
}
