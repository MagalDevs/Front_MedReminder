'use client';

import { cloneElement, useId, type AriaAttributes, type ReactElement, type ReactNode } from 'react';

type ControlProps = AriaAttributes & { id?: string };
export interface FormFieldProps {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  children: ReactElement<ControlProps>;
}

export default function FormField({ id, label, description, error, children }: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? children.props.id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const describedBy = [children.props['aria-describedby'], description ? descriptionId : '', error ? errorId : '']
    .filter(Boolean).join(' ') || undefined;

  return <div className="flex min-w-0 flex-col gap-2 text-[var(--text-primary)]">
    <label htmlFor={controlId} className="font-semibold">{label}</label>
    {description && <p id={descriptionId} className="text-sm text-[var(--text-muted)]">{description}</p>}
    {cloneElement(children, { id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
    {error && <p id={errorId} role="alert" className="text-sm font-medium text-[var(--error)]">{error}</p>}
  </div>;
}
