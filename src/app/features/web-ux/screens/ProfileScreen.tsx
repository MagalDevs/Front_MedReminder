'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import RequestFeedback, { useRetryDelay } from '../../../components/RequestFeedback/RequestFeedback';
import { isCalendarDate, localDay } from '../domain/agenda';

const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
type Personal = { nome: string; email: string; cep: string; dataNasc: string };
function ProfileForm({ identity }: { identity: string }) {
  const auth = useAuth();
  const [original, setOriginal] = useState<Personal>(() => ({ nome: auth.user?.nome ?? '', email: auth.user?.email ?? '', cep: auth.user?.cep ?? '', dataNasc: typeof auth.user?.dataNasc === 'string' ? auth.user.dataNasc.slice(0, 10) : '' }));
  const [personal, setPersonal] = useState(original); const [passwords, setPasswords] = useState({ senhaAtual: '', novaSenha: '', confirmation: '' });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [profileMessage, setProfileMessage] = useState(''); const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null); const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [notBefore, setNotBefore] = useState(0); const remaining = useRetryDelay(notBefore);
  const pending = useRef<AbortController | null>(null); const form = useRef<HTMLFormElement>(null);
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (pending.current || remaining) return;
    const invalid: Record<string, string> = {};
    if (!personal.nome.trim() || personal.nome.trim().length > 150) invalid.nome = 'Informe seu nome, de 1 a 150 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim()) || personal.email.trim().length > 254) invalid.email = 'Informe um e-mail válido de até 254 caracteres.';
    if (personal.cep.trim() && !/^\d{8}$/.test(personal.cep.replace(/[-\s]/g, ''))) invalid.cep = 'Informe um CEP com 8 dígitos ou deixe em branco.';
    if (personal.dataNasc && (!isCalendarDate(personal.dataNasc) || personal.dataNasc > localDay(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone))) invalid.dataNasc = 'Informe uma data válida que não esteja no futuro.';
    const changesPassword = Object.values(passwords).some(Boolean);
    if (changesPassword) {
      if (!passwords.senhaAtual) invalid.senhaAtual = 'Informe a senha atual.';
      if (passwords.novaSenha.length < 8 || !/[A-Z]/.test(passwords.novaSenha) || !/[a-z]/.test(passwords.novaSenha) || !/\d/.test(passwords.novaSenha) || !/[^A-Za-z0-9\s]/.test(passwords.novaSenha)) invalid.novaSenha = 'Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.';
      if (!passwords.confirmation || passwords.confirmation !== passwords.novaSenha) invalid.confirmation = 'As senhas não coincidem.';
    }
    setErrors(invalid);
    if (Object.keys(invalid).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    const next = { nome: personal.nome.trim(), email: personal.email.trim(), ...(personal.cep.trim() ? { cep: personal.cep.replace(/[-\s]/g, '') } : {}), ...(personal.dataNasc ? { dataNasc: personal.dataNasc } : {}) };
    const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== original[key as keyof Personal]));
    if (!Object.keys(changed).length && !changesPassword) { setProfileMessage('Nenhuma alteração para salvar.'); return; }
    if (Object.keys(changed).length) setProfileMessage('');
    const controller = new AbortController(); pending.current = controller;
    const active = () => !controller.signal.aborted && pending.current === controller && localStorage.getItem('access_token') === token;
    setBusy(true); setProfileError(null); setPasswordError(null); setPasswordMessage('');
    let operation: 'profile' | 'password' = 'profile';
    try {
      if (Object.keys(changed).length) {
        const response = await apiRequest<{ data: NonNullable<typeof auth.user> }>('usuario/me', { method: 'PATCH', signal: controller.signal, body: JSON.stringify(changed) });
        if (!active()) return;
        if (String(response?.data?.id) !== String(auth.user?.id) || !['nome', 'email', 'cep', 'dataNasc'].every(field => response.data[field as keyof typeof response.data] === undefined || typeof response.data[field as keyof typeof response.data] === 'string')) throw new RequestContractError();
        auth.updateProfile(response.data, identity);
        const saved = { ...original, ...next, ...Object.fromEntries(['nome', 'email', 'cep', 'dataNasc'].filter(field => typeof response.data[field as keyof typeof response.data] === 'string').map(field => [field, field === 'dataNasc' ? String(response.data.dataNasc).slice(0, 10) : response.data[field as keyof typeof response.data]])) };
        setOriginal(saved); setPersonal(saved); setProfileMessage('Perfil atualizado.');
      }
      if (changesPassword) {
        operation = 'password';
        await apiRequest('usuario/senha', { method: 'PATCH', onUnauthorized: 'throw', signal: controller.signal, body: JSON.stringify({ senhaAtual: passwords.senhaAtual, novaSenha: passwords.novaSenha }) });
        if (!active()) return;
        setPasswords({ senhaAtual: '', novaSenha: '', confirmation: '' }); setPasswordMessage('Senha atualizada.');
      }
    } catch (cause) {
      if (!active()) return;
      let detail = requestErrorMessage(cause);
      if (operation === 'password' && cause instanceof ApiError && cause.status === 401) {
        const result = await auth.revalidateSession();
        if (!active() || result === 'stale' || result === 'expired') return;
        detail = result === 'valid' ? 'Senha atual incorreta. Sua sessão continua válida.' : 'Não foi possível verificar a sessão. A alteração da senha não foi confirmada.';
      }
      if (!active()) return;
      if (operation === 'profile') setProfileError(detail); else setPasswordError(`Senha não atualizada: ${detail}`);
      setNotBefore(cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0);
    } finally { if (active()) { pending.current = null; setBusy(false); } }
  }
  const initials = (auth.user?.nome ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase();
  return <AppShell title="Perfil" onSignOut={auth.logout}>
    <div className="mb-6 flex items-center gap-4"><span aria-label="Iniciais do nome" className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--action-primary)] font-semibold text-[var(--action-primary-text)]">{initials || 'U'}</span><p className="break-words text-xl font-semibold">{auth.user?.nome}</p></div>
    <form ref={form} noValidate onSubmit={save} className="max-w-3xl space-y-8 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:p-6">
      <section aria-labelledby="profile-data" className="space-y-4"><h2 id="profile-data" className="text-xl font-semibold">Dados pessoais</h2>
        {profileMessage && <RequestFeedback kind="success" message={profileMessage} />}{profileError && <RequestFeedback message={profileError} />}
        <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">{([['nome', 'Nome', 'text', 150], ['email', 'E-mail', 'email', 254], ['cep', 'CEP', 'text', 9], ['dataNasc', 'Data de nascimento', 'date', undefined]] as const).map(([key, label, type, max]) => <FormField key={key} label={label} error={errors[key]} description={key === 'cep' || key === 'dataNasc' ? 'Opcional; deixar em branco preserva o valor cadastrado.' : undefined}><input className={control} type={type} maxLength={max} value={personal[key]} onChange={event => setPersonal({ ...personal, [key]: event.target.value })} /></FormField>)}</fieldset>
      </section>
      <section aria-labelledby="profile-security" className="space-y-4 border-t border-[var(--border-default)] pt-6"><h2 id="profile-security" className="text-xl font-semibold">Segurança</h2><p>Preencha os campos apenas se desejar alterar a senha.</p>
        {passwordMessage && <RequestFeedback kind="success" message={passwordMessage} />}{passwordError && <RequestFeedback message={passwordError} />}
        <fieldset disabled={busy} className="min-w-0 space-y-4">{([['senhaAtual', 'Senha atual'], ['novaSenha', 'Nova senha'], ['confirmation', 'Confirmar nova senha']] as const).map(([key, label]) => <FormField key={key} label={label} error={errors[key]}><input className={control} type="password" autoComplete={key === 'senhaAtual' ? 'current-password' : 'new-password'} value={passwords[key]} onChange={event => setPasswords({ ...passwords, [key]: event.target.value })} /></FormField>)}</fieldset>
      </section>{remaining > 0 && <p role="status">Aguarde {remaining} segundos para tentar novamente.</p>}<Button type="submit" loading={busy} loadingLabel="Salvando…" disabled={remaining > 0}>Salvar alterações</Button>
    </form>
  </AppShell>;
}
export default function ProfileScreen() {
  const auth = useAuth();
  if (auth.sessionStatus !== 'authenticated' || !auth.identityKey) return <RequestFeedback kind="loading" message="Verificando sessão…" />;
  return <ProfileForm key={auth.identityKey} identity={auth.identityKey} />;
}
