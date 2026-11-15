'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginScreen from '../features/web-ux/screens/LoginScreen';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';

function LoginContent() {
  const params = useSearchParams();
  return <LoginScreen returnTo={params.get('returnTo')} />;
}
export default function LoginPage() {
  return <Suspense fallback={<RequestFeedback kind="loading" message="Carregando login…" />}><LoginContent /></Suspense>;
}
