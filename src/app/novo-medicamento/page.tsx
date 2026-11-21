'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar/sidebar';
import BuscaMedicamento from '../components/CardBusca/cardBusca';
import ConfigurarLembrete from '../components/CardCadastrar/cardCadastrar';
import { useSidebar } from '../contexts/SidebarContext';

type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

function NovoMedicamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const medicamentoInicial = searchParams.get('medicamento');
  const [previousQuery, setPreviousQuery] = useState(medicamentoInicial);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<Medicamento | null>(
    () => medicamentoInicial ? { NOME_PRODUTO: medicamentoInicial, DESCRIÇÃO: '' } : null,
  );
  if (medicamentoInicial !== previousQuery) {
    setPreviousQuery(medicamentoInicial);
    if (medicamentoInicial) {
      setMedicamentoSelecionado({
        NOME_PRODUTO: medicamentoInicial,
        DESCRIÇÃO: '',
      });
    }
  }

  const handleMedicamentoSelecionado = useCallback((medicamento: Medicamento) => {
    setMedicamentoSelecionado(medicamento);
  }, []);
  
  return (
    <div className="flex flex-col gap-4">
      <header className="px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
          Adicionar medicamento
        </h1>
        <p className="text-gray-600 KantumruyRegular">
          Cadastre lembretes para seus medicamentos
        </p>
      </header>

      <BuscaMedicamento
        onSelect={handleMedicamentoSelecionado}
        medicamentoInicial={medicamentoSelecionado?.NOME_PRODUTO}
      />
      {medicamentoSelecionado && (
        <ConfigurarLembrete
          onSaved={() => router.replace('/meus-medicamentos')}
          medicamentoSelecionado={{
            nome: medicamentoSelecionado.NOME_PRODUTO,
            tipo: medicamentoSelecionado.DESCRIÇÃO,
          }}
        />
      )}
    </div>
  );
}

// Componente principal que usa Suspense
export default function Lembrete() {
  const { isOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#E8E6E6]">
      <Sidebar />
      <main className={`min-w-0 flex-1 px-4 pb-6 sm:px-6 ${isOpen ? 'pt-6' : 'pt-20'}`}>
        <Suspense fallback={<p role="status">Carregando...</p>}>
          <NovoMedicamentoContent />
        </Suspense>
      </main>
    </div>
  );
}
