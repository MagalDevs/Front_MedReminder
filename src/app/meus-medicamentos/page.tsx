'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import MeusMedicamentosContent from './MeusMedicamentosContent';

export default function MeusMedicamentos() {
  return (
    <>
      <div className="flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <Suspense fallback={<div className="flex-1 p-6">Carregando...</div>}>
          <MeusMedicamentosContent />
        </Suspense>
      </div>
    </>
  );
}
