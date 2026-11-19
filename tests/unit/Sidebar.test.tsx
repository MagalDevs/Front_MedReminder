import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '@/app/components/Sidebar/sidebar';
import { SidebarProvider } from '@/app/contexts/SidebarContext';

vi.mock('next/navigation', () => ({ usePathname: () => '/meus-medicamentos' }));
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn(), getUserDisplayName: () => 'Usuário de teste' }),
}));

function mountSidebar() {
  let mobile = true;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: mobile,
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  })));
  const view = render(
    <SidebarProvider>
      <div>
        <Sidebar />
        <main><button>Adicionar medicamento</button></main>
      </div>
    </SidebarProvider>,
  );
  return {
    ...view,
    background: screen.getByRole('main'),
    desktop: () => act(() => { mobile = false; listeners.forEach(listener => listener()); }),
  };
}

describe('Menu móvel acessível', () => {
  it('contém o foco, bloqueia o fundo e restaura o foco ao fechar com Escape', () => {
    const { background } = mountSidebar();
    const close = screen.getByRole('button', { name: 'Fechar menu' });
    const logout = screen.getByRole('button', { name: 'Sair' });
    expect(screen.getByRole('dialog', { name: 'Menu principal' })).toHaveAttribute('aria-modal', 'true');
    expect(background.inert).toBe(true);
    expect(close).toHaveFocus();
    logout.focus();
    fireEvent.keyDown(logout, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(logout).toHaveFocus();
    fireEvent.keyDown(logout, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus();
    expect(background.inert).not.toBe(true);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('libera o fundo ao mudar para desktop e ao desmontar', () => {
    const view = mountSidebar();
    expect(view.background.inert).toBe(true);
    view.desktop();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(view.background.inert).not.toBe(true);
    expect(document.body.style.overflow).not.toBe('hidden');
    view.unmount();

    const nextView = mountSidebar();
    nextView.unmount();
    expect(nextView.background.inert).not.toBe(true);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
