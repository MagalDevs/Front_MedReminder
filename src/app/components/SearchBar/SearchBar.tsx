'use client';

import Papa, { ParseResult } from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Medicamento = { NOME_PRODUTO: string; DESCRIÇÃO: string };

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [selectedResult, setSelectedResult] = useState<{
    medicamento: Medicamento;
    catalog: Medicamento[];
  } | null>(null);

  useEffect(() => {
    fetch('/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<{ NOME_PRODUTO: string; DESCRIÇÃO: string }>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (
            results: ParseResult<{ NOME_PRODUTO: string; DESCRIÇÃO: string }>,
          ) => {
            setMedicamentos(results.data);
          },
        });
      });
  }, []);

  const filtered = useMemo(() => {
    if (selectedResult?.catalog === medicamentos) return [selectedResult.medicamento];
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return medicamentos.filter((med) =>
      med.NOME_PRODUTO?.toLowerCase().includes(lowerQuery),
    );
  }, [searchQuery, medicamentos, selectedResult]);
  const showCadastrar = filtered.length === 1 &&
    searchQuery === filtered[0].NOME_PRODUTO.trim();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedResult(null);
    setIsOpen(true);
  };

  const handleResultClick = (med: {
    NOME_PRODUTO: string;
    DESCRIÇÃO: string;
  }) => {
    const nextQuery = med.NOME_PRODUTO.trim();
    // An unchanged query keeps the explicit row selection; a changed query is
    // filtered against the catalog, preserving matching duplicate/prefix names.
    setSelectedResult(nextQuery === searchQuery ? { medicamento: med, catalog: medicamentos } : null);
    setSearchQuery(nextQuery);
    setIsOpen(true);
  };
  const handleCadastrarClick = (medicamento: string) => {
    router.push(
      `/novo-medicamento?medicamento=${encodeURIComponent(medicamento.trim())}`,
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="rounded-md border border-[#037F8C] bg-white shadow-sm flex items-center pl-3 pr-4 py-2 w-full">
          <span className="text-gray-500 mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>{' '}
          <input
            type="text"
            className="flex-1 outline-none text-gray-700 KantumruyMedium bg-white"
            placeholder="Buscar medicamento..."
            value={searchQuery}
            onChange={handleInputChange}
            onClick={() => setIsOpen(true)}
          />
          <button
            className="text-[#037F8C] ml-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  isOpen
                    ? 'M4.5 15.75l7.5-7.5 7.5 7.5'
                    : 'M19.5 8.25l-7.5 7.5-7.5-7.5'
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md bg-white border border-[#037F8C] shadow-lg z-10 max-h-72 overflow-y-auto">
          <div className="flex flex-col">
            {searchQuery && filtered.length > 0 ? (
              filtered.slice(0, 10).map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-[#F2F2F2] cursor-pointer KantumruyRegular"
                  onClick={() => handleResultClick(med)}
                >
                  <div>
                    <span className="font-semibold text-[#037F8C]">
                      {med.NOME_PRODUTO.trim()}
                    </span>
                    <span className="ml-2 text-gray-500">{med.DESCRIÇÃO}</span>
                  </div>
                  {showCadastrar && idx === 0 && (
                    <button
                      className="ml-4 bg-[#037F8C] text-white px-3 py-1 rounded hover:bg-[#025e6a] transition-colors text-xs"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique propague para o item da lista
                        handleCadastrarClick(med.NOME_PRODUTO);
                      }}
                    >
                      Cadastrar
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center pl-3 pr-4 py-2 text-sm text-gray-500 KantumruyRegular w-full">
                <span className="text-gray-500 mr-2 w-5 h-5"></span>
                <span className="flex-1">
                  {searchQuery
                    ? 'Nenhum resultado encontrado'
                    : 'Digite para buscar um medicamento'}
                </span>
                <span className="ml-2 w-5 h-5"></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
