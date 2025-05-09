"use client"

import { useState, useEffect } from 'react';

export default function BuscaMedicamento() {
    // Estados para controlar a busca e resultados
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [medicamentos, setMedicamentos] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState(null);



    // Função que será chamada quando o usuário digitar no campo de busca
    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        setIsDropdownOpen(true);
        
        if (term.length > 2) {
            setIsSearching(true);
            
            try {
                const resultados = await fetchMedicamentos(term);
                setMedicamentos(resultados);
                setError(null)
            } catch (err) {
                setMedicamentos([])
            } finally {
                setIsSearching(false)
            }

        } else {
            setMedicamentos([]);
            setIsSearching(false);
        }
    };
    
    // Função para alternar a visibilidade do dropdown
    const toggleDropdown = async () => {
        const newDropdownState = !isDropdownOpen;
        setIsDropdownOpen(newDropdownState)
        if (newDropdownState && !searchTerm) {
            setIsSearching(true);

            try {
                const resultados = await fetchMedicamentos('');
                setMedicamentos(resultados)
                setError(null)
            } catch (err) {
                setMedicamentos([])
            } finally {
                setIsSearching(false)
            }
        }
    };

    // Função real que será usada para buscar medicamentos da API
    const fetchMedicamentos = async (term: string | number | boolean) => {
        try {
            // Substitua a URL abaixo pela URL correta da sua API
            const response = await fetch(`/api/medicamentos?search=${encodeURIComponent(term)}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar medicamentos: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Erro na API:", err);
            setError(error);
            throw err;
        }
    };

    return (
        <div className="m-6 p-4 bg-[#D9D9D9] rounded-lg shadow-lg">
            {/* Campo de Busca */}
            <div className="bg-white rounded-lg p-4 flex items-center border border-[#0B6E71]">
                <div className="mr-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#0B6E71"/>
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar medicamento..." 
                    className="flex-1 outline-none text-[#0B6E71] font-medium"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <div 
                    className="ml-2 cursor-pointer" 
                    onClick={toggleDropdown}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10L12 15L17 10H7Z" fill="#0B6E71"/>
                    </svg>
                </div>
            </div>

            {/* Lista de Resultados */}
            {isDropdownOpen && (
                <div className="mt-8 bg-[#0B8E91] rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-6 text-center text-white">
                            <p>Buscando...</p>
                        </div>
                    ) : medicamentos.length > 0 ? (
                        <div>
                            {medicamentos.map((medicamento) => (
                                <div 
                                    key={medicamento.id} 
                                    className="p-4 border-b border-[#0A7E81] flex items-center text-white cursor-pointer hover:bg-[#0A7E81]"
                                    onClick={() => {
                                        setSearchTerm(medicamento.nome);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="bg-white rounded-md p-1 mr-3">
                                        <div 
                                            className="w-8 h-8 rounded-sm" 
                                            style={{ backgroundColor: medicamento.cor }}
                                        ></div>
                                    </div>
                                    <div>
                                        <div className="font-medium">{medicamento.nome}</div>
                                        <div className="text-sm">
                                            {medicamento.dosagem} - {medicamento.tipo} - {medicamento.formato}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchTerm.length > 0 ? (
                        <div className="p-6 text-center text-white">
                            <p>Nenhum resultado encontrado</p>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-white">
                            <p>Digite para buscar medicamentos</p>
                        </div>
                    )}
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-100 text-red-700 mt-2 rounded-lg">
                    <p>Erro: {error}</p>
                </div>
            )}
        </div>
    );
}