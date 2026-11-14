'use client';

import { useEffect, useState } from 'react';
import Button from '../ui/Button';

export interface RequestFeedbackProps {
  message: string;
  context?: string;
  kind?: 'error' | 'success' | 'loading' | 'empty' | 'filtered' | 'warning';
  loading?: boolean;
  retry?: {
    /** The caller retries only the failed operation, never a saved mutation. */
    onRetry: () => void | Promise<void>;
    /** Absolute epoch milliseconds, derived once from ApiError.retryAfter. */
    notBefore?: number;
  };
}

/** Shared by operation controls so every retry observes the same deadline. */
export function useRetryDelay(notBefore?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (notBefore === undefined || !Number.isFinite(notBefore)) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= notBefore) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [notBefore]);
  return notBefore !== undefined && Number.isFinite(notBefore) ? Math.max(0, Math.ceil((notBefore - now) / 1000)) : 0;
}

export default function RequestFeedback({ message, context, kind = 'error', loading = false, retry }: RequestFeedbackProps) {
  const remaining = useRetryDelay(retry?.notBefore);
  const [retrying, setRetrying] = useState(false);
  const busy = loading || retrying || kind === 'loading';
  const colors = kind === 'error'
    ? 'border-[var(--error)] bg-[var(--error-surface)] text-[var(--error)]'
    : kind === 'success'
      ? 'border-[var(--success)] bg-[var(--success-surface)] text-[var(--success)]'
      : kind === 'warning'
        ? 'border-[var(--warning)] bg-[var(--warning-surface)] text-[var(--warning)]'
        : 'border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)]';

  async function retryOperation() {
    if (!retry || busy || remaining > 0 || (retry.notBefore !== undefined && Date.now() < retry.notBefore)) return;
    setRetrying(true);
    try {
      await retry.onRetry();
    } catch {
      // The caller owns the error message and retained data for this operation.
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className={`mb-4 rounded-[var(--radius-control)] border p-3 ${colors}`}>
      <p role={kind === 'error' || kind === 'warning' ? 'alert' : 'status'}>
        {context ? `${context}: ` : ''}{message}
      </p>
      {busy && kind !== 'loading' && <p role="status" className="mt-2">Carregando…</p>}
      {remaining > 0 && <p role="status" className="mt-2">Aguarde {remaining} {remaining === 1 ? 'segundo' : 'segundos'} para tentar novamente.</p>}
      {retry && <Button variant="secondary" className="mt-3" loading={busy} loadingLabel="Carregando…"
        disabled={remaining > 0} onClick={retryOperation}>Tentar novamente</Button>}
    </div>
  );
}
