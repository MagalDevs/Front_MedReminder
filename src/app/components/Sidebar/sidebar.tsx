'use client';

import { usePathname } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Sidebar() {

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  }

  const pathname = usePathname();

  const getLinkStyle = (path: string) => {
    const baseStyle = "KantumruyMedium px-1 py-1 rounded transition duration-700 ease-in-out";
    const isActive = pathname === path;
    
    return `${baseStyle} ${
      isActive 
      ? "text-[#E0DDDD] bg-[#037F8C] scale-105" 
      : "text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] hover:scale-105"
    }`;
  };

  
  return (
    <>
      {/* Botão para abrir o sidebar - Só aparece quando fechado */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[60] p-2 bg-[#037F8C] text-[#E0DDDD] rounded-lg shadow-lg hover:bg-[#044D55] hover:cursor-pointer transition-colors "
        >
          <Menu size={24} />
        </button>
      )}

      

      {/* Overlay com blur para embaçar o fundo */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-[45]"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        min-h-screen w-60 bg-[#D9D9D9] flex flex-col shadow-md z-[50]
        fixed
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Botão para fechar - Sempre visível */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#037F8C] hover:text-[#E0DDDD] text-[#044D55] transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="pb-5 pt-5 flex justify-center items-center">
          <Link href="/" onClick={() => setIsOpen(false)}>
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
        
        <div className="flex flex-col gap-8 pl-10 pr-5 pt-7 flex-grow">
          <Link 
            href="/medicamentos" 
            className={getLinkStyle('/medicamentos')}
            onClick={() => setIsOpen(false)}
          >
            Meus medicamentos
          </Link>
          <Link 
            href="/Lembrete" 
            className={getLinkStyle('/Lembrete')}
            onClick={() => setIsOpen(false)}
          >
            Lembrete
          </Link>
          <Link 
            href="/historico" 
            className={getLinkStyle('/historico')}
            onClick={() => setIsOpen(false)}
          >
            Histórico
          </Link>
          <Link 
            href="/Configuracoes" 
            className={getLinkStyle('/Configuracoes')}
            onClick={() => setIsOpen(false)}
          >
            Configurações
          </Link>
        </div>
        
        <div className="mt-auto pl-10 pr-5 pb-4">
          <p className="KantumruySemiBold text-[#044D55]">User</p>
        </div>
      </aside>
    </>
  )
}