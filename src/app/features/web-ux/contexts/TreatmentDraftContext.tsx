'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { TreatmentDraft } from '../domain/treatment';

export type TreatmentSummary = { medicationId: number; medicationName: string; firstDoseAt: string };
export type TreatmentIntent = { phase: 'editing' } | { phase: 'submitting' | 'uncertain'; key: string; identity: string; body: string; retryNotBefore?: number } | { phase: 'confirmed'; summary: TreatmentSummary; refreshFailed: boolean };
export const emptyTreatmentDraft: TreatmentDraft = {
  medicationName: '', classification: '', stock: '', expiry: '', amount: '', unit: '', boxUnit: '',
  color: '', reason: '', notes: '', photo: '', firstDoseAt: '', intervalHours: '', duration: '', durationUnit: 'days',
};
type DraftContextValue = {
  identity: string; draft: TreatmentDraft; updateDraft: (patch: Partial<TreatmentDraft>) => void;
  resetDraft: () => void; intent: TreatmentIntent; setIntent: (intent: TreatmentIntent) => void;
  summary: TreatmentSummary | null; setSummary: (summary: TreatmentSummary | null) => void;
};
const DraftContext = createContext<DraftContextValue | null>(null);
function IdentityDraft({ identity, children }: { identity: string; children: ReactNode }) {
  const [draft, setDraft] = useState<TreatmentDraft>({ ...emptyTreatmentDraft });
  const [intent, setIntent] = useState<TreatmentIntent>({ phase: 'editing' });
  const [summary, setSummary] = useState<TreatmentSummary | null>(null);
  function updateDraft(patch: Partial<TreatmentDraft>) {
    if (identity && intent.phase === 'editing') setDraft(previous => ({ ...previous, ...patch }));
  }
  return <DraftContext.Provider value={{ identity, draft, updateDraft, resetDraft: () => setDraft({ ...emptyTreatmentDraft }), intent, setIntent, summary, setSummary }}>{children}</DraftContext.Provider>;
}
export function TreatmentDraftProvider({ identity, children }: { identity: string; children: ReactNode }) {
  return <IdentityDraft key={identity} identity={identity}>{children}</IdentityDraft>;
}
export function useTreatmentDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useTreatmentDraft exige TreatmentDraftProvider');
  return context;
}
