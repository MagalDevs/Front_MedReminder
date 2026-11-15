'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../components/Logo/Logo';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import RequestFeedback, { useRetryDelay } from '../../../components/RequestFeedback/RequestFeedback';
import { ApiError, apiRequest } from '../../../utils/api';
import { requestErrorMessage, RequestTimeoutError } from '../../../utils/request-errors';
import { clearNavigationFeedback, publishNavigationFeedback } from '../../../utils/navigation-feedback';
import { isCalendarDate, localDay } from '../domain/agenda';

const control = 'min-h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-base';
const passwordHelp = 'Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.';
export default function RegistrationScreen() {
  const router = useRouter(); const [step, setStep] = useState(0);
  const [values, setValues] = useState({ email: '', senha: '', confirmation: '', nome: '', cpf: '', cep: '', dataNasc: '', cuidador: false });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [notBefore, setNotBefore] = useState(0);
  const remaining = useRetryDelay(notBefore); const pending = useRef<{ active: boolean; controller: AbortController; timer?: ReturnType<typeof setTimeout> } | null>(null); const form = useRef<HTMLFormElement>(null); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => { if (pending.current) { pending.current.active = false; pending.current.controller.abort(); clearTimeout(pending.current.timer); pending.current = null; } }, []);
  function move(next: number) { setStep(next); setErrors({}); requestAnimationFrame(() => heading.current?.focus()); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending.current || remaining) return;
    const invalid: Record<string, string> = {};
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 254) invalid.email = 'Informe um e-mail válido de até 254 caracteres.';
      if (values.senha.length < 8 || !/[A-Z]/.test(values.senha) || !/[a-z]/.test(values.senha) || !/\d/.test(values.senha) || !/[^A-Za-z0-9\s]/.test(values.senha)) invalid.senha = passwordHelp;
      if (values.confirmation !== values.senha || !values.confirmation) invalid.confirmation = 'As senhas não coincidem.';
    } else {
      if (!values.nome.trim() || values.nome.trim().length > 150) invalid.nome = 'Informe seu nome, de 1 a 150 caracteres.';
      if (!/^\d{11}$/.test(values.cpf.replace(/[.\-\s]/g, ''))) invalid.cpf = 'Informe um CPF com exatamente 11 dígitos.';
      if (!/^\d{8}$/.test(values.cep.replace(/[-\s]/g, ''))) invalid.cep = 'Informe um CEP com exatamente 8 dígitos.';
      if (!isCalendarDate(values.dataNasc) || values.dataNasc > localDay(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone)) invalid.dataNasc = 'Informe uma data de nascimento válida que não esteja no futuro.';
    }
    setErrors(invalid); setError(null);
    if (Object.keys(invalid).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    if (step === 0) { move(1); return; }
    const attempt = { active: true, controller: new AbortController(), timer: undefined as ReturnType<typeof setTimeout> | undefined };
    pending.current = attempt; const active = () => attempt.active && pending.current === attempt;
    const deadline = new Promise<never>((_resolve, reject) => {
      attempt.timer = setTimeout(() => { reject(new RequestTimeoutError()); attempt.controller.abort(); }, 15_000);
    });
    setBusy(true); clearNavigationFeedback();
    try {
      await Promise.race([deadline, apiRequest('usuario', { method: 'POST', requireAuth: false, expectedStatus: 201, signal: attempt.controller.signal, body: JSON.stringify({ nome: values.nome.trim(), email: values.email.trim(), senha: values.senha, cpf: values.cpf.replace(/[.\-\s]/g, ''), cep: values.cep.replace(/[-\s]/g, ''), dataNasc: values.dataNasc, cuidador: values.cuidador }) })]);
      if (!active()) return;
      publishNavigationFeedback('registered'); setValues(previous => ({ ...previous, senha: '', confirmation: '' })); router.push('/login');
    } catch (cause) { if (active()) { setError(requestErrorMessage(cause, 'registration')); setNotBefore(cause instanceof ApiError && cause.status === 429 && cause.retryAfter !== undefined ? Date.now() + cause.retryAfter * 1000 : 0); } }
    finally { clearTimeout(attempt.timer); if (active()) { attempt.active = false; pending.current = null; setBusy(false); } }
  }
  const field = (key: Exclude<keyof typeof values, 'cuidador'>, label: string, type = 'text', maxLength?: number, autoComplete?: string) => <FormField key={key} label={label} error={errors[key]} description={key === 'senha' ? passwordHelp : undefined}><input className={control} type={type} required maxLength={maxLength} autoComplete={autoComplete} inputMode={key === 'cpf' || key === 'cep' ? 'numeric' : undefined} value={values[key]} onChange={event => setValues({ ...values, [key]: event.target.value })} /></FormField>;
  return <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:py-12">
    <Link href="/" aria-label="MedReminder, página inicial" className="inline-flex min-h-11 items-center"><Logo width={140} heading={false} /></Link>
    <section className="space-y-6 rounded-[var(--radius-surface)] bg-[var(--surface-raised)] p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Criar conta</h1><ol aria-label="Etapas do cadastro" className="flex flex-wrap gap-4"><li aria-current={step === 0 ? 'step' : undefined}>1. Conta</li><li aria-current={step === 1 ? 'step' : undefined}>2. Dados pessoais</li></ol>
      <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">{step === 0 ? 'Conta' : 'Dados pessoais'}</h2>
      {error && <RequestFeedback message={error} />}
      <form ref={form} noValidate onSubmit={submit} className="space-y-6">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          {step === 0 ? <>{field('email', 'E-mail', 'email', 254, 'email')}{field('senha', 'Senha', visible ? 'text' : 'password', undefined, 'new-password')}{field('confirmation', 'Confirmar senha', visible ? 'text' : 'password', undefined, 'new-password')}<Button variant="secondary" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar senha' : 'Mostrar senha'}</Button></> : <>{field('nome', 'Nome completo', 'text', 150, 'name')}{field('cpf', 'CPF', 'text', 14)}{field('cep', 'CEP', 'text', 9, 'postal-code')}{field('dataNasc', 'Data de nascimento', 'date', undefined, 'bday')}<label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={values.cuidador} onChange={event => setValues({ ...values, cuidador: event.target.checked })} />Sou cuidador</label>
            <section aria-label="Confira os dados obrigatórios" className="space-y-2 border-t border-[var(--border-default)] pt-4"><h3 className="font-semibold">Confira antes de criar a conta</h3><p>Obrigatórios: e-mail, senha, nome, CPF, CEP e data de nascimento.</p><dl className="space-y-2 break-words"><div><dt>E-mail</dt><dd>{values.email}</dd></div><div><dt>Nome</dt><dd>{values.nome || 'Não preenchido'}</dd></div><div><dt>CPF</dt><dd>{values.cpf || 'Não preenchido'}</dd></div><div><dt>CEP</dt><dd>{values.cep || 'Não preenchido'}</dd></div><div><dt>Nascimento</dt><dd>{values.dataNasc || 'Não preenchido'}</dd></div><div><dt>Cuidador</dt><dd>{values.cuidador ? 'Sim' : 'Não'}</dd></div><div><dt>Senha</dt><dd>Preenchida na etapa Conta</dd></div></dl></section>
          </>}
        </fieldset>
        {remaining > 0 && <p role="status">Aguarde {remaining} segundos para tentar novamente.</p>}
        <div className="flex flex-wrap gap-3">{step === 1 && <Button variant="secondary" disabled={busy} onClick={() => move(0)}>Voltar para Conta</Button>}<Button type="submit" loading={busy} loadingLabel="Criando conta…" disabled={remaining > 0}>{step === 0 ? 'Continuar' : 'Criar conta'}</Button></div>
      </form><Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-[var(--action-primary)] underline">Já tenho conta. Entrar</Link>
    </section>
  </main>;
}
