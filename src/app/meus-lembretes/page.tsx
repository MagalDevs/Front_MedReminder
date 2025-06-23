'use client';

import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import Sidebar from '../components/Sidebar/sidebar';
import MeusLembretesContent from './MeusLembretesContent';

export default function MeusLembretesPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <MeusLembretesContent />
      </div>
    </ProtectedRoute>
  );
}
