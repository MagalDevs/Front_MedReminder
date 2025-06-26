'use client'

import { createContext, ReactNode, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

interface Lembrete {
    id: number;
    tomado: boolean;
    data_dose: Date;
    usuarioId: number;
    remedioId: number;
    remedio: {
        id: number;
        nome: string;
        classificacao: string;
        quantidadeDiaria: number;
        quantidadeCaixa: number;
        horaInicio: string;
        cor: string;
        unidadeMedida: string;
        motivo: string;
        quantidadeDias: number;
        dataValidade: string;
        foto: Blob;
        observacao: string;
        quantidadeDose: string;
        usuarioId: number;
    };
}

interface LembreteContextType {
    lembretes: Lembrete[];
    lembretesHoje: Lembrete[];
    getLembretes: () => Promise<void>;
}

export const LembreteContext = createContext<LembreteContextType | null>(null)

export const LembreteProvider = ({ children }: { children: ReactNode }) => {
    const [lembretes, setLembretes] = useState<Lembrete[]>([]);

    const getLembretes = async () => {
        const dosesResponse = await apiRequest<{
            message: string;
            data: Lembrete[];
            }>('dose/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
        });        

        if (dosesResponse && dosesResponse.data) {
            setLembretes(dosesResponse.data); 
        } else {
            console.error('Erro ao buscar lembretes:', dosesResponse?.message);
        }
    }

    useEffect(() => {
        getLembretes();
    }, []);

    const lembretesHoje = lembretes.filter((lembrete) => {
        const agora = new Date();
        const fimDoDia = new Date(agora);
        fimDoDia.setHours(23, 59, 59, 999);

        const dataDose = new Date(lembrete.data_dose);

        return (
            dataDose >= agora && dataDose <= fimDoDia
        );
    });
    

    return (
        <LembreteContext.Provider value={{ 
            lembretesHoje,
            lembretes,
            getLembretes
        }}>
            {children}
        </LembreteContext.Provider>
    );
}