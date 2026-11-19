'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import MeusMedicamentosContent from './MeusMedicamentosContent';
import { useSidebar } from '../contexts/SidebarContext';

export default function MeusMedicamentos() {
  const { isOpen } = useSidebar();
  
  return (
    <div className="flex min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      <div className={`min-w-0 flex-1 ${isOpen ? '' : 'md:pt-16'}`}>
        <Suspense fallback={<div className="p-6">Carregando...</div>}>
          <MeusMedicamentosContent />
        </Suspense>
      </div>
    </div>
  );
}
