'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import Sidebar from '../components/Sidebar/sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import MeusLembretesContent from './MeusLembretesContent';

function LembretesComFiltrosDaUrl() {
  const params = useSearchParams();
  const medicamentoId = params.get('medicamentoId') ?? undefined;
  const nomeMedicamento = params.get('medicamento') ?? undefined;

  return (
    <MeusLembretesContent
      key={medicamentoId ? `id:${medicamentoId}` : `nome:${nomeMedicamento ?? ''}`}
      medicamentoId={medicamentoId}
      nomeMedicamento={nomeMedicamento}
    />
  );
}

export default function MeusLembretesPage() {
  const { isOpen } = useSidebar();

  return (
    <ProtectedRoute>
      <div className="flex min-h-dvh bg-[#e8e6e6]">
        <Sidebar />
        <main className={`@container min-w-0 flex-1 px-4 pb-6 sm:px-10 ${isOpen ? 'pt-10' : 'pt-20'}`}>
          <Suspense>
            <LembretesComFiltrosDaUrl />
          </Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
}
