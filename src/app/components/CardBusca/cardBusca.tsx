'use client';

import { useState, useEffect, useMemo } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { ApiError, parseRetryAfter } from '../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../utils/request-errors';
import RequestFeedback from '../RequestFeedback/RequestFeedback';

type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

type Props = {
  onSelect: (medicamento: Medicamento) => void;
  medicamentoInicial?: string; // Nome do medicamento inicial
};

export default function BuscaMedicamento({
  onSelect,
  medicamentoInicial,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(medicamentoInicial || '');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{
    value: Medicamento | null;
    catalog: Medicamento[];
    initial: string | undefined;
    notify: Props['onSelect'];
  } | null>(null);
  const [selectedResult, setSelectedResult] = useState<{
    medicamento: Medicamento;
    catalog: Medicamento[];
  } | null>(null);

  const initialMatch = useMemo(() => medicamentoInicial
    ? medicamentos.find((med) =>
      med.NOME_PRODUTO.trim().toLowerCase() === medicamentoInicial.toLowerCase(),
    ) ?? null
    : null, [medicamentos, medicamentoInicial]);
  // Reconcile a new matching input during render so no stale selection is
  // committed. An unmatched initial value retains the last selection, as before.
  if (initialMatch && (selection?.catalog !== medicamentos ||
    selection.initial !== medicamentoInicial || selection.notify !== onSelect)) {
    setSelection({ value: initialMatch, catalog: medicamentos, initial: medicamentoInicial, notify: onSelect });
  }
  const selectedMedicamento = selection?.value ?? null;

  // Efeito para buscar medicamento quando o componente é carregado com medicamentoInicial
  useEffect(() => {
    if (initialMatch) onSelect(initialMatch);
  }, [initialMatch, medicamentoInicial, onSelect]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv', { signal: controller.signal });
        if (!res.ok) throw new ApiError({ status: res.status, message: 'Falha no catálogo', retryAfter: parseRetryAfter(res.headers.get('Retry-After')) });
        const csvText = await res.text();
        if (!active || controller.signal.aborted) return;
        Papa.parse<Medicamento>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results: ParseResult<Medicamento>) => {
            if (!active || controller.signal.aborted) return;
            if (results.errors.length || !['NOME_PRODUTO', 'DESCRIÇÃO'].every(field => results.meta.fields?.includes(field)) || !results.data.every(row => typeof row.NOME_PRODUTO === 'string' && typeof row.DESCRIÇÃO === 'string')) throw new RequestContractError();
            setMedicamentos(results.data);
          },
        });
      } catch (err) {
        if (active && !controller.signal.aborted) setError(requestErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();
    return () => { active = false; controller.abort(); };
  }, []);

  const filtered = useMemo(() => {
    if (selectedResult?.catalog === medicamentos) return [selectedResult.medicamento];
    if (!searchTerm) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return medicamentos.filter((med) =>
      med.NOME_PRODUTO?.toLowerCase().includes(lowerTerm),
    );
  }, [searchTerm, medicamentos, selectedResult]);

  const handleSearch = (term: string): void => {
    setSearchTerm(term);
    setSelectedResult(null);
    setIsDropdownOpen(true);

    if (term === '') {
      setSelection({ value: null, catalog: medicamentos, initial: medicamentoInicial, notify: onSelect });
      onSelect({ NOME_PRODUTO: '', DESCRIÇÃO: '' });
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleResultClick = (med: Medicamento) => {
    // Atualiza o campo de busca com novo valor
    const nextTerm = med.NOME_PRODUTO.trim();
    setSelectedResult(nextTerm === searchTerm ? { medicamento: med, catalog: medicamentos } : null);
    setSearchTerm(nextTerm);

    // Armazena o medicamento selecionado
    setSelection({ value: med, catalog: medicamentos, initial: medicamentoInicial, notify: onSelect });

    // Fecha o dropdown e atualiza os resultados
    setIsDropdownOpen(false);

    // Garante que sempre chamamos o onSelect com o novo medicamento
    // Usando setTimeout para garantir que a execução ocorra após o ciclo de renderização atual
    setTimeout(() => {
      onSelect(med);
    }, 0);
  };

  return (
    <div className="m-6">
      <div className="relative">
        <div className="bg-white rounded-lg p-4 flex items-center border border-[#037F8C]">
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
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onClick={() => setIsDropdownOpen(true)}
          />
          <button className="text-[#037F8C] ml-2" onClick={toggleDropdown}>
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
                  isDropdownOpen
                    ? 'M4.5 15.75l7.5-7.5 7.5 7.5'
                    : 'M19.5 8.25l-7.5 7.5-7.5-7.5'
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {selectedMedicamento && !isDropdownOpen && (
        <div className="mt-2 px-4 py-2 bg-[#F2F2F2] rounded-md">
          <span className="text-sm text-[#037F8C] font-semibold">
            Selecionado: {selectedMedicamento.NOME_PRODUTO}
          </span>
        </div>
      )}

      {loading && <p role="status">Carregando catálogo...</p>}
      {error && <RequestFeedback context="Ao carregar catálogo de medicamentos" message={error} />}
      {isDropdownOpen && !loading && !error && (
        <div className="absolute mt-1 min-w-7/10 max-w-9/10 rounded-md bg-white border border-[#037F8C] shadow-lg z-10">
          <div className="py-2 flex flex-col gap-1">
            {searchTerm && filtered.length > 0 ? (
              filtered.slice(0, 10).map((med, idx) => (
                <div
                  key={`${med.NOME_PRODUTO}-${idx}`}
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-[#F2F2F2] cursor-pointer KantumruyRegular"
                  onClick={() => handleResultClick(med)}
                >
                  <div>
                    <span className="font-semibold text-[#037F8C]">
                      {med.NOME_PRODUTO.trim()}
                    </span>
                    <span className="ml-2 text-gray-500">{med.DESCRIÇÃO}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 KantumruyRegular">
                {searchTerm
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
