'use client';

import { Suspense, useCallback, useContext, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { useAuth } from '../contexts/AuthContext';
import { LembreteContext } from '../contexts/lembreteContext';
import TreatmentWizard from '../features/web-ux/components/TreatmentWizard';
import { emptyTreatmentDraft, useTreatmentDraft } from '../features/web-ux/contexts/TreatmentDraftContext';

function NewMedicationContent() {
  const params = useSearchParams();
  const initial = params.get('medicamento')?.trim() ?? '';
  const { draft, intent, updateDraft } = useTreatmentDraft();
  const { logout } = useAuth();
  const reminders = useContext(LembreteContext);
  useEffect(() => {
    const pristine = Object.entries(emptyTreatmentDraft).every(([field, value]) => draft[field as keyof typeof draft] === value);
    if (intent.phase === 'editing' && pristine && initial && initial.length <= 150 && !/[\u0000-\u001f\u007f]/.test(initial)) updateDraft({ medicationName: initial });
  }, [draft, intent.phase, initial, updateDraft]);
  const refresh = useCallback(async () => {
    if (!reminders) return false;
    return reminders.getLembretes();
  }, [reminders]);
  return <TreatmentWizard refresh={refresh} onSignOut={logout} />;
}
export default function NewMedicationPage() {
  return <ProtectedRoute><Suspense fallback={<RequestFeedback kind="loading" message="Carregando formulário…" />}><NewMedicationContent /></Suspense></ProtectedRoute>;
}
