'use client'

import { createContext, ReactNode, useEffect, useState, useCallback } from "react";
import { apiRequest, ApiError } from "../utils/api";

import { useAuth } from "./AuthContext";

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
    const { user, isAuthenticated, loading, logout } = useAuth();
    const identity = !loading && isAuthenticated ? String(user?.id ?? user?.email ?? '') : '';
    const [snapshot, setSnapshot] = useState<{ identity: string; token: string | null; doses: Lembrete[] }>({ identity: '', token: null, doses: [] });
    const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
    const lembretes = identity && snapshot.identity === identity && snapshot.token === token ? snapshot.doses : [];

    const getLembretes = useCallback(async () => {
        if (!identity || !token) return;
        try {
            const response = await apiRequest<{ data: Lembrete[] }>('dose/me', {
                method: 'GET', onUnauthorized: 'throw',
            });
            if (localStorage.getItem('access_token') !== token) return;
            if (!Array.isArray(response.data)) throw new Error('Resposta de doses inv?lida');
            setSnapshot({ identity, token, doses: response.data });
        } catch (error) {
            if (localStorage.getItem('access_token') !== token) return;
            if (error instanceof ApiError && error.status === 401) logout();
            // Never publish stale private data or reject an unattended mount effect.
        }
    }, [identity, token, logout]);

    useEffect(() => {
        let active = true;
        if (!identity || !token) return;
        const load = async () => {
            try {
                const response = await apiRequest<{ data: Lembrete[] }>('dose/me', { method: 'GET', onUnauthorized: 'throw' });
                if (!active || localStorage.getItem('access_token') !== token) return;
                if (Array.isArray(response.data)) setSnapshot({ identity, token, doses: response.data });
            } catch (error) {
                if (active && localStorage.getItem('access_token') === token && error instanceof ApiError && error.status === 401) logout();
            }
        };
        void load();
        return () => { active = false; };
    }, [identity, token, logout]);

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