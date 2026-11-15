'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

function controls(dialog: HTMLDialogElement) {
  return [...dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') &&
      !element.closest('[hidden], [inert]') && getComputedStyle(element).display !== 'none' &&
      getComputedStyle(element).visibility !== 'hidden');
}

export default function Dialog({ open, onClose, title, description, children, initialFocusRef }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const target = initialFocusRef?.current;
    (target && dialog.contains(target) ? target : controls(dialog)[0] ?? dialog).focus();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, [open, initialFocusRef]);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      const items = controls(event.currentTarget);
      const first = items[0] ?? event.currentTarget;
      const last = items.at(-1) ?? event.currentTarget;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) {
        event.preventDefault(); first.focus();
      }
    }
  }

  if (!open) return null;
  return createPortal(<dialog ref={ref} tabIndex={-1} aria-modal="true" aria-labelledby={titleId}
    aria-describedby={description ? descriptionId : undefined} onKeyDown={onKeyDown}
    onCancel={event => { event.preventDefault(); onClose(); }}
    className="wux-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[var(--radius-surface)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-4 text-[var(--text-primary)] backdrop:bg-black/40 sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-4">
      <h2 id={titleId} className="min-w-0 break-words text-xl font-semibold">{title}</h2>
      <Button variant="secondary" aria-label={`Fechar ${title}`} onClick={onClose}>Fechar</Button>
    </div>
    {description && <p id={descriptionId} className="mb-4 text-[var(--text-muted)]">{description}</p>}
    {children}
  </dialog>, document.body);
}
