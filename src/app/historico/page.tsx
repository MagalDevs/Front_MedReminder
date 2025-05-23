'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import HistoricoContent from './HistoricoContent';

export default function Historico() {
  return (
    <>
      <div className="flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <Suspense fallback={<div className="flex-1 p-6">Carregando...</div>}>
          <HistoricoContent />
        </Suspense>
      </div>
    </>
  );
}
