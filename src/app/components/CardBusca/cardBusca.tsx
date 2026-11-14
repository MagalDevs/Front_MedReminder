'use client';

import { useState, useEffect, useMemo, useId, useRef } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { ApiError, parseRetryAfter } from '../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../utils/request-errors';
import RequestFeedback from '../RequestFeedback/RequestFeedback';
import Button from '../ui/Button';

export type Medicamento = {
  NOME_PRODUTO: string;
  DESCRIÇÃO: string;
};

type Props = {
  onSelect: (medicamento: Medicamento) => void;
  onManual?: (name: string) => void;
  medicamentoInicial?: string; // Nome do medicamento inicial
};

export default function BuscaMedicamento({
  onSelect,
  onManual,
  medicamentoInicial,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [manual, setManual] = useState(false);
  useEffect(() => () => { if (selectionTimer.current) clearTimeout(selectionTimer.current); }, []);
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

  const initialMatch = useMemo(() => medicamentoInicial && !manual
    ? medicamentos.find((med) =>
      med.NOME_PRODUTO.trim().toLowerCase() === medicamentoInicial.toLowerCase(),
    ) ?? null
    : null, [medicamentos, medicamentoInicial, manual]);
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
    setActiveIndex(-1); setManual(false);
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
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    selectionTimer.current = setTimeout(() => {
      onSelect(med);
    }, 0);
  };

  const options = filtered.slice(0, 10);
  const open = isDropdownOpen && !loading && !error;
  useEffect(() => {
    if (open && activeIndex >= 0) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, listId]);
  function chooseManual() {
    setManual(true); setIsDropdownOpen(false); setSelection(null);
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    if (onManual) onManual(searchTerm.trim());
    else onSelect({ NOME_PRODUTO: searchTerm.trim(), DESCRIÇÃO: '' });
  }
  return (
    <div className="relative min-w-0 text-[var(--text-primary)]" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsDropdownOpen(false);
    }}>
      <label htmlFor={`${listId}-input`} className="mb-2 block font-semibold">Buscar no catálogo</label>
      <div className="flex min-w-0 gap-2">
        <input id={`${listId}-input`} ref={inputRef} type="text" role="combobox" aria-autocomplete="list"
          aria-expanded={!!open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 text-base focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]"
          placeholder="Buscar medicamento..." value={searchTerm} onChange={event => handleSearch(event.target.value)}
          onClick={() => setIsDropdownOpen(true)} onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); setIsDropdownOpen(false); setActiveIndex(-1); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); setIsDropdownOpen(true);
              if (options.length) setActiveIndex(index => !isDropdownOpen || index < 0 ? event.key === 'ArrowDown' ? 0 : options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
            }
            if (event.key === 'Enter' && open && activeIndex >= 0 && options[activeIndex]) { event.preventDefault(); handleResultClick(options[activeIndex]); setActiveIndex(-1); }
          }} />
        <Button variant="secondary" aria-label={isDropdownOpen ? 'Fechar sugestões' : 'Abrir sugestões'} aria-expanded={!!open} aria-controls={listId}
          onClick={() => { toggleDropdown(); inputRef.current?.focus(); }}>Sugestões</Button>
      </div>
      {selectedMedicamento && !isDropdownOpen && <p className="mt-2 text-[var(--action-primary)]">Selecionado: {selectedMedicamento.NOME_PRODUTO.trim()}</p>}
      {loading && <p role="status">Carregando catálogo...</p>}
      {error && <RequestFeedback context="Ao carregar catálogo de medicamentos" message={error} />}
      {open && <div className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border-default)] bg-[var(--surface-raised)]">
        <ul id={listId} role="listbox" aria-label="Medicamentos do catálogo">
          {searchTerm && options.map((med, index) => <li key={`${med.NOME_PRODUTO}-${index}`} id={`${listId}-${index}`} role="option"
            aria-selected={activeIndex === index} onMouseDown={event => event.preventDefault()} onClick={() => handleResultClick(med)}
            className={`min-h-11 cursor-pointer px-4 py-3 hover:bg-[var(--surface-page)] ${activeIndex === index ? 'bg-[var(--surface-page)] outline-2 outline-[var(--focus)] -outline-offset-2' : ''}`}>
            <span className="font-semibold">{med.NOME_PRODUTO.trim()}</span>{' '}<span className="ml-2 text-[var(--text-muted)]">{med.DESCRIÇÃO}</span>
          </li>)}
        </ul>
        {(!searchTerm || options.length === 0) && <p className="p-4 text-[var(--text-muted)]">{searchTerm ? 'Nenhum resultado encontrado' : 'Digite para buscar um medicamento'}</p>}
        {searchTerm && options.length === 0 && <Button variant="secondary" className="m-3" onClick={chooseManual}>Cadastrar manualmente</Button>}
      </div>}
      {error && <Button variant="secondary" className="mt-3" onClick={chooseManual}>Cadastrar manualmente</Button>}
      {manual && <p role="status" className="mt-2">Cadastro manual selecionado. Preencha os dados do medicamento.</p>}
    </div>
  );
}
