'use client';

import { Trash2 } from 'lucide-react';
import { useId, useLayoutEffect, useRef } from 'react';
import styles from './feedback.module.css';

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const finish = (action: () => void) => {
    dialogRef.current?.close();
    action();
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      className={styles.confirm}
      onCancel={(event) => {
        event.preventDefault();
        finish(onCancel);
      }}
    >
      <div className={styles.confirmContent}>
        <span className={styles.icon}><Trash2 size={21} aria-hidden="true" /></span>
        <div>
          <h2 id={titleId}>{title}</h2>
          <p id={messageId}>{message}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className="med-button med-button--ghost" onClick={() => finish(onCancel)}>
          Cancelar
        </button>
        <button type="button" className={`med-button ${styles.dangerButton}`} onClick={() => finish(onConfirm)}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
