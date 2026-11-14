'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export default function Button({
  variant = 'primary', loading = false, loadingLabel, disabled,
  type = 'button', className = '', style, children, ...props
}: ButtonProps) {
  return <button
    {...props}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    style={{ ...style, minHeight: 44, minWidth: 44 }}
    className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-base font-semibold focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)] disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--disabled-surface)] disabled:text-[var(--disabled-text)] ${
      variant === 'primary'
        ? 'border-[var(--action-primary)] bg-[var(--action-primary)] text-[var(--action-primary-text)] enabled:hover:border-[var(--action-primary-hover)] enabled:hover:bg-[var(--action-primary-hover)]'
        : 'border-[var(--action-primary)] bg-[var(--surface-raised)] text-[var(--action-primary)] enabled:hover:bg-[var(--surface-page)]'
    } ${className}`}
  >{loading ? (loadingLabel ?? children) : children}</button>;
}
