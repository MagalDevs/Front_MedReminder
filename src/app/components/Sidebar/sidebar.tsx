'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';
import ProfileAvatar from '../ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';

const navigationItems = [
  { href: '/meus-medicamentos', label: 'Meus medicamentos' },
  { href: '/meus-lembretes', label: 'Meus lembretes' },
  { href: '/Configuracoes', label: 'Configurações' },
];

const mobileQuery = '(width < 48rem)';
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;
const subscribeToViewport = (onChange: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

export default function Sidebar() {
  const { logout, getUserDisplayName, profilePhoto } = useAuth();
  const { isOpen, toggleSidebar, setIsOpen } = useSidebar();
  const isMobile = useSyncExternalStore(subscribeToViewport, mobileSnapshot, serverSnapshot);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) {
      openRef.current?.focus();
      return;
    }
    const panel = panelRef.current;
    if (!isMobile || !panel) return;

    const background = Array.from(panel.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement &&
        element !== panel && element !== backdropRef.current)
      .map(element => ({ element, inert: element.inert }));
    background.forEach(({ element }) => { element.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      } else if (event.key === 'Tab') {
        const controls = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    panel.addEventListener('keydown', handleKeyDown);
    return () => {
      panel.removeEventListener('keydown', handleKeyDown);
      background.forEach(({ element, inert }) => { element.inert = inert; });
      document.body.style.overflow = overflow;
    };
  }, [isMobile, isOpen, setIsOpen]);

  return (
    <>
      {/* Botão para abrir o sidebar - Só aparece quando fechado */}
      {!isOpen && (
        <button
          ref={openRef}
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          aria-expanded={false}
          aria-controls="menu-lateral"
          className="med-button med-button--primary fixed top-4 left-4 z-[60] px-2"
        >
          <Menu size={24} />
        </button>
      )}
      {isMobile && isOpen && (
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        ref={panelRef}
        id="menu-lateral"
        role={isMobile ? 'dialog' : undefined}
        aria-modal={isMobile && isOpen ? true : undefined}
        aria-label="Menu principal"
        inert={!isOpen}
        className={`
          h-dvh shrink-0 self-start bg-[#D9D9D9] shadow-md overflow-x-hidden overflow-y-auto
          sticky top-0 max-md:fixed max-md:left-0 z-50
          transition-[width,opacity] duration-300 ease-in-out motion-reduce:transition-none
          ${isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0'}
        `}
      >
        {/* Wrapper do conteúdo do sidebar */}
        <div className={`flex flex-col ${isOpen ? 'opacity-100 transition-opacity duration-300 delay-150 motion-reduce:transition-none' : 'opacity-0'}`}>
          {/* Botão para fechar - Posicionado no topo direito do sidebar */}
          <button
            ref={closeRef}
            onClick={toggleSidebar}
            aria-label="Fechar menu"
            aria-expanded={true}
            aria-controls="menu-lateral"
            className="med-button med-button--ghost absolute top-1 right-1 px-2 z-10"
          >
            <X size={20} />
          </button>          {/* Logo */}
          <div className="pb-5 pt-5 flex justify-center items-center">
            <Link href="/">
              <Image
                src="/assets/LogoDeitada.png"
                alt="MedReminder Logo"
                width={160}
                height={40}
                className="pr-5"
              />
            </Link>
          </div>

          <div className="h-[1px] bg-[#037F8C] w-full"></div>

          {/* Links de navegação */}
          <nav aria-label="Navegação principal" className="mt-6 mr-4 ml-11 flex flex-col gap-2">
            {navigationItems.map(({ href, label }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`KantumruyMedium flex min-h-11 items-center rounded-md py-2 pr-2 pl-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55] motion-reduce:transition-none ${isCurrent
                    ? 'bg-[#037F8C] text-white'
                    : 'text-[#044D55] hover:bg-[#037F8C] hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Conta */}
          <div className="mx-4 mt-6 flex flex-col gap-2 border-t border-[#B8C5C6] pt-4 pb-8">
            <div className="flex items-center gap-2">
              <ProfileAvatar photo={profilePhoto} size={32} className="bg-[#037F8C] text-white" />
              <p className="min-w-0 break-words KantumruySemiBold text-[#044D55]">
                {getUserDisplayName()}
              </p>
            </div>
            <button
              onClick={logout}
              className="med-button med-button--ghost w-full justify-start px-0"
            >
              <span aria-hidden="true" className="flex w-8 shrink-0 justify-center">
                <LogOut size={24} />
              </span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
