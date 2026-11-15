'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/layout/AppShell';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { useAuth } from '../contexts/AuthContext';
import TodayScreen from '../features/web-ux/screens/TodayScreen';

function AgendaContent() {
  const params = useSearchParams();
  const raw = params.get('medicamentoId');
  const { logout } = useAuth();
  const id = raw !== null && /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : undefined;
  if (raw !== null && id === undefined) return <AppShell title="Agenda de doses" onSignOut={logout}>
    <RequestFeedback message="Identificador de medicamento inválido. Abra os horários pela lista de Medicamentos." />
    <Link href="/hoje" className="inline-flex min-h-11 items-center font-semibold text-[var(--action-primary)] underline">Ver Hoje</Link>
  </AppShell>;
  return <TodayScreen mode="agenda" medicationId={id} />;
}
export default function AgendaPage() {
  return <ProtectedRoute><Suspense fallback={<RequestFeedback kind="loading" message="Carregando agenda…" />}><AgendaContent /></Suspense></ProtectedRoute>;
}
