'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';

export interface AppShellProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onSignOut?: () => void;
}

const destinations = [
  { href: '/hoje', label: 'Hoje' },
  { href: '/meus-medicamentos', label: 'Medicamentos' },
  { href: '/historico', label: 'Histórico' },
  { href: '/Configuracoes', label: 'Perfil' },
];
const desktopQuery = '(min-width: 768px)';
function subscribeLayout(listener: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
const desktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const serverSnapshot = () => false;

function destinationFor(pathname: string | null) {
  if (pathname === '/meus-lembretes') return '/hoje';
  if (pathname === '/novo-medicamento' || pathname?.startsWith('/meus-medicamentos/')) return '/meus-medicamentos';
  return pathname;
}

export default function AppShell({ title, children, actions, onSignOut }: AppShellProps) {
  const pathname = usePathname();
  const desktop = useSyncExternalStore(subscribeLayout, desktopSnapshot, serverSnapshot);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = destinationFor(pathname);

  function navigation() {
    return <nav aria-label="Navegação principal" className="flex flex-col gap-2 md:flex-row">
      {destinations.map(({ href, label }) => <Link key={href} href={href}
        aria-current={current === href ? 'page' : undefined} onClick={() => setMenuOpen(false)}
        className={`inline-flex min-h-11 min-w-11 items-center rounded-[var(--radius-control)] px-4 py-2 font-medium ${
          current === href ? 'bg-[var(--action-primary)] text-[var(--action-primary-text)]' : 'text-[var(--text-primary)] hover:bg-[var(--surface-page)]'
        }`}>{label}</Link>)}
    </nav>;
  }

  return <div className="min-h-dvh bg-[var(--surface-page)] text-[var(--text-primary)]">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--surface-raised)] focus:p-3">Ir para o conteúdo</a>
    <header className="border-b border-[var(--border-default)] bg-[var(--surface-raised)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <span className="text-xl font-bold text-[var(--brand-signature)]">MedReminder</span>
        {desktop ? <>{navigation()}{onSignOut && <Button variant="secondary" onClick={onSignOut}>Sair</Button>}</>
          : <Button variant="secondary" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>Menu</Button>}
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="min-w-0 break-words text-2xl font-bold">{title}</h1>{actions}
      </div>
      {children}
    </main>
    <Dialog open={menuOpen && !desktop} onClose={() => setMenuOpen(false)} title="Navegação">
      {navigation()}
      {onSignOut && <Button variant="secondary" className="mt-4" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sair</Button>}
    </Dialog>
  </div>;
}
