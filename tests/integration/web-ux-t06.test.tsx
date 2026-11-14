import { useEffect, useState, type AnchorHTMLAttributes } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AppShell from '@/app/components/layout/AppShell';

const router = vi.hoisted(() => ({ path: '/hoje', navigate: (href: string): void => { throw new Error(`Route fixture not mounted: ${href}`); } }));
vi.mock('next/navigation', () => ({ usePathname: () => router.path }));
// A controlled route boundary; real Next route migration/browser checks are later tasks.
vi.mock('next/link', () => ({ default: ({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
  <a {...props} href={href} onClick={event => { event.preventDefault(); onClick?.(event); router.navigate(href!); }} />,
}));

let wide = false;
let media: EventTarget;
beforeEach(() => {
  wide = false;
  router.path = '/hoje';
  media = new EventTarget();
  vi.stubGlobal('matchMedia', () => ({ matches: wide, addEventListener: media.addEventListener.bind(media), removeEventListener: media.removeEventListener.bind(media) }));
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

const titles: Record<string, string> = { '/hoje': 'Hoje', '/meus-medicamentos': 'Medicamentos', '/historico': 'Histórico', '/Configuracoes': 'Perfil' };
function Example() {
  const [path, setPath] = useState(router.path);
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => { router.navigate = next => { router.path = next; setPath(next); }; }, []);
  return signedOut ? <h1>Você saiu da conta</h1> : <AppShell title={titles[path] ?? 'Agenda'} onSignOut={() => setSignedOut(true)}>
    <p>Conteúdo de {titles[path] ?? 'Agenda'}</p><button>Adicionar medicamento</button>
  </AppShell>;
}

it('WUX_NAV_02 selects each destination and renders its named screen with accessible current state', async () => {
  wide = true;
  render(<Example />);
  for (const label of ['Medicamentos', 'Histórico', 'Perfil', 'Hoje']) {
    await userEvent.click(screen.getByRole('link', { name: label }));
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeVisible();
    expect(screen.getByText(`Conteúdo de ${label}`)).toBeVisible();
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter(link => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(screen.getByRole('heading', { name: 'Você saiu da conta' })).toBeVisible();
});

it('WUX_ACCESS_04 excludes closed menu content from keyboard and accessibility and restores focus on Escape', async () => {
  render(<Example />);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Medicamentos' })).not.toBeInTheDocument();
  await userEvent.tab();
  expect(screen.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveFocus();
  await userEvent.tab();
  const menu = screen.getByRole('button', { name: 'Menu' });
  expect(menu).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(menu).toHaveAttribute('aria-expanded', 'true');
  const dialog = screen.getByRole('dialog', { name: 'Navegação' });
  expect(within(dialog).getByRole('navigation')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  expect(menu).toHaveFocus();
  expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Adicionar medicamento' })).toHaveFocus();
});

it('WUX_T06_NARROW navigates from the modal, closes it, and supports responsive presentation and legacy current state', async () => {
  router.path = '/meus-lembretes';
  render(<Example />);
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
  await userEvent.click(screen.getByRole('link', { name: 'Medicamentos' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Medicamentos' })).toBeVisible();
  await act(async () => { wide = true; media.dispatchEvent(new Event('change')); });
  expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Medicamentos' })).toHaveAttribute('aria-current', 'page');
  await act(async () => { wide = false; media.dispatchEvent(new Event('change')); });
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});
