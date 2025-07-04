'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';

export default function Sidebar() {
  const { logout, getUserDisplayName } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();

  const pathname = usePathname();

  const getLinkStyle = (path: string) => {
    const baseStyle =
      'KantumruyMedium px-1 py-1 rounded transition duration-700 ease-in-out';
    const isActive = pathname === path;

    return `${baseStyle} ${isActive
        ? 'text-[#E0DDDD] bg-[#037F8C] scale-105'
        : 'text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] hover:scale-105'
      }`;
  };

  return (
    <>
      {/* Botão para abrir o sidebar - Só aparece quando fechado */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[60] p-2 bg-[#037F8C] text-[#E0DDDD] rounded-lg shadow-lg hover:bg-[#044D55] transition-colors"
        >
          <Menu size={24} />
        </button>
      )}      {/* Sidebar */}
      <aside
        className={`
          min-h-screen bg-[#D9D9D9] shadow-md 
          transition-all duration-300 ease-in-out relative
          ${isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0'}
        `}
      >
        {/* Wrapper do conteúdo do sidebar */}
        <div className={`flex flex-col h-full ${isOpen ? 'opacity-100 transition-opacity duration-300 delay-150' : 'opacity-0'}`}>
          {/* Botão para fechar - Posicionado no topo direito do sidebar */}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#037F8C] hover:text-[#E0DDDD] text-[#044D55] transition-colors z-10"
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
          <div className="flex flex-col gap-8 pl-10 pr-5 pt-7 flex-grow">
            <Link
              href="/meus-medicamentos"
              className={getLinkStyle('/meus-medicamentos')}
            >
              Meus medicamentos
            </Link>
            <Link
              href="/meus-lembretes"
              className={getLinkStyle('/meus-lembretes')}
            >
              Meus lembretes
            </Link>
            <Link
              href="/Configuracoes"
              className={getLinkStyle('/Configuracoes')}
            >
              Configurações
            </Link>
          </div>

          {/* Avatar e botão sair no rodapé */}
          <div className="mt-auto pl-10 pr-5 pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#037F8C] p-2 rounded-full">
                <User size={16} className="text-white" />
              </div>
              <p className="KantumruySemiBold text-[#044D55]">
                {getUserDisplayName()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="cursor-pointer flex items-center gap-2 mt-3 text-sm w-full text-left text-[#037F8C]"
              >
                <LogOut size={24}/>
                <span className="KantumruyMedium text-base">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
