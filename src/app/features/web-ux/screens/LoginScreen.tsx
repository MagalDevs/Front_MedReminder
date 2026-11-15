'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../components/Logo/Logo';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import RequestFeedback, { useRetryDelay } from '../../../components/RequestFeedback/RequestFeedback';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import { clearNavigationFeedback, consumeNavigationFeedback, subscribeNavigationFeedback, type NavigationFeedback } from '../../../utils/navigation-feedback';

const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
export default function LoginScreen({ returnTo }: { returnTo?: string | null }) {
  const auth = useAuth(); const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [notBefore, setNotBefore] = useState(0);
  const [notice, setNotice] = useState<NavigationFeedback | null>(null); const pending = useRef<AbortController | null>(null);
  const sessionGeneration = useRef(auth.identityGeneration);
  useEffect(() => { sessionGeneration.current = auth.identityGeneration; }, [auth.identityGeneration]);
  const remaining = useRetryDelay(notBefore);
  const completeSignOutNavigation = auth.completeSignOutNavigation;
  useEffect(() => { completeSignOutNavigation(); }, [completeSignOutNavigation]);
  useEffect(() => { const read = () => { const next = consumeNavigationFeedback(); if (next) setNotice(next); }; read(); return subscribeNavigationFeedback(read); }, []);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending.current || remaining) return;
    const controller = new AbortController(); pending.current = controller;
    const previousToken = localStorage.getItem('access_token');
    const previousGeneration = sessionGeneration.current;
    const active = () => pending.current === controller && !controller.signal.aborted &&
      localStorage.getItem('access_token') === previousToken && sessionGeneration.current === previousGeneration;
    let loadingProfile = false;
    setBusy(true); setError(null); setNotice(null); clearNavigationFeedback();
    try {
      const response = await apiRequest<{ access_token: string }>('auth/login', { method: 'POST', requireAuth: false, signal: controller.signal, body: JSON.stringify({ email: email.trim(), senha: password }) });
      if (!active()) return;
      if (typeof response?.access_token !== 'string' || !response.access_token.trim()) throw new RequestContractError();
      loadingProfile = true;
      const profile = await apiRequest<{ data: NonNullable<typeof auth.user> }>('usuario/me', { method: 'GET', requireAuth: false, signal: controller.signal, headers: { Authorization: `Bearer ${response.access_token}` } });
      if (!active()) return;
      if (!profile?.data?.id) throw new RequestContractError();
      const destination = auth.consumeReturnTarget(returnTo); auth.login(response.access_token, profile.data); setPassword(''); router.push(destination);
    } catch (cause) { if (active()) {
      if (loadingProfile && previousToken) auth.logout();
      const message = requestErrorMessage(cause, loadingProfile ? 'operation' : 'login');
      setError(loadingProfile ? `Não foi possível carregar seu perfil. Faça o login novamente. ${message ?? ''}`.trim() : message);
      setNotBefore(cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0);
    } }
    finally { if (pending.current === controller && !controller.signal.aborted) { pending.current = null; setBusy(false); } }
  }
  return <main className="mx-auto w-full max-w-lg space-y-6 px-4 py-8 sm:py-12">
    <Link href="/" aria-label="MedReminder, página inicial" className="inline-flex min-h-11 items-center"><Logo width={140} heading={false} /></Link>
    <section className="space-y-6 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Entrar</h1><p className="text-[var(--text-muted)]">Acesse seus medicamentos e a agenda de doses.</p>
      {notice === 'registered' && <RequestFeedback kind="success" message="Cadastro concluído! Entre com seu e-mail e senha." />}
      {notice === 'session-expired' && <RequestFeedback message="Sessão expirada. Entre novamente." />}
      {error && <RequestFeedback message={error} />}
      <form onSubmit={submit} className="space-y-4">
        <FormField label="E-mail"><input className={control} type="email" autoComplete="username" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></FormField>
        <FormField id="login-password" label="Senha"><input className={control} type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></FormField>
        <Button variant="secondary" aria-pressed={visible} aria-controls="login-password" onClick={() => setVisible(!visible)}>{visible ? 'Ocultar senha' : 'Mostrar senha'}</Button>
        {remaining > 0 && <p role="status">Aguarde {remaining} segundos para tentar novamente.</p>}
        <Button type="submit" className="w-full" loading={busy} loadingLabel="Entrando…" disabled={remaining > 0}>Entrar</Button>
      </form>
      <Link href="/cadastro" className="inline-flex min-h-11 items-center font-semibold text-[var(--action-primary)] underline">Criar conta</Link>
    </section>
  </main>;
}
