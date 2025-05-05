'use client';

import { useState } from 'react';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
        <div className="absolute mt-1 w-full rounded-md bg-white border border-[#037F8C] shadow-lg z-10">
          <div className="py-2">
            {/* Aqui você pode adicionar resultados da pesquisa quando tiver dados */}
            <div className="px-4 py-2 text-sm text-gray-500 KantumruyRegular">
              {searchQuery ? 'Buscando...' : 'Nenhum resultado encontrado'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
