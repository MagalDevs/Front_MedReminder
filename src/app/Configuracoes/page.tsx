'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import ConfiguracoesContent from './ConfiguracoesContent';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { useSidebar } from '../contexts/SidebarContext';

export default function Configuracoes() {
  const { isOpen } = useSidebar();

  return (
    <ProtectedRoute>
      <div className="flex min-h-dvh bg-[#e8e6e6]">
        <Sidebar />
        <main className={`@container min-w-0 flex-1 px-4 pb-6 sm:px-10 ${isOpen ? 'pt-10' : 'pt-20'}`}>
          <Suspense fallback={<p role="status">Carregando...</p>}>
            <ConfiguracoesContent />
          </Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
}
