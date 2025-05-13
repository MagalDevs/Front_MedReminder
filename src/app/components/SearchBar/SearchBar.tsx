'use client';

import Papa, { ParseResult } from 'papaparse';
import { useEffect, useState } from 'react';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [medicamentos, setMedicamentos] = useState<
    { NOME_PRODUTO: string; DESCRIÇÃO: string }[]
  >([]);
  const [filtered, setFiltered] = useState<
    { NOME_PRODUTO: string; DESCRIÇÃO: string }[]
  >([]);
  const [showCadastrar, setShowCadastrar] = useState(false);

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

  useEffect(() => {
    if (searchQuery.length > 0) {
      setFiltered(
        medicamentos.filter((med) =>
          med.NOME_PRODUTO?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    } else {
      setFiltered([]);
    }
  }, [searchQuery, medicamentos]);

  useEffect(() => {
    if (
      filtered.length === 1 &&
      searchQuery === filtered[0].NOME_PRODUTO.trim()
    ) {
      setShowCadastrar(true);
    } else {
      setShowCadastrar(false);
    }
  }, [filtered, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleResultClick = (med: {
    NOME_PRODUTO: string;
    DESCRIÇÃO: string;
  }) => {
    setSearchQuery(med.NOME_PRODUTO.trim());
    setIsOpen(true);
    setFiltered([med]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="rounded-md border border-[#037F8C] bg-[#F2F2F2] shadow-sm flex items-center pl-3 pr-4 py-2 w-full">
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
          </span>
          <input
            type="text"
            className="flex-1 outline-none text-gray-700 KantumruyMedium"
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
          <div className="py-2 flex flex-col gap-1">
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
                    <button className="ml-4 bg-[#037F8C] text-white px-3 py-1 rounded hover:bg-[#025e6a] transition-colors text-xs">
                      Cadastrar
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 KantumruyRegular">
                {searchQuery
                  ? 'Nenhum resultado encontrado'
                  : 'Digite para buscar um medicamento'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
