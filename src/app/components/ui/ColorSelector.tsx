'use client';

import { useId } from 'react';
export const medicationColors = [
  { value: 'Vermelho', swatch: '#FF0000' }, { value: 'Azul', swatch: '#4B00FF' },
  { value: 'Amarelo', swatch: '#FFFF00' }, { value: 'Laranja', swatch: '#FFA500' },
  { value: 'Azul claro', swatch: '#00CFFF' }, { value: 'Branco', swatch: '#FFFFFF' },
  { value: 'Verde claro', swatch: '#00FF7F' }, { value: 'Verde escuro', swatch: '#006400' },
  { value: 'Preto', swatch: '#000000' }, { value: 'Orquídea', swatch: '#DA70D6' },
] as const;
export type ColorSelectorProps = { value: string; onChange: (color: string) => void; disabled?: boolean; name?: string; label?: string };
export default function ColorSelector({ value, onChange, disabled, name, label = 'Cor identificadora' }: ColorSelectorProps) {
  const id = useId();
  return <fieldset disabled={disabled} className="min-w-0 text-[var(--text-primary)]">
    <legend className="mb-2 font-semibold">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {medicationColors.map(color => <label key={color.value} style={{ minHeight: 44, minWidth: 44 }}
        className={`relative inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-[var(--focus)] ${value === color.value ? 'border-[var(--action-primary)] bg-[var(--surface-page)] font-semibold' : 'border-[var(--border-control)] bg-[var(--surface-raised)] hover:bg-[var(--surface-page)]'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
        <input className="peer sr-only" type="radio" name={name ?? id} value={color.value} checked={value === color.value} onChange={() => onChange(color.value)} />
        <span aria-hidden="true" style={{ backgroundColor: color.swatch }} className="h-5 w-5 shrink-0 rounded border border-[var(--border-control)]" />
        <span>{color.value}</span><span aria-hidden="true">{value === color.value ? '(selecionada)' : ''}</span>
      </label>)}
    </div>
  </fieldset>;
}
