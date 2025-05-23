'use client';

import { usePathname } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
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
    <aside className="min-h-screen w-60 bg-[#D9D9D9] flex flex-col shadow-md">
      {/* Logo */}
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
      
      <div className="flex flex-col gap-8 pl-10 pr-5 pt-7 flex-grow">
        <Link href="/medicamentos" className={getLinkStyle('/medicamentos')}>Meus medicamentos</Link>
        <Link href="/Lembrete" className={getLinkStyle('/Lembrete')}>Lembrete</Link>
        <Link href="/historico" className={getLinkStyle('/historico')}>Histórico</Link>
        <Link href="/configuracoes" className={getLinkStyle('/configuracoes')}>Configurações</Link>
      </div>
      
      <div className="mt-auto pl-10 pr-5 pb-4">
        <p className="KantumruySemiBold text-[#044D55]">User</p>
      </div>
    </aside>
  )
}
