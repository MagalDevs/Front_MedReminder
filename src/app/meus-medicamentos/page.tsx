'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import MeusMedicamentosContent from './MeusMedicamentosContent';

export default function MeusMedicamentos() {
  
  return (
    <div className="flex min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      <div className="flex-1">
        <Suspense fallback={<div className="p-6">Carregando...</div>}>
          <MeusMedicamentosContent />
        </Suspense>
      </div>
    </div>
  );
}
