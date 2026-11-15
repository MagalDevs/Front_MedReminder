'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import RequestFeedback from '../RequestFeedback/RequestFeedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { sessionStatus, rememberReturnTarget } = useAuth();
  const router = useRouter();
  const entered = useRef(false);

  useEffect(() => {
    if (sessionStatus === 'authenticated') entered.current = true;
    // Logout and invalidation already navigate through AuthProvider. Do not
    // recapture the previous route after voluntary logout resets the target.
    if (sessionStatus === 'anonymous' && !entered.current) {
      rememberReturnTarget(window.location.pathname + window.location.search + window.location.hash);
      router.push('/login');
    }
  }, [sessionStatus, rememberReturnTarget, router]);

  if (sessionStatus === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div role="status" aria-label="Verificando sessão" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--action-primary)]"></div>
      </div>
    );
  }
  if (sessionStatus === 'unavailable') return <RequestFeedback kind="loading" message="Sessão indisponível. Tente restaurar a sessão." />;
  if (sessionStatus !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
