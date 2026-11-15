'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import HistoricoContent from './HistoricoContent';

export default function Historico() {

  return (
    <div className="flex min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      <div className="flex-1">
        <Suspense fallback={<div className="p-6">Carregando...</div>}>
          <HistoricoContent />
        </Suspense>
      </div>
    </div>
  );
}
