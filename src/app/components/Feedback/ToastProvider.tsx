'use client';

import { CircleAlert, CircleCheck, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './feedback.module.css';

const icons = { success: CircleCheck, warning: TriangleAlert, error: CircleAlert };
type ToastKind = keyof typeof icons;
type Toast = { id: number; kind: ToastKind; message: string };
type ShowToast = (kind: ToastKind, message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useToast requer ToastProvider');
  return showToast;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const nextId = useRef(0);
  const showToast = useCallback<ShowToast>((kind, message) => {
    setToast({ id: ++nextId.current, kind, message });
  }, []);

  const dismiss = () => {
    setToast(null);
    setHovered(false);
    setFocused(false);
  };

  useEffect(() => {
    if (!toast || hovered || focused) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast, hovered, focused]);

  const Icon = toast && icons[toast.kind];

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={styles.viewport}
        data-kind={toast?.kind}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        {Icon && <span className={styles.icon}><Icon size={21} aria-hidden="true" /></span>}
        <div className={styles.message}>
          <div aria-live="polite" aria-atomic="true">
            {toast?.kind === 'success' && <p key={toast.id}>{toast.message}</p>}
          </div>
          <div aria-live="assertive" aria-atomic="true">
            {toast && toast.kind !== 'success' && <p key={toast.id}>{toast.message}</p>}
          </div>
        </div>
        {toast && (
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Fechar notificação"
            onClick={dismiss}
          >
            <X size={19} aria-hidden="true" />
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
