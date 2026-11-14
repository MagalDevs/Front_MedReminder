'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '../../../components/Logo/Logo';
import BuscaMedicamento, { type Medicamento } from '../../../components/CardBusca/cardBusca';

export default function HomeScreen() {
  const [selected, setSelected] = useState<Medicamento | null>(null);
  return <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:py-12">
    <Logo width={180} heading={false} />
    <section className="space-y-6">
      <h1 className="max-w-xl text-3xl font-semibold">Medicamentos e doses em um só lugar</h1>
      <p className="max-w-prose text-lg text-[var(--text-muted)]">Organize seus medicamentos, consulte os horários cadastrados e acompanhe os registros de doses.</p>
      <div className="flex flex-wrap gap-4">
        <Link href="/cadastro" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--action-primary)] bg-[var(--action-primary)] px-4 py-2 font-semibold text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)]">Criar conta</Link>
        <Link href="/login" className="inline-flex min-h-11 items-center px-4 py-2 font-semibold text-[var(--action-primary)] underline underline-offset-4">Entrar</Link>
      </div>
    </section>
    <section aria-labelledby="public-catalog" className="space-y-4 border-t border-[var(--border-default)] pt-8">
      <h2 id="public-catalog" className="text-xl font-semibold">Consultar catálogo de medicamentos</h2>
      <p className="text-[var(--text-muted)]">A busca pode ser consultada sem conta. Para adicionar medicamentos à sua agenda, entre ou crie uma conta.</p>
      <BuscaMedicamento onSelect={setSelected} />
      {selected?.NOME_PRODUTO && <div role="status" className="space-y-2 break-words"><h3 className="text-xl font-semibold">{selected.NOME_PRODUTO}</h3><p>{selected.DESCRIÇÃO || 'Medicamento informado manualmente.'}</p></div>}
    </section>
  </main>;
}
