'use client';

import { Suspense } from 'react';
import Sidebar from '../components/Sidebar/sidebar';
import ConfiguracoesContent from './ConfiguracoesContent';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

export default function Configuracoes() {

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <div className="flex-1">
          <Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ConfiguracoesContent />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}
